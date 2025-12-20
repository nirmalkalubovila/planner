/* js/planner.js */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let currentTool = 'erase'; 
let allocatedHours = 0;
let gridState = {}; // Key: "dayIndex-hour", Value: { type, name }
let currentWeek = WeekUtils.normalizeWeek(WeekUtils.getCurrentWeek()); // Track current viewing week

document.addEventListener('DOMContentLoaded', () => {
    console.log(`[INIT] Starting planner for week ${currentWeek}`);
    initGrid();
    updateWeekDisplay();
    loadHabitsIntoGrid();
    populateGoalSelect();
    loadSavedPlan();
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

function updateWeekDisplay() {
    const display = document.getElementById('currentWeekDisplay');
    display.innerText = WeekUtils.formatWeekDisplay(currentWeek);
}

function changeWeek(delta) {
    currentWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(currentWeek, delta));
    updateWeekDisplay();
    
    // Clear and reload grid for new week
    initGrid();
    loadHabitsIntoGrid();
    populateGoalSelect(); // Refresh goal dropdown for new week
    loadSavedPlan();
    loadGoalStats(); // Refresh goal stats for new week
}

function initGrid() {
    const grid = document.getElementById('gridContainer');
    grid.innerHTML = '';

    // Create 48 half-hour slots (24 hours * 2) * 7 days
    for(let slot=0; slot<48; slot++) {
        const hour = Math.floor(slot / 2);
        const minutes = (slot % 2) * 30;
        
        // Time Label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.innerText = `${hour}:${minutes.toString().padStart(2, '0')}`;
        grid.appendChild(timeLabel);

        // 7 Days columns
        for(let d=0; d<7; d++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.day = d;
            cell.dataset.slot = slot;
            cell.id = `c-${d}-${slot}`;
            cell.onclick = () => handleCellClick(d, slot);
            grid.appendChild(cell);
        }
    }
}

// --- TOOLS & PAINTING ---

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active-tool'));
    document.getElementById(`t-${tool}`).classList.add('active-tool');

    if(tool === 'custom') {
        document.getElementById('customInput').classList.remove('hidden');
    } else {
        document.getElementById('customInput').classList.add('hidden');
    }
}

function handleCellClick(day, slot) {
    const cell = document.getElementById(`c-${day}-${slot}`);
    
    // Check if locked by Habit (Habits cannot be erased by paint tool here ideally, or warn user)
    if(cell.classList.contains('locked-habit')) {
        alert("This slot is occupied by a fixed Habit.");
        return;
    }

    const key = `${day}-${slot}`;

    if(currentTool === 'erase') {
        cell.className = 'grid-cell';
        cell.innerText = '';
        delete gridState[key];
    } 
    else if (currentTool === 'goal') {
        const activeGoalId = document.getElementById('activeGoalSelector').value;
        if(!activeGoalId) {
            alert('Please select a goal first before painting goal slots.');
            return;
        }
        cell.className = 'grid-cell cell-goal';
        cell.innerText = 'GOAL';
        gridState[key] = { type: 'goal', name: 'Goal Work', goalId: activeGoalId };
    }
    else if (currentTool === 'custom') {
        const name = document.getElementById('customEventName').value || 'Event';
        cell.className = 'grid-cell cell-custom';
        cell.innerText = name;
        gridState[key] = { type: 'custom', name: name };
    }
    updateStats();
}

// --- DATA LOADING ---

function loadHabitsIntoGrid() {
    const habits = StorageManager.getHabits();
    
    habits.forEach(habit => {
        // Check if habit should be visible in current week
        const habitStartDay = habit.startDay || WeekUtils.getCurrentDay();
        const { year: hYear, week: hWeek } = WeekUtils.parseDay(habitStartDay);
        const { year: cYear, week: cWeek } = WeekUtils.parseWeek(currentWeek);
        
        // Only show habit if current week is >= habit's start week
        if (cYear < hYear || (cYear === hYear && cWeek < hWeek)) {
            return; // Skip this habit - it hasn't started yet
        }

        // Parse time with 30-minute granularity
        const [startHour, startMin] = habit.startTime.split(':').map(Number);
        const [endHour, endMin] = habit.endTime.split(':').map(Number);
        
        // Convert to slot numbers (2 slots per hour)
        const startSlot = startHour * 2 + (startMin >= 30 ? 1 : 0);
        const endSlot = endHour * 2 + (endMin >= 30 ? 1 : 0);

        // Habits apply to ALL days (0-6)
        for(let d=0; d<7; d++) {
            for(let slot=startSlot; slot<endSlot; slot++) {
                const cell = document.getElementById(`c-${d}-${slot}`);
                if(cell) {
                    cell.classList.add('locked-habit');
                    cell.innerText = habit.name;
                    // We don't add to gridState because habits are static overlays
                }
            }
        }
    });
}

