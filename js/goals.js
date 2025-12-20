/* js/goals.js */

let tempWeeksData = []; // Store temporary week data before saving
let editingGoalId = null; // Track which goal is being edited

document.addEventListener('DOMContentLoaded', () => {
    renderGoals();
    // Set default starting week to current week
    document.getElementById('goalStartWeek').value = WeekUtils.getCurrentWeek();
    updateClock();
    setInterval(updateClock, 1000);
});

function updateClock() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('navClock').textContent = now.toLocaleDateString('en-US', options);
}

function setCurrentWeek() {
    document.getElementById('goalStartWeek').value = WeekUtils.getCurrentWeek();
}

// Step 1: Generate Input Fields for Weeks (Collapsible by Month/Year)
function initializeGoalInput() {
    const weeks = parseInt(document.getElementById('goalDuration').value);
    const startWeek = document.getElementById('goalStartWeek').value.trim();
    const container = document.getElementById('weeksInputs');
    container.innerHTML = '';
    tempWeeksData = [];

    if(!weeks || weeks < 1) return;

    // Validate startWeek format (YYYY-WW)
    if(startWeek && !startWeek.match(/^\d{4}-\d{1,2}$/)) {
        alert("Invalid starting week format. Use YYYY-WW (e.g., 2025-51)");
        return;
    }

    const baseWeek = startWeek || WeekUtils.getCurrentWeek();
    
    // Extract calendar year from baseWeek (YYYY-WW format)
    const startYear = parseInt(baseWeek.split('-')[0]);
    
    // Group weeks into months (4 weeks) and years (52 weeks)
    const totalMonths = Math.ceil(weeks / 4);
    const totalYears = Math.ceil(weeks / 52);
    
    let weekCounter = 1;
    
    for(let year = 0; year < totalYears; year++) {
        const yearDiv = document.createElement('details');
        yearDiv.className = 'year-group';
        yearDiv.open = (year === 0); // First year open by default
        
        const weeksInThisYear = Math.min(52, weeks - (year * 52));
        const monthsInThisYear = Math.ceil(weeksInThisYear / 4);
        const calendarYear = startYear + year;
        
        yearDiv.innerHTML = `<summary>${calendarYear} - Year ${year + 1} (Months ${year * 13 + 1}-${year * 13 + monthsInThisYear}, ~${weeksInThisYear} weeks)</summary>`;
        
        for(let month = 0; month < monthsInThisYear; month++) {
            const monthDiv = document.createElement('details');
            monthDiv.className = 'month-group';
            monthDiv.open = (year === 0 && month === 0); // First month open
            
            const weeksInThisMonth = Math.min(4, weeks - weekCounter + 1);
            const globalMonthNum = year * 13 + month + 1;
            
            monthDiv.innerHTML = `<summary>Month ${globalMonthNum} (Weeks ${weekCounter}-${weekCounter + weeksInThisMonth - 1})</summary>`;
            
            const monthContent = document.createElement('div');
            monthContent.className = 'month-content';
            
            for(let w = 0; w < weeksInThisMonth && weekCounter <= weeks; w++) {
                const weekLabel = WeekUtils.addWeeks(baseWeek, weekCounter - 1);
                const weekDiv = document.createElement('div');
                weekDiv.className = 'week-input-row';
                weekDiv.innerHTML = `
                    <span>W${weekCounter} (${weekLabel})</span>
                    <input type="number" class="w-hours" placeholder="Hours" id="h-${weekCounter}">
                    <input type="text" class="w-desc" placeholder="Sub-goal" id="d-${weekCounter}">
                `;
                monthContent.appendChild(weekDiv);
                weekCounter++;
            }
            
            monthDiv.appendChild(monthContent);
            yearDiv.appendChild(monthDiv);
        }
        
        container.appendChild(yearDiv);
    }
    
    document.getElementById('weeksContainer').classList.remove('hidden');
}

// Step 2: Save the Goal to Storage
function saveFinalGoal() {
    const title = document.getElementById('goalTitle').value;
    const duration = parseInt(document.getElementById('goalDuration').value);
    const startWeek = document.getElementById('goalStartWeek').value.trim() || WeekUtils.getCurrentWeek();
    const weeksArr = [];

    for(let i=1; i<=duration; i++) {
        weeksArr.push({
            weekNum: i,
            weekLabel: WeekUtils.addWeeks(startWeek, i - 1),
            hours: document.getElementById(`h-${i}`).value || 0,
            subGoal: document.getElementById(`d-${i}`).value || "No Description",
            isPaused: false
        });
    }

    const goalData = {
        title: title,
        totalWeeks: duration,
        startWeek: startWeek,
        weeks: weeksArr,
        startDate: new Date().toISOString()
    };
    
    if(editingGoalId) {
        // Update existing goal
        goalData.id = editingGoalId;
        let goals = StorageManager.getGoals();
        const index = goals.findIndex(g => g.id === editingGoalId);
        if(index !== -1) {
            goals[index] = goalData;
            localStorage.setItem('ppm_goals', JSON.stringify(goals));
        }
        editingGoalId = null;
    } else {
        // Add new goal
        StorageManager.addGoal(goalData);
    }
    
    location.reload();
}

