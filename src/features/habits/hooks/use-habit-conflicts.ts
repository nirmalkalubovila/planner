import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { Habit } from '@/types/global-types';
import { timeToMinutes, minutesToTime, isTimeOverlapping, isSleepOverlapping } from '@/utils/time';

interface ConflictCheckParams {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    startDate: string;
    endDate: string;
}

function resolvePlanEndTime(profile: { planEndTime?: string; planStartTime?: string } | null, meta: any): string {
    if (profile?.planEndTime) return profile.planEndTime;
    if (meta?.planEndTime) return meta.planEndTime;
    const startTime = profile?.planStartTime || meta?.planStartTime || '21:00';
    const packs = Number(meta?.planDurationPacks) || 2;
    return minutesToTime(timeToMinutes(startTime) + packs * 30);
}

export function useHabitConflicts(habits: Habit[], editingHabitId?: string) {
    const { user } = useAuth();
    const { profile } = useUserProfile(user);

    const checkConflicts = (values: ConflictCheckParams): string | null => {
        const sleepStart = profile?.sleepStart || user?.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(profile?.sleepDuration || user?.user_metadata?.sleepDuration) || 8;

        if (isSleepOverlapping(values.startTime, values.endTime, sleepStart, sleepDuration)) {
            return "This habit overlaps with your sleep schedule.";
        }

        const planDay = profile?.planDay || user?.user_metadata?.planDay || 'Sunday';
        const planStartTime = profile?.planStartTime || user?.user_metadata?.planStartTime || '21:00';
        const planEndTime = resolvePlanEndTime(profile, user?.user_metadata);

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