function populateGoalSelect() {
    const sel = document.getElementById('activeGoalSelector');
    sel.innerHTML = '<option value="">-- Select a Goal --</option>';
    
    const goals = StorageManager.getGoals();
    
    // Normalize current week for consistent comparison
    const normalizedCurrentWeek = WeekUtils.normalizeWeek(currentWeek);
    
    // Filter goals that are active in current week or will be active
    goals.forEach(g => {
        const goalStartWeek = WeekUtils.normalizeWeek(g.startWeek || WeekUtils.getCurrentWeek());
        const goalEndWeek = WeekUtils.addWeeks(goalStartWeek, g.totalWeeks - 1);
        
        // Check if current week falls within goal's timeline (started and not finished)
        const hasStarted = WeekUtils.compareWeeks(normalizedCurrentWeek, goalStartWeek) >= 0;
        const notFinished = WeekUtils.compareWeeks(normalizedCurrentWeek, goalEndWeek) <= 0;
        
        // Show goal if it's active in current week
        if (hasStarted && notFinished) {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.innerText = g.title;
            sel.appendChild(opt);
        }
    });
}

function loadGoalStats() {
    const id = document.getElementById('activeGoalSelector').value;
    if(!id) {
        document.getElementById('goalStats').innerText = '';
        return;
    }

    const goal = StorageManager.getGoals().find(g => g.id === id);
    if(!goal) return;

    const goalStartWeek = goal.startWeek || WeekUtils.getCurrentWeek();
    
    // Calculate which week of the goal we're viewing
    const weeksSinceStart = WeekUtils.compareWeeks(currentWeek, goalStartWeek);
    
    if (weeksSinceStart < 0) {
        document.getElementById('goalStats').innerText = "This goal hasn't started yet.";
        return;
    }
    
    // Find the corresponding week in the goal's weeks array
    const goalWeekIndex = weeksSinceStart;
    
    if (goalWeekIndex >= goal.weeks.length) {
        document.getElementById('goalStats').innerText = "Goal completed or beyond planned weeks.";
        return;
    }
    
    const activeWeek = goal.weeks[goalWeekIndex];
    
    if(activeWeek) {
        const requiredSlots = activeWeek.hours * 2; // 2 slots per hour
        document.getElementById('goalStats').innerHTML = `
            <strong>Week ${goalWeekIndex + 1} of ${goal.totalWeeks}</strong><br>
            Target: <b>${activeWeek.hours}h (${requiredSlots} slots)</b><br>
            Sub-goal: "${activeWeek.subGoal}"
        `;
    } else {
        document.getElementById('goalStats').innerText = "No data for this week.";
    }
}

function updateStats() {
    // Count goal cells (each cell = 30 minutes)
    let slotCount = 0;
    Object.values(gridState).forEach(v => {
        if(v.type === 'goal') slotCount++;
    });
    const hours = slotCount * 0.5; // Each slot is 30 minutes = 0.5 hours
    document.getElementById('allocatedCount').innerText = `${slotCount} slots (${hours}h)`;
}

// --- SAVING ---

function saveWeekPlan() {
    // Normalize and save plan with week identifier
    const normalizedWeek = WeekUtils.normalizeWeek(currentWeek);
    const weekKey = `ppm_plan_${normalizedWeek}`;
    
    console.log(`[SAVE] Saving plan for ${normalizedWeek}`);
    console.log(`[SAVE] Grid state has ${Object.keys(gridState).length} slots`);
    console.log(`[SAVE] Key: ${weekKey}`);
    console.log(`[SAVE] Data:`, gridState);
    
    localStorage.setItem(weekKey, JSON.stringify(gridState));
    alert(`Week Plan Saved for ${WeekUtils.formatWeekDisplay(normalizedWeek)}!`);
}

