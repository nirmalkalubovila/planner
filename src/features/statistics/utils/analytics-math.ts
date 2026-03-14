import { Goal, Habit, GridState } from '@/types/global-types';

export const calculateGoalYield = (goals: Goal[]): number => {
    if (goals.length === 0) return 0;
    
    let totalMilestones = 0;
    let completedMilestones = 0;
    
    goals.forEach(goal => {
        if (goal.milestones) {
            totalMilestones += goal.milestones.length;
            completedMilestones += goal.milestones.filter(m => m.completed).length;
        }
    });
    
    return totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);
};

export const calculateHabitResilience = (habits: Habit[], completedTasks: Record<string, string[]>): number => {
    if (habits.length === 0) return 0;
    
    let totalExpectedOccurrences = 0;
    let actualOccurrences = 0;
    
    // Simple calculation: check last 7 days
    const today = new Date();
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayName = DAYS[d.getDay()];
        const dayStr = d.toISOString().split('T')[0];
        
        habits.forEach(habit => {
            if (habit.daysOfWeek?.includes(dayName)) {
                totalExpectedOccurrences++;
                if (completedTasks[dayStr]?.includes(habit.id!)) {
                    actualOccurrences++;
                }
            }
        });
    }
    
    return totalExpectedOccurrences === 0 ? 0 : Math.round((actualOccurrences / totalExpectedOccurrences) * 100);
};

export const calculateWeeklyEfficiency = (gridState: GridState, completedTasks: string[]): number => {
    const plannedTasks = Object.values(gridState).filter(slot => slot.type === 'goal' || slot.type === 'custom');
    if (plannedTasks.length === 0) return 0;
    
    // Note: This is a simplified version. In a real scenario, we'd match IDs.
    // For now, we'll use the ratio of completed tasks to planned tasks.
    return Math.min(100, Math.round((completedTasks.length / plannedTasks.length) * 100));
};

export const calculateLegacyPulse = (goalYield: number, habitResilience: number, weeklyEfficiency: number): number => {
    // Weighting: 60% Goals, 30% Habits, 10% Tasks
    return Math.round((goalYield * 0.6) + (habitResilience * 0.3) + (weeklyEfficiency * 0.1));
};
