import { WeekUtils } from '@llb/core';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';
import { MILESTONE_STAGES, type MilestoneStage } from '@/utils/milestone-engine';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const BUCKET_LABELS: Record<string, string> = {
    income: 'Income',
    asset: 'Assets',
    recovery: 'Recovery',
    relational: 'Relationships',
};

export const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const clampPct = (n: number | undefined) => Math.round(Math.max(0, Math.min(100, Number(n) || 0)));

export interface ReportDay { date: Date; done: number }
export interface ReportWeek { label: string; days: ReportDay[]; total: number; executed: number }

export interface ReportData {
    name: string;
    generatedOn: string;
    firstDay?: string;
    stageTitle?: string;
    totals: { label: string; value: string }[];
    headline: { daysExecuted: number; currentStreak: number; longestStreak: number; consistency: number; lifeScore: number };
    insights: string[];
    weekdays: { label: string; tasks: number; pct: number }[];
    months: { label: string; daysExecuted: number; daysInMonth: number; tasks: number }[];
    weeks: ReportWeek[];
    weeklyExecution: { label: string; planned: number; completed: number; efficiency: number }[];
    score: { label: string; value: number; of: number }[];
    goals: { name: string; progress: number; detail: string }[];
    habits: { name: string; consistency: number; detail: string }[];
    buckets: { label: string; hours: number; score: number }[];
    stages: { title: string; days: number; reached: boolean }[];
    nextStage?: { title: string; daysToGo: number };
    heat: number[]; // last 84 days, oldest first
}

/** completedMap keys look like "2026-14-3". Normalise to numbers so zero-padding never matters. */
function buildWeeks(completedMap: Record<string, string[]>): ReportWeek[] {
    const counts = new Map<string, number>();
    let first: { year: number; week: number } | null = null;

    for (const [key, ids] of Object.entries(completedMap)) {
        const { year, week, day } = WeekUtils.parseDay(key);
        if (![year, week, day].every(Number.isFinite)) continue;
        const n = Array.isArray(ids) ? ids.length : 0;
        counts.set(`${year}-${week}-${day}`, n);
        if (n > 0 && (!first || year < first.year || (year === first.year && week < first.week))) first = { year, week };
    }
    if (!first) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeek = WeekUtils.getCurrentWeek();
    let cursor = WeekUtils.normalizeWeek(`${first.year}-${first.week}`);
    const rows: ReportWeek[] = [];

    for (let guard = 0; guard < 160 && WeekUtils.compareWeeks(cursor, currentWeek) <= 0; guard++) {
        const { year, week } = WeekUtils.parseWeek(cursor);
        const dates = WeekUtils.getDaysForWeek(cursor);
        const days = dates.map((date, i) => ({ date, done: date > today ? 0 : counts.get(`${year}-${week}-${i + 1}`) ?? 0 }));
        rows.push({
            label: `${fmtShort(dates[0])} - ${fmtShort(dates[6])}`,
            days,
            total: days.reduce((sum, d) => sum + d.done, 0),
            executed: days.filter((d) => d.done > 0).length,
        });
        cursor = WeekUtils.addWeeks(cursor, 1);
    }
    return rows;
}