function loadSavedPlan() {
    // Reset grid state first
    gridState = {};
    
    const normalizedWeek = WeekUtils.normalizeWeek(currentWeek);
    const weekKey = `ppm_plan_${normalizedWeek}`;
    console.log(`[LOAD] Loading plan for ${normalizedWeek}, key: ${weekKey}`);
    
    const saved = localStorage.getItem(weekKey);
    if(saved) {
        try {
            gridState = JSON.parse(saved);
            console.log(`[LOAD] Found ${Object.keys(gridState).length} slots in ${normalizedWeek}`);
            console.log(`[LOAD] Data:`, gridState);
            
            Object.keys(gridState).forEach(key => {
                const [d, slot] = key.split('-');
                const data = gridState[key];
                const cell = document.getElementById(`c-${d}-${slot}`);
                if(cell && !cell.classList.contains('locked-habit')) {
                    cell.innerText = data.name;
                    if(data.type === 'goal') cell.classList.add('cell-goal');
                    if(data.type === 'custom') cell.classList.add('cell-custom');
                }
            });
            updateStats();
        } catch(e) {
            console.error(`[LOAD] Error loading plan for ${normalizedWeek}:`, e);
            gridState = {};
        }
    } else {
        console.log(`[LOAD] No saved plan for ${normalizedWeek}`);
    }
}

function clearPlan() {
    if(confirm("Clear all planned blocks for this week?")) {
        gridState = {};
        const normalizedWeek = WeekUtils.normalizeWeek(currentWeek);
        const weekKey = `ppm_plan_${normalizedWeek}`;
        localStorage.removeItem(weekKey);
        location.reload();
    }
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
}

// Function to shift planner slots when a goal is shifted
function shiftPlannerSlots(goalId, oldStartWeek, newStartWeek, totalWeeks) {
    // Normalize week formats
    oldStartWeek = WeekUtils.normalizeWeek(oldStartWeek);
    newStartWeek = WeekUtils.normalizeWeek(newStartWeek);
    
    // Calculate the shift amount
    const shiftAmount = WeekUtils.compareWeeks(newStartWeek, oldStartWeek);
    
    if(shiftAmount === 0) return; // No shift needed
    
    console.log(`Shifting goal ${goalId} from ${oldStartWeek} to ${newStartWeek} (${totalWeeks} weeks)`);
    
    // Process each week in the goal's range
    for(let i = 0; i < totalWeeks; i++) {
        const oldWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(oldStartWeek, i));
        const newWeek = WeekUtils.normalizeWeek(WeekUtils.addWeeks(newStartWeek, i));
        
        const oldWeekKey = `ppm_plan_${oldWeek}`;
        const newWeekKey = `ppm_plan_${newWeek}`;
        
        console.log(`Processing week ${i + 1}: ${oldWeek} -> ${newWeek}`);
        
        // Load old week plan
        const oldPlanData = localStorage.getItem(oldWeekKey);
        if(!oldPlanData) {
            console.log(`  No plan found for ${oldWeek}`);
            continue;
        }
        
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
        
        console.log(`  Found ${Object.keys(goalSlots).length} goal slots to move`);
        
        // Save remaining slots back to old week (removes goal slots)
        if(Object.keys(remainingSlots).length > 0) {
            localStorage.setItem(oldWeekKey, JSON.stringify(remainingSlots));
        } else {
            localStorage.removeItem(oldWeekKey);
        }
        
        // Load new week plan or create empty
        const newPlanData = localStorage.getItem(newWeekKey);
        const newPlan = newPlanData ? JSON.parse(newPlanData) : {};
        
        // Add goal slots to new week (overwrite if exists)
        Object.keys(goalSlots).forEach(key => {
            newPlan[key] = goalSlots[key];
        });
        
        // Save new week plan
        if(Object.keys(newPlan).length > 0) {
            localStorage.setItem(newWeekKey, JSON.stringify(newPlan));
            console.log(`  Saved ${Object.keys(goalSlots).length} slots to ${newWeek}`);
        }
    }
    
    console.log('Shift complete!');
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

// Debug function to inspect localStorage
function debugLocalStorage() {
    console.log('=== LOCALSTORAGE DEBUG ===');
    const planKeys = Object.keys(localStorage).filter(k => k.startsWith('ppm_plan_'));
    console.log(`Found ${planKeys.length} plan keys:`);
    planKeys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  ${key}: ${Object.keys(data).length} slots`, data);
    });
    console.log('=== END DEBUG ===');
}

// Call debug on page load
window.addEventListener('load', () => {
    setTimeout(debugLocalStorage, 1000);
});
