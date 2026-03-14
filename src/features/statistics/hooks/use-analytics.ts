import { useMemo } from 'react';
import { useGetGoals } from '@/api/services/goal-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetWeekCompletedTasks } from '@/api/services/today-service';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { WeekUtils } from '@/utils/week-utils';
import { 
    calculateGoalYield, 
    calculateHabitResilience, 
    calculateWeeklyEfficiency, 
    calculateLegacyPulse 
} from '../utils/analytics-math';

export function useAnalytics() {
    const { data: goals = [] } = useGetGoals();
    const { data: habits = [] } = useGetHabits();
    
    // Get last 7 days of completed tasks
    const last7Days = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }, []);
    
    const { data: completedTasks = {} } = useGetWeekCompletedTasks(last7Days);
    
    // Get current week plan for efficiency
    const currentWeek = WeekUtils.getCurrentWeek();
    const { data: weekPlan = {} } = useGetWeekPlan(currentWeek);
    
    // Calculate current day's completed tasks from the record
    const todayStr = WeekUtils.getCurrentDay();
    const todayCompleted = completedTasks[todayStr] || [];

    return useMemo(() => {
        const goalYield = calculateGoalYield(goals);
        const habitResilience = calculateHabitResilience(habits, completedTasks);
        const weeklyEfficiency = calculateWeeklyEfficiency(weekPlan, todayCompleted);
        const legacyPulse = calculateLegacyPulse(goalYield, habitResilience, weeklyEfficiency);

        return {
            goalYield,
            habitResilience,
            weeklyEfficiency,
            legacyPulse,
            totalGoals: goals.length,
            activeHabits: habits.length,
            isLoading: false // Simplified for now, real implementation would track loading states
        };
    }, [goals, habits, completedTasks, weekPlan, todayCompleted]);
}
