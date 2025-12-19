/* js/goals.js */

let tempWeeksData = []; // Store temporary week data before saving

document.addEventListener('DOMContentLoaded', () => {
    renderGoals();
});

// Step 1: Generate Input Fields for Weeks
function initializeGoalInput() {
    const weeks = parseInt(document.getElementById('goalDuration').value);
    const container = document.getElementById('weeksInputs');
    container.innerHTML = '';
    tempWeeksData = [];

    if(!weeks || weeks < 1) return;

    for(let i=1; i<=weeks; i++) {
        const div = document.createElement('div');
        div.className = 'week-input-row';
        div.innerHTML = `
            <span>Week ${i}</span>
            <input type="number" class="w-hours" placeholder="Hours needed" id="h-${i}">
            <input type="text" class="w-desc" placeholder="Sub-goal (e.g. Make 5 posts)" id="d-${i}">
        `;
        container.appendChild(div);
    }
    document.getElementById('weeksContainer').classList.remove('hidden');
}

// Step 2: Save the Goal to Storage
function saveFinalGoal() {
    const title = document.getElementById('goalTitle').value;
    const duration = parseInt(document.getElementById('goalDuration').value);
    const weeksArr = [];

    for(let i=1; i<=duration; i++) {
        weeksArr.push({
            weekNum: i,
            hours: document.getElementById(`h-${i}`).value || 0,
            subGoal: document.getElementById(`d-${i}`).value || "No Description",
            isPaused: false // Used for shifting logic later
        });
    }

    const newGoal = {
        title: title,
        totalWeeks: duration,
        weeks: weeksArr,
        startDate: new Date().toISOString() // Track when it started
    };

    StorageManager.addGoal(newGoal);
    location.reload(); // Refresh page
}

// Step 3: Render and Shift Logic
function renderGoals() {
    const list = document.getElementById('activeGoalsList');
    const goals = StorageManager.getGoals();
    list.innerHTML = '';

    goals.forEach(g => {
        const div = document.createElement('div');
        div.className = 'goal-card';
        
        // Calculate progress or current week (Simplified logic: assumes user manually tracks progress or we view all)
        let html = `<h3>${g.title} (${g.totalWeeks} Weeks)</h3>`;
        
        // Week Viewer
        html += `<div class="week-scroll">`;
        g.weeks.forEach((w, idx) => {
            const style = w.isPaused ? "background:#ddd; color:#999;" : "";
            html += `
                <div class="mini-week" style="${style}">
                    <b>W${idx+1}</b><br>
                    ${w.isPaused ? "PAUSED" : w.hours + "h"}
                </div>
            `;
        });
        html += `</div>`;

        // Shift Controls
        html += `
            <div class="shift-controls">
                <label>Unexpected Event? Shift Plan:</label>
                <input type="number" id="shift-${g.id}" placeholder="Weeks to delay" style="width:100px;">
                <button onclick="shiftGoal('${g.id}')">Shift</button>
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

    // THE LOGIC: Insert "Paused" weeks at the beginning (or current execution point)
    // For simplicity, we insert at the start, pushing everything right.
    // If you want to insert in the middle, we'd need a "Current Week" tracker. 
    // Assuming simple push:
    
    const pauseWeeks = Array(shiftVal).fill(0).map(() => ({
        weekNum: 0, // Placeholder
        hours: 0,
        subGoal: "SHIFTED / PAUSED",
        isPaused: true
    }));

    // Add pause weeks to the front (or current active week)
    goal.weeks = [...pauseWeeks, ...goal.weeks];
    
    // Update total weeks
    goal.totalWeeks += shiftVal;

    // Re-index week numbers
    goal.weeks.forEach((w, i) => w.weekNum = i + 1);

    StorageManager.saveData('ppm_goals', goals); // Update raw storage
    renderGoals();
}

function deleteGoal(id) {
    let goals = StorageManager.getGoals().filter(g => g.id !== id);
    StorageManager.saveData('ppm_goals', goals);
    renderGoals();
}
