/**
 * TIME UTILITIES
 * Helper functions for time calculations and overlap checking
 */

/**
 * Converts a time string (HH:mm) to minutes from midnight
 */
export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
};

/**
 * Converts minutes from midnight to a time string (HH:mm)
 */
export const minutesToTime = (minutes: number): string => {
    // Handle wrap around (e.g., 1440 minutes = 00:00)
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = Math.floor(normalizedMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Checks if two time ranges overlap on the same day
 */
export const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = timeToMinutes(start1);
    let e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    let e2 = timeToMinutes(end2);

    // If end time is less than or equal to start time, it means it ends the next day
    // But for habits, we usually assume they stay within the same day or we handle the wrap
    // For this app, let's assume they are within 00:00 - 23:59 unless specified otherwise.
    // If e1 <= s1, e1 += 1440
    if (e1 <= s1) e1 += 1440;
    if (e2 <= s2) e2 += 1440;

    return s1 < e2 && s2 < e1;
};

/**
 * Checks if a habit overlaps with a sleep range
 * @param habitStart HH:mm
 * @param habitEnd HH:mm
 * @param sleepStart HH:mm
 * @param sleepDuration hours
 */
export const isSleepOverlapping = (
    habitStart: string,
    habitEnd: string,
    sleepStart: string,
    sleepDuration: number
): boolean => {
    const hStart = timeToMinutes(habitStart);
    let hEnd = timeToMinutes(habitEnd);
    if (hEnd <= hStart) hEnd += 1440;

    const sStart = timeToMinutes(sleepStart);
    const sEnd = sStart + (sleepDuration * 60);

    // Check overlap with the sleep range
    // Since sleep can wrap around, we check both the direct range and the shifted range
    // A robust way is to check 0-2880 range (covering two days)

    // Case 1: Sleep is within one day (e.g., 01:00 - 07:00)
    if (sEnd <= 1440) {
        return hStart < sEnd && sStart < hEnd;
    }

    // Case 2: Sleep wraps around midnight (e.g., 22:00 - 06:00)
    // Sleep range 1: [sStart, 1440)
    // Sleep range 2: [0, sEnd - 1440)
    const sleepRange1Start = sStart;
    const sleepRange1End = 1440;
    const sleepRange2Start = 0;
    const sleepRange2End = sEnd - 1440;

    const overlap1 = hStart < sleepRange1End && sleepRange1Start < hEnd;
    const overlap2 = hStart < sleepRange2End && sleepRange2Start < hEnd;

    return overlap1 || overlap2;
};
