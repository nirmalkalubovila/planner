export const WeekUtils = {
    getWeekFromDate(dateStr: string | Date): string {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const startDay = startOfYear.getDay() || 7;
        const week = Math.ceil((days + startDay) / 7);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    getCurrentWeek(): string {
        return this.getWeekFromDate(new Date());
    },

    getCurrentDay(): string {
        const week = this.getCurrentWeek();
        const now = new Date();
        const day = now.getDay() === 0 ? 7 : now.getDay();
        return `${week}-${day}`;
    },

    parseWeek(weekStr: string) {
        const [year, week] = weekStr.split('-').map(Number);
        return { year, week };
    },

    normalizeWeek(weekStr: string): string {
        const { year, week } = this.parseWeek(weekStr);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    parseDay(dayStr: string) {
        const [year, week, day] = dayStr.split('-').map(Number);
        return { year, week, day };
    },

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

    compareWeeks(w1: string, w2: string): number {
        const { year: y1, week: wk1 } = this.parseWeek(w1);
        const { year: y2, week: wk2 } = this.parseWeek(w2);

        if (y1 !== y2) return y1 - y2;
        return wk1 - wk2;
    },

    getDaysForWeek(weekStr: string): Date[] {
        const { year, week } = this.parseWeek(weekStr);
        const startOfYear = new Date(year, 0, 1);
        const startDay = startOfYear.getDay() || 7;
        const daysToStartOfWeek = (week - 1) * 7 - (startDay - 1);
        const startOfWeek = new Date(year, 0, 1 + daysToStartOfWeek);

        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        return dates;
    },

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
};
