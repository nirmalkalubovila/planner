/* js/habits.js */

document.addEventListener('DOMContentLoaded', () => {
    renderHabitList();
});

function saveHabit() {
    const name = document.getElementById('habitName').value;
    const desc = document.getElementById('habitDesc').value;
    const start = document.getElementById('habitStart').value;
    const end = document.getElementById('habitEnd').value;

    if(!name || !start || !end) {
        alert("Please fill in Name and Times");
        return;
    }

    if(start >= end) {
        alert("Start time must be before End time.");
        return;
    }

    const habit = { 
        name, 
        description: desc, 
        startTime: start, 
        endTime: end 
    };
    StorageManager.addHabit(habit);
    
    // Clear inputs
    document.getElementById('habitName').value = '';
    document.getElementById('habitDesc').value = '';
    document.getElementById('habitStart').value = '';
    document.getElementById('habitEnd').value = '';
    renderHabitList();
}

function renderHabitList() {
    const list = document.getElementById('habitList');
    list.innerHTML = '';
    const habits = StorageManager.getHabits();

    habits.forEach(h => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div>
                <strong>${h.name}</strong> (${h.startTime} - ${h.endTime})
                <br><small>${h.description}</small>
            </div>
            <button onclick="deleteHabit('${h.id}')" style="background:red; font-size:0.8rem;">Delete</button>
        `;
        list.appendChild(div);
    });
}

function deleteHabit(id) {
    StorageManager.deleteHabit(id);
    renderHabitList();
}
