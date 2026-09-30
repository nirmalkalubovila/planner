// Goal -> years -> months -> weeks breakdown: the date arithmetic every planner (web, mobile and the Claude
// connector) must agree on. Dependency free on purpose: a copy of this file lives in
// supabase/functions/mcp/breakdown.ts (Deno), so keep the two identical.
//
// All arithmetic is on calendar dates (year, month, day) with no time zones, so it gives the same answer on a
// laptop, a phone and a server.

export type BreakdownLevel = 'Years' | 'Months' | 'Weeks';
export type GoalTypeName = 'Week' | 'Month' | 'Year';

export interface Period {
    /** First day of the period, yyyy-MM-dd. */
    start: string;
    /** End of the period, yyyy-MM-dd. For months this is the start of the next one (exclusive); for weeks it is the last day. */
    end: string;
    /** Human label: "March 2026" for a month, "March 16 - March 22" for a week. */
    label: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface YMD { y: number; m: number; d: number }

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = ({ y, m, d }: YMD) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function parseISODate(iso: string): YMD | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
    if (!match) return null;
    const out = { y: +match[1], m: +match[2] - 1, d: +match[3] };
    // reject impossible dates such as 2026-02-31
    const check = new Date(Date.UTC(out.y, out.m, out.d));
    return check.getUTCFullYear() === out.y && check.getUTCMonth() === out.m && check.getUTCDate() === out.d ? out : null;
}

const toDays = ({ y, m, d }: YMD) => Math.round(Date.UTC(y, m, d) / 86_400_000);
const fromDays = (days: number): YMD => {
    const dt = new Date(days * 86_400_000);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
};

const addDays = (date: YMD, n: number): YMD => fromDays(toDays(date) + n);

/** Adds calendar months, clamping to the last day of the target month (31 Jan + 1 month = 28/29 Feb). */
const addMonths = (date: YMD, n: number): YMD => {
    const total = date.y * 12 + date.m + n;
    const y = Math.floor(total / 12);
    const m = total - y * 12;
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return { y, m, d: Math.min(date.d, lastDay) };
};

const diffDays = (a: YMD, b: YMD) => toDays(a) - toDays(b);
const label = (date: YMD) => `${MONTHS[date.m]} ${date.d}`;

/** 7-day chunks from `start`; the last one is clipped to the day before `end`. */
export function getWeekPeriods(startISO: string, endISO: string): Period[] {
    const start = parseISODate(startISO);
    const end = parseISODate(endISO);
    if (!start || !end || diffDays(end, start) <= 0) return [];
    const out: Period[] = [];
    let cursor = start;
    while (diffDays(end, cursor) > 0) {
        const lastDay = addDays(end, -1);
        const weekEnd = diffDays(addDays(cursor, 6), lastDay) < 0 ? addDays(cursor, 6) : lastDay;
        out.push({ start: toISO(cursor), end: toISO(weekEnd), label: `${label(cursor)} - ${label(weekEnd)}` });
        cursor = addDays(weekEnd, 1);
    }
    return out;
}

/** Month-long steps from `start`, the last one clipped to `end`. */
export function getMonthPeriods(startISO: string, endISO: string): Period[] {
    const start = parseISODate(startISO);
    const end = parseISODate(endISO);
    if (!start || !end) return [];
    const out: Period[] = [];
    let cursor = start;
    while (diffDays(end, cursor) > 0) {
        const next = addMonths(cursor, 1);
        const monthEnd = diffDays(next, end) < 0 ? next : end;
        if (diffDays(monthEnd, cursor) > 0) {
            out.push({ start: toISO(cursor), end: toISO(monthEnd), label: `${MONTHS[cursor.m]} ${cursor.y}` });
        }
        cursor = next;
    }
    return out;
}

/** Levels a goal is broken into below its top-level milestones. Year: months, then weeks. Month: weeks. Week: none. */
export function breakdownLevels(goalType: GoalTypeName): ('Months' | 'Weeks')[] {
    if (goalType === 'Year') return ['Months', 'Weeks'];
    if (goalType === 'Month') return ['Weeks'];
    return [];
}

/** The unit a goal's top-level phases are measured in. */
export function topLevelUnit(goalType: GoalTypeName): BreakdownLevel {
    return goalType === 'Year' ? 'Years' : goalType === 'Month' ? 'Months' : 'Weeks';
}

/** Period covered by each top-level milestone: from the previous milestone (or the goal start) to its own date. */
export function getMilestonePeriods(startDate: string, milestoneDates: string[]): { start: string; end: string }[] {
    const sorted = [...milestoneDates].sort();
    return sorted.map((date, i) => ({ start: i === 0 ? startDate : sorted[i - 1], end: date }));
}

/**
 * The period to plan in detail right now: the one containing `today`. Before the goal starts that is the first
 * period, and once every period has passed it is the last one.
 */
export function pickCurrentIndex(periods: { start: string; end: string }[], today: string): number {
    if (periods.length === 0) return -1;
    const index = periods.findIndex((p) => today >= p.start && today < p.end);
    if (index >= 0) return index;
    return today < periods[0].start ? 0 : periods.length - 1;
}

/** Today as yyyy-MM-dd in the caller's local calendar. */
export function todayISO(now: Date = new Date()): string {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Milestone dates for a goal: one per year / month / week counted from the start, with the last one landing
 * exactly on `endISO`. This is the same grain the goal form uses, so a goal created by Claude and one created
 * in the app have identical milestones.
 */
export function getMilestoneDates(goalType: GoalTypeName, startISO: string, endISO: string): string[] {
    const start = parseISODate(startISO);
    const end = parseISODate(endISO);
    if (!start || !end || diffDays(end, start) <= 0) return [];
    const out: string[] = [];
    for (let i = 1; i <= 520; i++) {
        const next = goalType === 'Year' ? addMonths(start, 12 * i) : goalType === 'Month' ? addMonths(start, i) : addDays(start, 7 * i);
        if (diffDays(next, end) >= 0) {
            out.push(toISO(end));
            break;
        }
        out.push(toISO(next));
    }
    return out;
}
