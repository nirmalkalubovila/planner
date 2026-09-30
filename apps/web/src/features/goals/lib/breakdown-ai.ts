import { format } from 'date-fns';
import {
    bucketPromptLine, buildPersonaPromptBlock, getDailyHourBudget, getMilestonePeriods, getMonthPeriods, getWeekPeriods,
    breakdownLevels, pickCurrentIndex, todayISO,
    type AIGeneratedPlanSlot, type Goal, type Period, type PromptProfile,
} from '@llb/core';
import { callAI } from '../hooks/use-ai-plan-generation';

type Level = 'Months' | 'Weeks';

export const periodsFor = (level: Level, startISO: string, endISO: string): Period[] =>
    level === 'Weeks' ? getWeekPeriods(startISO, endISO) : getMonthPeriods(startISO, endISO);

interface SubPlanRequest {
    goal: Goal;
    /** The phase being broken down. */
    parent: AIGeneratedPlanSlot;
    level: Level;
    periodStart: string;
    periodEnd: string;
    profile?: PromptProfile | null;
}

function buildSubPlanPrompt({ goal, parent, level, periodStart, periodEnd, profile }: SubPlanRequest, periods: Period[]): string {
    const count = periods.length;
    const budget = getDailyHourBudget(profile);
    const isWeekLevel = level === 'Weeks';
    const unit = isWeekLevel ? 'Week' : 'Month';
    const parentLevelTasks = goal.plans?.map((p) => p.dayTask).join(', ') || '';
    const ranges = periods.map((p, i) => `${unit} ${i + 1}: ${p.start} to ${p.end} (${p.label})`).join('\n');

    return `Generate a detailed hierarchical action plan breakdown for the following phase of the overall goal.
Goal Title: ${goal.title || ''}
Goal Description/Mission: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
Phase Target Task (with parent target count): ${parent.dayTask}
Phase Strategy/Description: ${parent.description}
Phase Timeline: ${periodStart} to ${periodEnd}
System Current Date: ${format(new Date(), 'MMMM d, yyyy')}
${bucketPromptLine(goal.bucket)}
${buildPersonaPromptBlock(profile, goal.goalContext)}
Tailor tasks specifically to fit this person's profession, life focus, and energy cycles when possible.
Context - The surrounding sibling phases in the overall plan are: ${parentLevelTasks}. Ensure this new breakdown strictly stays within the current phase's boundaries.

PRAGMATIC STRATEGY RULES (ACT AS AN ELITE PERFORMANCE ARCHITECT):
1. ZERO FLUFF: Do not include motivational quotes, generic encouragement, or vague advice in the title ("dayTask") or details ("description"). Provide only tactical, executable tasks.
2. RESPECT CONSTRAINTS: Rigorously apply the constraints, starting situation, and resource limitations provided by the user. Early phases must focus on bootstrapping, free validation, or skill acquisition if time/money are limited.
3. CURRENCY ALIGNMENT: If a specific currency (e.g., LKR) or metric is provided in the goal parameters, use it for all financial estimations, sub-goal targets, and milestones.
4. METRIC-DRIVEN: Every generated task must have a quantifiable metric or threshold of completion in the title or description that proves the task is complete.

NUMERICAL PROGRESSION & TARGET INTERPOLATION:
If the Goal Title, Description, Purpose, or the Phase Target Task contains a specific numeric target (e.g., "reach 10k followers", "reach 1k followers"), you MUST mathematically interpolate/scale this target across the ${count} sequential sub-milestones (representing ${level}).
- Proportionally distribute the numeric target progress over these ${count} periods.
- Specify the progressive target numbers clearly in each sub-milestone's title ("dayTask") and details ("description") (e.g. Week 1: Reach 400 followers, Week 2: Reach 600 followers, Week 3: Reach 800 followers, Week 4: Reach 1k followers).

REALISTIC ESTIMATED HOURS:
- The "estimatedHours" MUST be a highly realistic, non-generic estimation of the cumulative hours required to execute that specific sub-milestone task.
- PRACTICAL HOURLY LIMITS: Do not estimate impractical hours. For this person, the absolute maximum quality work hours is ${budget.max} hours a day (${budget.max * 7} hours a week, ${budget.max * 30} hours a month).
- Their standard budget is ${budget.target} hours a day, which means exactly ${budget.target * 7} hours a week (${budget.target * 30} hours a month).
- DYNAMIC ALLOCATION (NEVER HARDCODE): Do NOT assign the exact same constant hours to every month or week. The estimated hours must expand or contract with the complexity of that period, always strictly below the weekly budget cap of ${budget.target * 7} hours.
- A 4-week Month phase must not exceed ${budget.target * 28} hours total; a Week phase must not exceed ${budget.target * 7} hours total.

Break this phase down into EXACTLY ${count} sequential sub-milestones (representing ${level}). The order must follow the ranges below, one object per range, none skipped or merged.
TIMELINE SYNC CRITICAL: Use the "System Current Date" as your reality baseline.
PRE-CALCULATED ${unit.toUpperCase()} RANGES:
${ranges}
Return ONLY a JSON array with exactly ${count} objects.
Each object: { "date": "string", "dayTask": "string - short title including progressive target numbers", "description": "string - 1-2 sentences detailing target progress details", "estimatedHours": number }
NO MARKDOWN. RAW JSON ONLY.`;
}

