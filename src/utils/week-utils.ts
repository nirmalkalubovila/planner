/**
 * WEEK UTILITIES
 * Helper functions for week-based calculations
 */

export const WeekUtils = {
    // Get week from a date string (YYYY-MM-DD or ISO string)
    getWeekFromDate(dateStr: string | Date): string {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    // Get current week in format "YYYY-WW"
    getCurrentWeek(): string {
        return this.getWeekFromDate(new Date());
    },

    // Get current day in format "YYYY-WW-D" (1=Mon, 7=Sun)
    getCurrentDay(): string {
        const week = this.getCurrentWeek();
        const now = new Date();
        const day = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
        return `${week}-${day}`;
    },

    // Parse week string "YYYY-WW" to year and week number
    parseWeek(weekStr: string) {
        const [year, week] = weekStr.split('-').map(Number);
        return { year, week };
    },

    // Normalize week string to ensure consistent format "YYYY-WW"
    normalizeWeek(weekStr: string): string {
        const { year, week } = this.parseWeek(weekStr);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    // Parse day string "YYYY-WW-D"
    parseDay(dayStr: string) {
        const [year, week, day] = dayStr.split('-').map(Number);
        return { year, week, day };
    },

    // Add N weeks to a week string
    addWeeks(weekStr: string, n: number): string {
        const parsed = this.parseWeek(weekStr);
        let newWeek = parsed.week + n;
        let newYear = parsed.year;

        while (newWeek > 52) {
            newWeek -= 52;
            newYear++;
        }
        while (newWeek < 1) {
            newWeek += 52;
            newYear--;
        }

        return `${newYear}-${String(newWeek).padStart(2, '0')}`;
    },

    // Compare two week strings (-1 if w1 < w2, 0 if equal, 1 if w1 > w2)
    compareWeeks(w1: string, w2: string): number {
        const { year: y1, week: wk1 } = this.parseWeek(w1);
        const { year: y2, week: wk2 } = this.parseWeek(w2);

        if (y1 !== y2) return y1 - y2;
        return wk1 - wk2;
    },

    // Check if a day falls within a specific week
    isDayInWeek(dayStr: string, weekStr: string): boolean {
        const { year: dYear, week: dWeek } = this.parseDay(dayStr);
        const { year: wYear, week: wWeek } = this.parseWeek(weekStr);
        return dYear === wYear && dWeek === wWeek;
    },

    getDaysForWeek(weekStr: string): Date[] {
        const { year, week } = this.parseWeek(weekStr);
        const startOfYear = new Date(year, 0, 1);
        const daysToStartOfWeek = (week - 1) * 7 - startOfYear.getDay();
        const startOfWeek = new Date(year, 0, 1 + daysToStartOfWeek);

        const dates: Date[] = [];
        for (let i = 1; i <= 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        return dates;
    },

    // Format week for display (e.g., Feb 22 - Feb 28, 2026)
    formatWeekDisplay(weekStr: string): string {
        const dates = this.getDaysForWeek(weekStr);
        const start = dates[0];
        const end = dates[6];
        const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        if (start.getFullYear() !== end.getFullYear()) {
            return `${start.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
        }
        return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
    },

    // Get week range display (removed as we use formatting)
    formatWeekRange(weekStr: string): string {
        return weekStr;
    }
};
