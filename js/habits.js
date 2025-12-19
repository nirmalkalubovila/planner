/* js/habits.js */

let editingHabitId = null; // Track which habit is being edited

document.addEventListener('DOMContentLoaded', () => {
    renderHabitList();
    // Set default starting day to today
    document.getElementById('habitStartDay').value = WeekUtils.getCurrentDay();
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

function setCurrentDay() {
    document.getElementById('habitStartDay').value = WeekUtils.getCurrentDay();
}

function saveHabit() {
    const name = document.getElementById('habitName').value;
    const desc = document.getElementById('habitDesc').value;
    const start = document.getElementById('habitStart').value;
    const packs = parseInt(document.getElementById('habitPacks').value);
    const startDay = document.getElementById('habitStartDay').value.trim();

    if(!name || !start || !packs) {
        alert("Please fill in Name, Start Time, and Duration (packs)");
        return;
    }

    // Calculate end time from start time + packs
    const [startHour, startMinute] = start.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMinute + (packs * 30);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Validate startDay format (YYYY-WW-D)
    if(startDay && !startDay.match(/^\d{4}-\d{1,2}-[1-7]$/)) {
        alert("Invalid starting day format. Use YYYY-WW-D (e.g., 2025-51-1)");
        return;
    }

    // Check for time slot conflicts with existing habits
    const existingHabits = StorageManager.getHabits();
    const startHourNum = parseInt(start.split(':')[0]);
    const startMinuteNum = parseInt(start.split(':')[1]);
    const endHourNum = parseInt(end.split(':')[0]);
    const endMinuteNum = parseInt(end.split(':')[1]);
    
    const startTime = startHourNum + startMinuteNum / 60;
    const endTime = endHourNum + endMinuteNum / 60;
    
    const conflicts = [];
    
    for(let habit of existingHabits) {
        // Skip the current habit when editing
        if(editingHabitId && habit.id === editingHabitId) continue;
        
        const habitStartHour = parseInt(habit.startTime.split(':')[0]);
        const habitStartMinute = parseInt(habit.startTime.split(':')[1]);
        const habitEndHour = parseInt(habit.endTime.split(':')[0]);
        const habitEndMinute = parseInt(habit.endTime.split(':')[1]);
        
        const habitStart = habitStartHour + habitStartMinute / 60;
        const habitEnd = habitEndHour + habitEndMinute / 60;
        
        // Check if time ranges overlap
        const overlaps = (startTime < habitEnd && endTime > habitStart);
        
        if(overlaps) {
            conflicts.push(`"${habit.name}" (${habit.startTime} - ${habit.endTime})`);
        }
    }
    
    if(conflicts.length > 0) {
        const conflictList = conflicts.join('\n• ');
        alert(`⚠️ Time Conflict Detected!\n\nThis time slot (${start} - ${end}) overlaps with ${conflicts.length} existing habit(s):\n\n• ${conflictList}\n\nPlease choose a different time range that doesn't overlap with existing habits.`);
        return;
    }

    const habit = { 
        name, 
        description: desc, 
        startTime: start, 
        endTime: end,
        packs: packs,
        startDay: startDay || WeekUtils.getCurrentDay()
    };
    
    if(editingHabitId) {
        // Update existing habit
        habit.id = editingHabitId;
        let habits = StorageManager.getHabits();
        const index = habits.findIndex(h => h.id === editingHabitId);
        if(index !== -1) {
            habits[index] = habit;
            localStorage.setItem('ppm_habits', JSON.stringify(habits));
        }
        editingHabitId = null;
        document.querySelector('.collapsible-header span').textContent = 'Add New Habit';
        const saveBtn = document.querySelector('.collapsible-content button');
        if(saveBtn) saveBtn.textContent = 'Add Habit';
    } else {
        // Add new habit
        StorageManager.addHabit(habit);
    }
    
    // Clear inputs
    document.getElementById('habitName').value = '';
    document.getElementById('habitDesc').value = '';
    document.getElementById('habitStart').value = '';
    document.getElementById('habitPacks').value = '';
    document.getElementById('habitStartDay').value = WeekUtils.getCurrentDay();
    renderHabitList();
}

function renderHabitList() {
    const list = document.getElementById('habitList');
    list.innerHTML = '';
    const habits = StorageManager.getHabits();

    habits.forEach(h => {
        const div = document.createElement('div');
        div.className = 'item-card';
        const packsText = h.packs ? ` • ${h.packs} packs` : '';
        div.innerHTML = `
            <div>
                <strong>${h.name}</strong> (${h.startTime} - ${h.endTime}${packsText})
                <br><small>${h.description}</small>
                <br><small style="color:#888;">Starts: ${h.startDay || 'Not set'}</small>
            </div>
            <div style="display:flex; gap:5px;">
                <button onclick="editHabit('${h.id}')" style="background:#4CAF50; font-size:0.8rem;">Edit</button>
                <button onclick="deleteHabit('${h.id}')" style="background:red; font-size:0.8rem;">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function editHabit(id) {
    const habits = StorageManager.getHabits();
    const habit = habits.find(h => h.id === id);
    if(!habit) return;
    
    editingHabitId = id;
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitDesc').value = habit.description;
    document.getElementById('habitStart').value = habit.startTime;
    document.getElementById('habitPacks').value = habit.packs || '';
    document.getElementById('habitStartDay').value = habit.startDay || '';
    
    document.querySelector('.collapsible-header span').textContent = 'Edit Habit';
    const saveBtn = document.querySelector('.collapsible-content button');
    if(saveBtn) saveBtn.textContent = 'Update Habit';
    window.scrollTo(0, 0);
}

function deleteHabit(id) {
    if(confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
        StorageManager.deleteHabit(id);
        renderHabitList();
    }
}

function cancelEdit() {
    editingHabitId = null;
    document.getElementById('habitName').value = '';
    document.getElementById('habitDesc').value = '';
    document.getElementById('habitStart').value = '';
    document.getElementById('habitPacks').value = '';
    document.getElementById('habitStartDay').value = WeekUtils.getCurrentDay();
    document.querySelector('.collapsible-header span').textContent = 'Add New Habit';
    const saveBtn = document.querySelector('.collapsible-content button');
    if(saveBtn) saveBtn.textContent = 'Add Habit';
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
}
