/**
 * STORAGE MANAGER
 * Handles all LocalStorage operations for Habits, Goals, and Plans.
 */

const DB_KEYS = {
    HABITS: 'ppm_habits',
    GOALS: 'ppm_goals',
    PLANNER: 'ppm_planner' // Custom slots
};

const StorageManager = {
    // --- GENERIC HELPERS ---
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- HABITS ---
    // Habit Structure: { id, name, description, startTime (HH:mm), endTime (HH:mm) }
    getHabits() {
        return this.getData(DB_KEYS.HABITS);
    },

    addHabit(habit) {
        const habits = this.getHabits();
        habit.id = Date.now().toString(); // Simple ID
        habits.push(habit);
        this.saveData(DB_KEYS.HABITS, habits);
    },

    deleteHabit(id) {
        let habits = this.getHabits();
        habits = habits.filter(h => h.id !== id);
        this.saveData(DB_KEYS.HABITS, habits);
    },

    // --- GOALS ---
    // Goal Structure: { 
    //   id, title, totalWeeks, currentWeekOffset (for shifting), 
    //   weeks: [ { weekNum: 1, subGoal: "", hours: 10, completed: false } ] 
    // }
    getGoals() {
        return this.getData(DB_KEYS.GOALS);
    },

    addGoal(goal) {
        const goals = this.getGoals();
        goal.id = Date.now().toString();
        this.saveData(DB_KEYS.GOALS, [...goals, goal]);
    },

    updateGoal(updatedGoal) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) {
            goals[index] = updatedGoal;
            this.saveData(DB_KEYS.GOALS, goals);
        }
    },

    // --- GOAL SHIFTING LOGIC ---
    // This shifts a goal's schedule by N weeks.
    // It inserts "Pause" weeks into the schedule.
    shiftGoal(goalId, weeksToShift) {
        const goals = this.getGoals();
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) return;

        // We extend the goal duration
        // For simplicity, we can mark specific weeks as "SHIFTED/PAUSED" 
        // or literally insert empty placeholders in the weeks array.
        
        // Strategy: Insert N empty weeks at the current index.
        const emptyWeeks = Array(parseInt(weeksToShift)).fill({
            isPaused: true,
            subGoal: "PAUSED - Unexpected Event",
            hours: 0
        });
        
        // Note: Real logic will depend on *when* the user wants to shift (current week).
        // For now, we assume pushing the remaining timeline.
        // We will refine this in the Goal Page implementation.
    }
};