// Step 3: Render and Shift Logic
function renderGoals() {
    const list = document.getElementById('activeGoalsList');
    const goals = StorageManager.getGoals();
    list.innerHTML = '';

    goals.forEach(g => {
        const div = document.createElement('div');
        div.className = 'goal-card';
        
        let html = `<h3>${g.title} (${g.totalWeeks} Weeks)</h3>`;
        html += `<p style="color:#666; font-size:0.9rem;">Starts: ${WeekUtils.formatWeekDisplay(g.startWeek || WeekUtils.getCurrentWeek())}</p>`;
        
        // Week Viewer
        html += `<div class="week-scroll">`;
        g.weeks.forEach((w, idx) => {
            const style = w.isPaused ? "background:#ddd; color:#999;" : "";
            const subGoalText = w.subGoal && w.subGoal !== 'No Description' ? w.subGoal : '';
            html += `
                <div class="mini-week" style="${style}">
                    <b>W${idx+1}</b><br>
                    <small>${w.weekLabel || ''}</small><br>
                    ${w.isPaused ? "PAUSED" : w.hours + "h"}<br>
                    ${subGoalText ? `<small class="sub-goal-text">${subGoalText}</small>` : ''}
                </div>
            `;
        });
        html += `</div>`;

        // Shift Controls
        html += `
            <div class="shift-controls">
                <label>Unexpected Event? Shift Goal Start by Weeks:</label>
                <input type="number" id="shift-${g.id}" placeholder="Weeks to delay" style="width:100px;">
                <button onclick="shiftGoal('${g.id}')" style="margin-bottom:8px;">Shift</button>
                <button onclick="editGoal('${g.id}')" style="background:#4CAF50; margin-bottom:8px;">Edit</button>
                <button onclick="deleteGoal('${g.id}')" style="background:red; margin-bottom:8px;">Delete</button>
            </div>
        `;
        
        div.innerHTML = html;
        list.appendChild(div);
    });
}

function shiftGoal(id) {
    const shiftVal = parseInt(document.getElementById(`shift-${id}`).value);
    if(!shiftVal || shiftVal < 1) return;

    let goals = StorageManager.getGoals();
    const goalIndex = goals.findIndex(g => g.id === id);
    if(goalIndex === -1) return;

    const goal = goals[goalIndex];
    
    console.log(`[SHIFT GOAL] Goal ID: ${id}`);
    console.log(`[SHIFT GOAL] Current start week: ${goal.startWeek}`);
    console.log(`[SHIFT GOAL] Total weeks: ${goal.totalWeeks}`);
    console.log(`[SHIFT GOAL] Shifting by: ${shiftVal} weeks`);

    // Shift the starting week forward by N weeks
    const oldStartWeek = goal.startWeek || WeekUtils.getCurrentWeek();
    const newStartWeek = WeekUtils.addWeeks(oldStartWeek, shiftVal);
    
    console.log(`[SHIFT GOAL] Old start: ${oldStartWeek}, New start: ${newStartWeek}`);
    
    goal.startWeek = newStartWeek;

    // Update all week labels
    goal.weeks.forEach((w, idx) => {
        w.weekLabel = WeekUtils.addWeeks(newStartWeek, idx);
    });

    StorageManager.saveData('ppm_goals', goals);
    
    // Shift the planner slots for this goal
    shiftGoalPlannerSlots(id, oldStartWeek, newStartWeek, goal.totalWeeks);
    
    renderGoals();
    alert(`Goal "${goal.title}" shifted forward by ${shiftVal} week(s). New start: ${WeekUtils.formatWeekDisplay(newStartWeek)}\n\nPlanner time slots have been moved to the new weeks.`);
}

function deleteGoal(id) {
    if(confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        let goals = StorageManager.getGoals().filter(g => g.id !== id);
        StorageManager.saveData('ppm_goals', goals);
        renderGoals();
    }
}

