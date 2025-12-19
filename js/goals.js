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
                <button onclick="shiftGoal('${g.id}')">Shift</button>
                <button onclick="editGoal('${g.id}')" style="background:#4CAF50; margin-left:10px;">Edit</button>
                <button onclick="deleteGoal('${g.id}')" style="background:red; margin-left:10px;">Delete</button>
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

    // Shift the starting week forward by N weeks
    const oldStartWeek = goal.startWeek || WeekUtils.getCurrentWeek();
    const newStartWeek = WeekUtils.addWeeks(oldStartWeek, shiftVal);
    goal.startWeek = newStartWeek;

    // Update all week labels
    goal.weeks.forEach((w, idx) => {
        w.weekLabel = WeekUtils.addWeeks(newStartWeek, idx);
    });

    StorageManager.saveData('ppm_goals', goals);
    renderGoals();
    alert(`Goal "${goal.title}" shifted forward by ${shiftVal} week(s). New start: ${WeekUtils.formatWeekDisplay(newStartWeek)}`);
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
    document.querySelector('.goal-creator h3').textContent = 'Edit Goal';
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
    document.querySelector('.goal-creator h3').textContent = 'Define New Goal';
}
