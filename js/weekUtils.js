/**
 * WEEK UTILITIES
 * Helper functions for week-based calculations
 * Assumes 52 weeks per year (365/7)
 */

const WeekUtils = {
    // Get current week in format "YYYY-WW"
    getCurrentWeek() {
        const now = new Date();
        const year = now.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    // Get current day in format "YYYY-WW-D" (1=Mon, 7=Sun)
    getCurrentDay() {
        const week = this.getCurrentWeek();
        const now = new Date();
        const day = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
        return `${week}-${day}`;
    },

    // Parse week string "YYYY-WW" to year and week number
    parseWeek(weekStr) {
        const [year, week] = weekStr.split('-').map(Number);
        return { year, week };
    },

    // Normalize week string to ensure consistent format "YYYY-WW"
    normalizeWeek(weekStr) {
        const { year, week } = this.parseWeek(weekStr);
        return `${year}-${String(week).padStart(2, '0')}`;
    },

    // Parse day string "YYYY-WW-D"
    parseDay(dayStr) {
        const [year, week, day] = dayStr.split('-').map(Number);
        return { year, week, day };
    },

    // Add N weeks to a week string
    addWeeks(weekStr, n) {
        const { year, week } = this.parseWeek(weekStr);
        let newWeek = week + n;
        let newYear = year;

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
    compareWeeks(w1, w2) {
        const { year: y1, week: wk1 } = this.parseWeek(w1);
        const { year: y2, week: wk2 } = this.parseWeek(w2);
        
        if (y1 !== y2) return y1 - y2;
        return wk1 - wk2;
    },

    // Check if a day falls within a specific week
    isDayInWeek(dayStr, weekStr) {
        const { year: dYear, week: dWeek } = this.parseDay(dayStr);
        const { year: wYear, week: wWeek } = this.parseWeek(weekStr);
        return dYear === wYear && dWeek === wWeek;
    },

    // Format week for display "Week 51 of 2025"
    formatWeekDisplay(weekStr) {
        const { year, week } = this.parseWeek(weekStr);
        return `Week ${week} of ${year}`;
    },

    // Get week range display
    formatWeekRange(weekStr) {
        const { year, week } = this.parseWeek(weekStr);
        return `${year}-W${String(week).padStart(2, '0')}`;
    }
};