export function buildReportData(name: string, detailed: DetailedAnalytics, stage?: MilestoneStage | null): ReportData {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const progress = detailed.milestoneProgress;
    const weeks = buildWeeks(detailed.completedMap);
    const pastDays = weeks.flatMap((w) => w.days).filter((d) => d.date <= today);
    const firstDay = pastDays.find((d) => d.done > 0)?.date;
    const spanDays = firstDay ? Math.max(1, Math.round((today.getTime() - firstDay.getTime()) / 86400000) + 1) : 0;
    const totalTasks = pastDays.reduce((s, d) => s + d.done, 0);
    const activeDays = pastDays.filter((d) => d.done > 0);
    const bestDay = [...activeDays].sort((a, b) => b.done - a.done)[0];
    const consistency = spanDays ? Math.round((progress.totalDaysExecuted / spanDays) * 100) : 0;

    // Weekday totals
    const perWeekday = new Array(7).fill(0) as number[];
    weeks.forEach((w) => w.days.forEach((d, i) => { perWeekday[i] += d.done; }));
    const maxWeekday = Math.max(1, ...perWeekday);
    const weekdays = WEEKDAYS.map((label, i) => ({ label, tasks: perWeekday[i], pct: Math.round((perWeekday[i] / maxWeekday) * 100) }));

    // Month totals
    const monthMap = new Map<string, { label: string; daysExecuted: number; daysInMonth: number; tasks: number }>();
    pastDays.forEach((d) => {
        const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
        const entry = monthMap.get(key) ?? {
            label: d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            daysExecuted: 0,
            daysInMonth: 0,
            tasks: 0,
        };
        entry.daysInMonth += 1;
        if (d.done > 0) entry.daysExecuted += 1;
        entry.tasks += d.done;
        monthMap.set(key, entry);
    });
    const months = [...monthMap.values()];

    // Insights drawn only from the recorded data
    const insights: string[] = [];
    if (totalTasks > 0) {
        const best = perWeekday.indexOf(Math.max(...perWeekday));
        insights.push(`${WEEKDAYS[best]} is your strongest day. You finish the most tasks on it.`);
        const weakest = perWeekday.indexOf(Math.min(...perWeekday));
        if (weakest !== best) insights.push(`${WEEKDAYS[weakest]} is your softest day. One small win there lifts the whole week.`);
    }
    const bestWeek = [...weeks].sort((a, b) => b.total - a.total)[0];
    if (bestWeek && bestWeek.total > 0) insights.push(`Your best week was ${bestWeek.label}: ${bestWeek.total} tasks done across ${bestWeek.executed} days.`);
    const perfectWeeks = weeks.filter((w) => w.executed === 7).length;
    if (perfectWeeks > 0) insights.push(`${perfectWeeks} ${perfectWeeks === 1 ? 'week' : 'weeks'} with all seven days executed.`);
    const last30 = pastDays.slice(-30);
    if (last30.length >= 7) {
        const active = last30.filter((d) => d.done > 0).length;
        insights.push(`In the last ${last30.length} days you executed on ${active} of them (${Math.round((active / last30.length) * 100)}%).`);
    }
    const half = Math.floor(last30.length / 2);
    if (last30.length >= 14) {
        const a = last30.slice(0, half).reduce((s, d) => s + d.done, 0);
        const b = last30.slice(half).reduce((s, d) => s + d.done, 0);
        insights.push(b >= a ? 'Your recent two weeks are as strong or stronger than the two before. The trend is up.' : 'Your recent two weeks dipped against the two before. A restart today fixes the trend.');
    }
    const bucketEntries = Object.entries(detailed.bucketBalanceScores ?? {}) as [string, number][];
    if (bucketEntries.length) {
        const weakest = [...bucketEntries].sort((a, b) => a[1] - b[1])[0];
        insights.push(`${BUCKET_LABELS[weakest[0]] ?? weakest[0]} gets the least of your time. A small block there would balance the week.`);
    }

    const traj = detailed.trajectory;
    const next = progress.nextStage;

    return {
        name: name.trim() || 'Legacy Builder',
        generatedOn: fmtDate(today),
        firstDay: firstDay ? fmtDate(firstDay) : undefined,
        stageTitle: stage?.title,
        totals: [
            { label: 'Days executed', value: String(progress.totalDaysExecuted) },
            { label: 'Tasks completed', value: String(totalTasks) },
            { label: 'Average tasks per active day', value: activeDays.length ? (totalTasks / activeDays.length).toFixed(1) : '0' },
            { label: 'Best single day', value: bestDay ? `${bestDay.done} tasks on ${fmtShort(bestDay.date)}` : 'No data yet' },
            { label: 'Active weeks', value: String(weeks.filter((w) => w.executed > 0).length) },
            { label: 'Perfect weeks (7 of 7)', value: String(perfectWeeks) },
            { label: 'Current streak', value: `${progress.currentStreak} days` },
            { label: 'Longest streak', value: `${progress.longestStreak} days` },
            { label: 'Consistency since first day', value: `${consistency}%` },
            { label: 'Goals tracked', value: String(detailed.goals.length) },
            { label: 'Habits tracked', value: String(detailed.habits.length) },
        ],
        headline: {
            daysExecuted: progress.totalDaysExecuted,
            currentStreak: progress.currentStreak,
            longestStreak: progress.longestStreak,
            consistency,
            lifeScore: Math.round(traj?.total ?? 0),
        },
        insights,
        weekdays,
        months,
        weeks,
        weeklyExecution: (detailed.weeks ?? []).slice(-12).map((w) => ({
            // weekKey is usually already a readable range ("Sep 7 - Sep 13, 2026"); only format raw "2026-37" keys
            label: /^\d{4}-\d{1,2}$/.test(w.weekKey) ? WeekUtils.formatWeekDisplay(WeekUtils.normalizeWeek(w.weekKey)) : w.weekKey,
            planned: w.planned,
            completed: w.completed,
            efficiency: clampPct(w.efficiency),
        })),
        score: [
            { label: 'Goals', value: traj?.goalScore ?? 0, of: 40 },
            { label: 'Habits', value: traj?.habitScore ?? 0, of: 25 },
            { label: 'Execution', value: traj?.executionScore ?? 0, of: 25 },
            { label: 'Life balance', value: traj?.balanceScore ?? 0, of: 10 },
        ],
        goals: detailed.goals.map((g) => ({
            name: g.name,
            progress: clampPct(g.progress),
            detail: `${g.completedMilestones}/${g.totalMilestones} milestones${g.projectedCompletion ? `, projected ${g.projectedCompletion}` : ''}`,
        })),
        habits: detailed.habits.map((h) => ({
            name: h.name,
            consistency: clampPct(h.consistency),
            detail: `${h.activeDays}/${h.totalExpectedDays} days, longest streak ${h.longestStreak}`,
        })),
        buckets: Object.entries(detailed.bucketStats?.bucketHours ?? {}).map(([k, hours]) => ({
            label: BUCKET_LABELS[k] ?? k,
            hours: Math.round(Number(hours) * 10) / 10,
            score: Math.round(Number((detailed.bucketBalanceScores as Record<string, number>)?.[k] ?? 0) * 10) / 10,
        })),
        stages: MILESTONE_STAGES.map((s) => ({ title: s.title, days: s.days, reached: progress.totalDaysExecuted >= s.days })),
        nextStage: next ? { title: next.title, daysToGo: progress.daysToNext } : undefined,
        heat: pastDays.slice(-84).map((d) => d.done),
    };
}