/**
 * Breaks one phase into months or weeks. The model must return exactly one item per period; the dates, exact
 * period bounds and bucket are then stamped on by us, so they can never drift from what the model wrote.
 */
export async function generateSubPlans(req: SubPlanRequest): Promise<AIGeneratedPlanSlot[]> {
    const periods = periodsFor(req.level, req.periodStart, req.periodEnd);
    if (periods.length === 0) throw new Error(`No ${req.level.toLowerCase()} fit inside this phase`);

    const prompt = buildSubPlanPrompt(req, periods);
    const budget = getDailyHourBudget(req.profile);
    const hourCap = req.level === 'Weeks' ? budget.max * 7 : budget.max * 31;

    let lastCount = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
        const raw = await callAI(prompt);
        lastCount = Array.isArray(raw) ? raw.length : 0;
        if (!Array.isArray(raw) || raw.length !== periods.length) continue;
        if (raw.some((item) => !item || !String(item.dayTask ?? '').trim())) continue;

        return raw.map((item, i) => {
            const hours = Number(item.estimatedHours);
            return {
                date: periods[i].label,
                dayTask: String(item.dayTask).trim(),
                description: String(item.description ?? '').trim(),
                estimatedHours: Number.isFinite(hours) && hours > 0 ? Math.min(hours, hourCap) : undefined,
                periodStart: periods[i].start,
                periodEnd: periods[i].end,
                ...(req.goal.bucket ? { bucket: req.goal.bucket } : {}),
            };
        });
    }
    throw new Error(`The planner returned ${lastCount} ${req.level.toLowerCase()} but ${periods.length} were needed`);
}

/** Stamps exact period bounds and the goal's bucket on the top-level phases (one per milestone). Idempotent. */
export function annotateTopLevel(goal: Goal, plans: AIGeneratedPlanSlot[]): AIGeneratedPlanSlot[] {
    const periods = getMilestonePeriods(goal.startDate, plans.map((p) => p.date));
    const byEnd = new Map(periods.map((p) => [p.end, p]));
    return plans.map((slot) => {
        const period = byEnd.get(slot.date);
        return {
            ...slot,
            ...(period ? { periodStart: slot.periodStart ?? period.start, periodEnd: slot.periodEnd ?? period.end } : {}),
            ...(goal.bucket ? { bucket: goal.bucket } : {}),
        };
    });
}

const topLevelPeriod = (goal: Goal, slot: AIGeneratedPlanSlot): { start: string; end: string } | null => {
    if (slot.periodStart && slot.periodEnd) return { start: slot.periodStart, end: slot.periodEnd };
    const periods = getMilestonePeriods(goal.startDate, (goal.plans ?? []).map((p) => p.date));
    return periods.find((p) => p.end === slot.date) ?? null;
};

/** Periods of the month phases under a year phase, in order (stored bounds when present, else recomputed). */
const monthPeriodsOf = (yearSlot: AIGeneratedPlanSlot, yearPeriod: { start: string; end: string }) => {
    const computed = getMonthPeriods(yearPeriod.start, yearPeriod.end);
    return (yearSlot.subPlans ?? []).map((m, i) => (m.periodStart && m.periodEnd ? { start: m.periodStart, end: m.periodEnd } : computed[i] ?? null));
};

/**
 * What still has to be planned, without calling the AI. Rolling rule: every year gets its months, and only the
 * current month gets its weeks. Later months get their weeks when they become the current month.
 */
