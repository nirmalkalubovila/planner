export const DAYS_OF_WEEK = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
] as const;

export const SHORT_DAYS = [
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
] as const;

export const SLOTS_PER_DAY = 48; // 30-minute slots covering 24 hours

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