function editGoal(id) {
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => g.id === id);
    if(!goal) return;
    
    editingGoalId = id;
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDuration').value = goal.totalWeeks;
    document.getElementById('goalStartWeek').value = goal.startWeek || WeekUtils.getCurrentWeek();
    
    // Initialize the week inputs
    initializeGoalInput();
    
    // Populate existing week data
    goal.weeks.forEach((w, idx) => {
        const weekNum = idx + 1;
        const hoursInput = document.getElementById(`h-${weekNum}`);
        const descInput = document.getElementById(`d-${weekNum}`);
        if(hoursInput) hoursInput.value = w.hours || 0;
        if(descInput) descInput.value = w.subGoal || '';
    });
    
    // Update UI text
    document.querySelector('.collapsible-header span').textContent = 'Edit Goal';
    const saveButton = document.querySelector('#weeksContainer button');
    if(saveButton) saveButton.textContent = 'Update Goal';
    
    window.scrollTo(0, 0);
}

function cancelEditGoal() {
    editingGoalId = null;
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDuration').value = '';
    document.getElementById('goalStartWeek').value = WeekUtils.getCurrentWeek();
    document.getElementById('weeksContainer').classList.add('hidden');
    document.getElementById('weeksInputs').innerHTML = '';
    document.querySelector('.collapsible-header span').textContent = 'Define New Goal';
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
}

function resetAllData() {
    const confirmMsg = "⚠️ WARNING: This will permanently delete ALL data!\n\nThis includes:\n• All habits\n• All goals\n• All week plans\n• All custom events\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?";
    
    if(confirm(confirmMsg)) {
        const doubleCheck = confirm("Final confirmation: Delete everything and start fresh?");
        if(doubleCheck) {
            localStorage.clear();
            alert("All data has been reset. The application will reload.");
            location.href = 'landing.html';
        }
    }
}

// Shift planner slots when goal is shifted
function shiftGoalPlannerSlots(goalId, oldStartWeek, newStartWeek, totalWeeks) {
    // Normalize week formats
    oldStartWeek = WeekUtils.normalizeWeek(oldStartWeek);
    newStartWeek = WeekUtils.normalizeWeek(newStartWeek);
    
    console.log(`[SHIFT] Goal ${goalId}: ${oldStartWeek} -> ${newStartWeek} (${totalWeeks} weeks)`);
    
    // STEP 1: Collect all data from old weeks first (before modifying anything)
    const weeksToMove = [];
    
    for(let i = 0; i < totalWeeks; i++) {
        const oldWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(oldStartWeek, i));
        const oldWeekKey = `ppm_plan_${oldWeek}`;
        
        const oldPlanData = localStorage.getItem(oldWeekKey);
        if(!oldPlanData) continue;
        
        try {
            const oldPlan = JSON.parse(oldPlanData);
            
            // Filter slots that belong to this goal
            const goalSlots = {};
            const remainingSlots = {};
            
            Object.keys(oldPlan).forEach(key => {
                const slot = oldPlan[key];
                if(slot.type === 'goal' && slot.goalId === goalId) {
                    goalSlots[key] = slot;
                } else {
                    remainingSlots[key] = slot;
                }
            });
            
            if(Object.keys(goalSlots).length > 0) {
                weeksToMove.push({
                    weekIndex: i,
                    oldWeek: oldWeek,
                    oldWeekKey: oldWeekKey,
                    goalSlots: goalSlots,
                    remainingSlots: remainingSlots
                });
            }
        } catch(e) {
            console.error(`[SHIFT] Error parsing ${oldWeekKey}:`, e);
        }
    }
    
    console.log(`[SHIFT] Found ${weeksToMove.length} weeks with data to move`);
    
    // STEP 2: Write all new week data FIRST (before deleting old weeks)
    weeksToMove.forEach(weekData => {
        const newWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(newStartWeek, weekData.weekIndex));
        const newWeekKey = `ppm_plan_${newWeek}`;
        
        console.log(`[SHIFT] Moving week ${weekData.weekIndex + 1}: ${weekData.oldWeek} -> ${newWeek} (${Object.keys(weekData.goalSlots).length} slots)`);
        
        // Add goal slots to new week
        const newPlanData = localStorage.getItem(newWeekKey);
        const newPlan = newPlanData ? JSON.parse(newPlanData) : {};
        
        Object.keys(weekData.goalSlots).forEach(key => {
            newPlan[key] = weekData.goalSlots[key];
        });
        
        localStorage.setItem(newWeekKey, JSON.stringify(newPlan));
    });
    
    // STEP 3: Now remove goal slots from old weeks (after all new data is written)
    weeksToMove.forEach(weekData => {
        const newWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(newStartWeek, weekData.weekIndex));
        
        // Only delete from old week if it's different from new week
        if(weekData.oldWeek !== newWeek) {
            if(Object.keys(weekData.remainingSlots).length > 0) {
                localStorage.setItem(weekData.oldWeekKey, JSON.stringify(weekData.remainingSlots));
            } else {
                localStorage.removeItem(weekData.oldWeekKey);
            }
        }
    });
    
    console.log('[SHIFT] Complete!');
}
