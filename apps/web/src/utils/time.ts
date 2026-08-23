import { SLOTS_PER_DAY } from '@/constants/scheduling';

export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
};

export const minutesToTime = (minutes: number): string => {
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = Math.floor(normalizedMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = timeToMinutes(start1);
    let e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    let e2 = timeToMinutes(end2);

    if (e1 <= s1) e1 += 1440;
    if (e2 <= s2) e2 += 1440;

    return s1 < e2 && s2 < e1;
};

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

    if (sEnd <= 1440) {
        return hStart < sEnd && sStart < hEnd;
    }

    const sleepRange1Start = sStart;
    const sleepRange1End = 1440;
    const sleepRange2Start = 0;
    const sleepRange2End = sEnd - 1440;

    const overlap1 = hStart < sleepRange1End && sleepRange1Start < hEnd;
    const overlap2 = hStart < sleepRange2End && sleepRange2Start < hEnd;

    return overlap1 || overlap2;
};

/** Convert HH:mm to a 30-minute slot index (0-47) */
export const timeToSlot = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 2 + (m >= 30 ? 1 : 0);
};

/** Build a canonical grid key from day index and slot index */
export const slotKey = (dayIdx: number, slotIdx: number): string => `${dayIdx}-${slotIdx}`;

/** Format a slot index as HH:mm */
export const slotToTime = (slotIdx: number): string => {
    const hour = Math.floor(slotIdx / 2);
    const min = (slotIdx % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
};
