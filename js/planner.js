/* js/planner.js */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let currentTool = 'erase'; 
let allocatedHours = 0;
let gridState = {}; // Key: "dayIndex-hour", Value: { type, name }

document.addEventListener('DOMContentLoaded', () => {
    initGrid();
    loadHabitsIntoGrid();
    populateGoalSelect();
    loadSavedPlan(); // Load local storage plan if exists
});

function initGrid() {
    const grid = document.getElementById('gridContainer');
    grid.innerHTML = '';

    // Create 24 hours * 7 days
    for(let h=0; h<24; h++) {
        // Time Label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.innerText = `${h}:00`;
        grid.appendChild(timeLabel);

        // 7 Days columns
        for(let d=0; d<7; d++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.day = d;
            cell.dataset.hour = h;
            cell.id = `c-${d}-${h}`;
            cell.onclick = () => handleCellClick(d, h);
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

function handleCellClick(day, hour) {
    const cell = document.getElementById(`c-${day}-${hour}`);
    
    // Check if locked by Habit (Habits cannot be erased by paint tool here ideally, or warn user)
    if(cell.classList.contains('locked-habit')) {
        alert("This slot is occupied by a fixed Habit.");
        return;
    }

    const key = `${day}-${hour}`;

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
        // Parse time: "05:00" -> 5
        const startH = parseInt(habit.startTime.split(':')[0]);
        const endH = parseInt(habit.endTime.split(':')[0]); // Simplified: Hour granularity

        // Habits apply to ALL days (0-6)
        for(let d=0; d<7; d++) {
            for(let h=startH; h<endH; h++) {
                const cell = document.getElementById(`c-${d}-${h}`);
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
    const goals = StorageManager.getGoals();
    goals.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.innerText = g.title;
        sel.appendChild(opt);
    });
}

function loadGoalStats() {
    const id = document.getElementById('activeGoalSelector').value;
    if(!id) return;

    const goal = StorageManager.getGoals().find(g => g.id === id);
    // For MVP, we assume we are planning "Week 1" or the first unpaused week.
    // In a full version, you'd select "Which week are you planning?".
    // Let's grab the first week that isn't paused.
    const activeWeek = goal.weeks.find(w => !w.isPaused); 
    
    if(activeWeek) {
        document.getElementById('goalStats').innerHTML = `
            Target: <b>${activeWeek.hours}h</b> for "${activeWeek.subGoal}"
        `;
    } else {
        document.getElementById('goalStats').innerText = "All weeks paused or completed.";
    }
}

function updateStats() {
    // Count goal cells
    let count = 0;
    Object.values(gridState).forEach(v => {
        if(v.type === 'goal') count++;
    });
    document.getElementById('allocatedCount').innerText = count;
}

// --- SAVING ---

function saveWeekPlan() {
    localStorage.setItem('ppm_saved_plan', JSON.stringify(gridState));
    alert("Week Plan Saved!");
}

function loadSavedPlan() {
    const saved = localStorage.getItem('ppm_saved_plan');
    if(saved) {
        gridState = JSON.parse(saved);
        Object.keys(gridState).forEach(key => {
            const [d, h] = key.split('-');
            const data = gridState[key];
            const cell = document.getElementById(`c-${d}-${h}`);
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
    if(confirm("Clear all planned blocks?")) {
        gridState = {};
        localStorage.removeItem('ppm_saved_plan');
        location.reload();
    }
}
