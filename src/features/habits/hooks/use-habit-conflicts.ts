import { useAuth } from '@/contexts/auth-context';
import { Habit } from '@/types/global-types';
import { timeToMinutes, isTimeOverlapping, isSleepOverlapping } from '@/utils/time';

interface ConflictCheckParams {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    startDate: string;
    endDate: string;
}

export function useHabitConflicts(habits: Habit[], editingHabitId?: string) {
    const { user } = useAuth();

    const checkConflicts = (values: ConflictCheckParams): string | null => {
        const sleepStart = user?.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user?.user_metadata?.sleepDuration) || 8;

        if (isSleepOverlapping(values.startTime, values.endTime, sleepStart, sleepDuration)) {
            return "This habit overlaps with your sleep schedule.";
        }

        const planDay = user?.user_metadata?.planDay || 'Sunday';
        const planStartTime = user?.user_metadata?.planStartTime || '21:00';
        const planDurationPacks = Number(user?.user_metadata?.planDurationPacks) || 2;
        const planEndMin = timeToMinutes(planStartTime) + planDurationPacks * 30;
        const planEndTime = `${Math.floor((planEndMin % 1440) / 60).toString().padStart(2, '0')}:${(planEndMin % 60).toString().padStart(2, '0')}`;

        if (values.daysOfWeek.includes(planDay)) {
            if (isTimeOverlapping(values.startTime, values.endTime, planStartTime, planEndTime)) {
                return `This habit overlaps with your Weekly Planning time on ${planDay} (${planStartTime} - ${planEndTime}).`;
            }
        }

        for (const habit of habits) {
            if (editingHabitId && habit.id === editingHabitId) continue;

            const start1 = new Date(values.startDate);
            const end1 = new Date(values.endDate);
            const start2 = new Date(habit.startDate || '');
            const end2 = new Date(habit.endDate || '');

            if (start1 <= end2 && start2 <= end1) {
                const commonDays = values.daysOfWeek.filter(day => habit.daysOfWeek?.includes(day));
                if (commonDays.length > 0) {
                    if (isTimeOverlapping(values.startTime, values.endTime, habit.startTime, habit.endTime)) {
                        return `This habit overlaps with "${habit.name}" on ${commonDays[0]}.`;
                    }
                }
            }
        }

        return null;
    };

    return { checkConflicts };
}
