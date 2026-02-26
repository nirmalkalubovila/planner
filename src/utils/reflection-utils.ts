export const ReflectionUtils = {
    isReflectionDue(planTimeStr: string, lastReflectionDateStr: string | null): boolean {
        if (!planTimeStr) return false;

        // example planTimeStr: "Sunday 9PM - 10PM" or "Friday 4PM - 5PM"
        const parts = planTimeStr.split(' ');
        if (parts.length < 2) return false;

        const dayName = parts[0].toLowerCase();
        const timePart = parts[1]; // e.g., "9PM"

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
        const targetDay = daysMap[dayName];
        if (targetDay === undefined) return false;

        // Parse "9PM" -> 21
        let isPM = timePart.toUpperCase().includes('PM');
        let hours = parseInt(timePart.replace(/[^0-9]/g, ''), 10);
        if (isNaN(hours)) return false;

        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        const now = new Date();

        // Find the date of this week's target day (e.g., this week's Sunday)
        const currentJsDay = now.getDay();
        // Since planning usually is for the *next* week, but the reflection is for the *past* week at plan time.
        // We find the closest previous occurrence of `targetDay` and `hours` within the last 7 days.
        const targetDate = new Date(now);
        // How many days ago was targetDay?
        // if today is Sunday(0) and target is Sunday(0), it could be today or 7 days ago depending on time.
        let diff = currentJsDay - targetDay;

        if (diff < 0) {
            diff += 7; // it was last week
        }

        targetDate.setDate(now.getDate() - diff);
        targetDate.setHours(hours, 0, 0, 0);

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
