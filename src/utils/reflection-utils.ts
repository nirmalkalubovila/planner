export const ReflectionUtils = {
    isReflectionDue(planDay: string, planStartTime: string, lastReflectionDateStr: string | null): boolean {
        if (!planDay || !planStartTime) return false;

        // Map day name to JS Date day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const daysMap: Record<string, number> = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
        };
        const targetDay = daysMap[planDay.toLowerCase()];
        if (targetDay === undefined) return false;

        // Parse "HH:mm"
        const [hours, minutes] = planStartTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;

        const now = new Date();

        // Find the date of this week's target day (e.g., this week's Sunday)
        const currentJsDay = now.getDay();
        const targetDate = new Date(now);

        let diff = currentJsDay - targetDay;
        if (diff < 0) {
            diff += 7; // it was last week
        }

        targetDate.setDate(now.getDate() - diff);
        targetDate.setHours(hours, minutes, 0, 0);

        // If today is the target day but current time is BEFORE the target time, then the *actual* due date was 7 days ago.
        if (diff === 0 && now.getTime() < targetDate.getTime()) {
            targetDate.setDate(targetDate.getDate() - 7);
        }

        // Now targetDate is the exact Date/Time when the current period's reflection became due.
        const dueTime = targetDate.getTime();

        if (!lastReflectionDateStr) {
            // Never reflected, and dueTime is in the past.
            return now.getTime() >= dueTime;
        }

        const lastReflectionTime = new Date(lastReflectionDateStr).getTime();
        // If the last reflection happened BEFORE the exact due date for this period, it's due now!
        return lastReflectionTime < dueTime;
    }
};