export function pendingBreakdown(goal: Goal): { yearsNeedingMonths: number[]; currentMonthNeedsWeeks: { yearIdx: number; monthIdx: number } | null; weeksForTop: number | null } {
    const plans = goal.plans ?? [];
    const out = { yearsNeedingMonths: [] as number[], currentMonthNeedsWeeks: null as { yearIdx: number; monthIdx: number } | null, weeksForTop: null as number | null };
    if (plans.length === 0) return out;
    const today = todayISO();
    const tops = plans.map((slot) => topLevelPeriod(goal, slot));
    const valid = tops.map((t) => t ?? { start: '9999-12-31', end: '9999-12-31' });
    const curTop = pickCurrentIndex(valid, today);

    if (goal.goalType === 'Year') {
        plans.forEach((slot, i) => { if (tops[i] && !slot.subPlans?.length) out.yearsNeedingMonths.push(i); });
        const yearSlot = plans[curTop];
        const yearPeriod = tops[curTop];
        if (yearSlot?.subPlans?.length && yearPeriod) {
            const months = monthPeriodsOf(yearSlot, yearPeriod).map((m) => m ?? { start: '9999-12-31', end: '9999-12-31' });
            const curMonth = pickCurrentIndex(months, today);
            if (curMonth >= 0 && !yearSlot.subPlans[curMonth].subPlans?.length) out.currentMonthNeedsWeeks = { yearIdx: curTop, monthIdx: curMonth };
        }
    } else if (goal.goalType === 'Month') {
        if (curTop >= 0 && tops[curTop] && !plans[curTop].subPlans?.length) out.weeksForTop = curTop;
    }
    return out;
}

export const needsBreakdown = (goal: Goal): boolean => {
    const p = pendingBreakdown(goal);
    return p.yearsNeedingMonths.length > 0 || !!p.currentMonthNeedsWeeks || p.weeksForTop !== null;
};

export interface BreakdownResult { plans: AIGeneratedPlanSlot[]; generated: string[] }

/**
 * Builds the breakdown for a goal using the rolling rule above. Year goals: months for every year, weeks for the
 * current month. Month goals: weeks for the current month. Week goals have nothing below their weeks.
 * Returns a new plans tree; the input is not modified.
 */
export async function ensureRollingBreakdown(goal: Goal, profile?: PromptProfile | null, onStep?: (message: string) => void): Promise<BreakdownResult> {
    if (breakdownLevels(goal.goalType).length === 0 || !goal.plans?.length) return { plans: goal.plans ?? [], generated: [] };

    let plans = annotateTopLevel(goal, JSON.parse(JSON.stringify(goal.plans)) as AIGeneratedPlanSlot[]);
    const working: Goal = { ...goal, plans };
    const generated: string[] = [];
    const pending = pendingBreakdown(working);

    for (const i of pending.yearsNeedingMonths) {
        const period = topLevelPeriod(working, plans[i]);
        if (!period) continue;
        onStep?.(`Planning the months of ${plans[i].dayTask}`);
        plans[i].subPlans = await generateSubPlans({ goal: working, parent: plans[i], level: 'Months', periodStart: period.start, periodEnd: period.end, profile });
        generated.push(`${plans[i].subPlans!.length} months`);
    }

    working.plans = plans;
    const after = pendingBreakdown(working);

    if (after.currentMonthNeedsWeeks) {
        const { yearIdx, monthIdx } = after.currentMonthNeedsWeeks;
        const yearSlot = plans[yearIdx];
        const monthSlot = yearSlot.subPlans![monthIdx];
        const period = monthPeriodsOf(yearSlot, topLevelPeriod(working, yearSlot)!)[monthIdx];
        if (period) {
            onStep?.(`Planning the weeks of ${monthSlot.date}`);
            monthSlot.periodStart = period.start;
            monthSlot.periodEnd = period.end;
            monthSlot.subPlans = await generateSubPlans({ goal: working, parent: monthSlot, level: 'Weeks', periodStart: period.start, periodEnd: period.end, profile });
            generated.push(`${monthSlot.subPlans.length} weeks`);
        }
    } else if (after.weeksForTop !== null) {
        const slot = plans[after.weeksForTop];
        const period = topLevelPeriod(working, slot);
        if (period) {
            onStep?.(`Planning the weeks of ${slot.dayTask}`);
            slot.subPlans = await generateSubPlans({ goal: working, parent: slot, level: 'Weeks', periodStart: period.start, periodEnd: period.end, profile });
            generated.push(`${slot.subPlans.length} weeks`);
        }
    }

    return { plans, generated };
}
