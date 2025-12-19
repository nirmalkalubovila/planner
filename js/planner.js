/* js/planner.js */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let currentTool = 'erase'; 
let allocatedHours = 0;
let gridState = {}; // Key: "dayIndex-hour", Value: { type, name }
let currentWeek = WeekUtils.getCurrentWeek(); // Track current viewing week

document.addEventListener('DOMContentLoaded', () => {
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
    currentWeek = WeekUtils.addWeeks(currentWeek, delta);
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
        cell.className = 'grid-cell cell-goal';
        cell.innerText = 'GOAL';
        gridState[key] = { type: 'goal', name: 'Goal Work' };
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
    // Save plan with week identifier
    const weekKey = `ppm_plan_${currentWeek}`;
    localStorage.setItem(weekKey, JSON.stringify(gridState));
    alert(`Week Plan Saved for ${WeekUtils.formatWeekDisplay(currentWeek)}!`);
}

function loadSavedPlan() {
    const weekKey = `ppm_plan_${currentWeek}`;
    const saved = localStorage.getItem(weekKey);
    if(saved) {
        gridState = JSON.parse(saved);
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
    }
}

function clearPlan() {
    if(confirm("Clear all planned blocks for this week?")) {
        gridState = {};
        const weekKey = `ppm_plan_${currentWeek}`;
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
