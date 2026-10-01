import type { AIGeneratedPlanSlot, Goal } from '../types/domain';
import { bucketPromptLine, buildPersonaPromptBlock, getDailyHourBudget, type PromptProfile } from './ai-profile-prompt';
import type { RealismNote } from './goal-realism';

/**
 * Rules that keep a generated plan something a person can really follow. Shared by the top-level plan and the
 * month and week breakdowns, so every level of a plan has the same standard.
 */
export const PLAN_REALISM_RULES = `REALITY RULES (the user will follow this plan literally, so it must be achievable):
1. SUSTAINABLE PACE: Plan at the pace a typical person with the stated free hours can keep up. Never compress a goal to hit a date; an honest lower milestone is better than an impossible one.
2. RAMP, DO NOT DRAW A STRAIGHT LINE: money, audience, customers and skills grow slowly at first. The first period is for setup, learning and the first small proof, not a big result. Never schedule revenue in the first period of a brand-new business or side income.
3. NUMBERS MUST ADD UP: milestone targets increase period by period and the last one equals the goal's target, unless the FEASIBILITY NOTES say the target is out of reach by the end date. In that case follow the achievable pace and state in the last milestone what is honestly reachable and what remains.
4. LOCAL REALITY: use only methods, tools, platforms and payment options that are practical in the user's country (infer it from the currency, for example LKR means Sri Lanka). Do not assume services that are unavailable there. When unsure, choose the cheapest, most widely available option.
5. NO PROMISES: never guarantee a result. Say what to do and how to measure it.
6. EVERY TASK IS FINISHABLE: a clear action the person could start today, with a number or a visible finished state.
7. MONEY: prefer free or low-cost first steps. If money must be spent, state the amount in the user's currency.`;

export interface MasterPlanPromptInput {
    goal: Pick<Goal, 'title' | 'name' | 'purpose' | 'startDate' | 'endDate' | 'milestones' | 'bucket' | 'goalContext'>;
    profile?: PromptProfile | null;
    /** Already formatted, for example "October 1, 2026". Passed in so this stays pure. */
    todayLabel: string;
    /** From assessGoalRealism: stated as facts the plan must respect. */
    feasibility?: RealismNote | null;
}

/** The prompt for the top-level plan: exactly one sub-goal per milestone date. */
export function buildMasterPlanPrompt({ goal, profile, todayLabel, feasibility }: MasterPlanPromptInput): string {
    const milestoneDatesStr = goal.milestones
        ? goal.milestones.map((m) => `- ${m.title}: ${m.targetDate}`).join('\n')
        : `End Date: ${goal.endDate}`;
    const budget = getDailyHourBudget(profile);
    const feasibilityBlock = feasibility && feasibility.level !== 'ok'
        ? `\nFEASIBILITY NOTES FROM THE SYSTEM (treat as facts, they were calculated before this request):\n- ${feasibility.detail}\n- Follow the achievable pace. Do not fake the original target.\n`
        : feasibility
            ? `\nFEASIBILITY NOTES FROM THE SYSTEM: ${feasibility.detail}\n`
            : '';

    return `
Generate a detailed milestone action plan for achieving a goal.
Goal Title: ${goal.title || ''}
Goal Description/Mission: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
System Current Date: ${todayLabel}

Target Milestone Dates:
${milestoneDatesStr}

${bucketPromptLine(goal.bucket)}
${buildPersonaPromptBlock(profile, goal.goalContext)}
${feasibilityBlock}
Based on this, break down the main goal into weighted sub-tasks/sub-goals that need to be accomplished by the end of each milestone period.
Tailor the nature and pacing of the tasks to fit this specific person's profession, life focus, and energy capabilities.
TIMELINE SYNC CRITICAL: Use the "System Current Date" as your reality baseline to understand the exact year and timeframe you are generating this for.

PRAGMATIC STRATEGY RULES (ACT AS AN ELITE PERFORMANCE ARCHITECT):
1. ZERO FLUFF: Do not include motivational quotes, generic encouragement, or vague advice in the title ("dayTask") or details ("description"). Provide only tactical, executable tasks.
2. RESPECT CONSTRAINTS: Rigorously apply the constraints, starting situation, and resource limitations provided by the user. Early phases must focus on bootstrapping, free validation, or skill acquisition if time/money are limited.
3. CURRENCY ALIGNMENT: If a specific currency (e.g., LKR) or metric is provided in the goal parameters, use it for all financial estimations, sub-goal targets, and milestones.
4. METRIC-DRIVEN: Every generated task must have a quantifiable metric or threshold of completion in the title or description that proves the task is complete.

${PLAN_REALISM_RULES}

NUMERICAL PROGRESSION & TARGET INTERPOLATION:
If the Goal Title, Description/Mission, or Purpose contains a specific numeric target (e.g., "reach 10k followers", "earn $5000", "lose 10kg", "write 50 pages"), you MUST scale this target across the target milestones along a realistic curve (see REALITY RULES 2 and 3), not as equal steps.
- Identify the starting baseline if specified (e.g., "currently at 241 followers"). If not specified, assume 0 or a reasonable starting point.
- You MUST explicitly state the progressive count target in the sub-goal title ("dayTask") and details ("description") for each milestone, reflecting the calculated target for that period.

REALISTIC ESTIMATED HOURS:
- The "estimatedHours" MUST be a highly realistic, non-generic estimation of the cumulative hours required to execute that specific milestone's tasks.
- PRACTICAL HOURLY LIMITS: Do not estimate impractical hours. For this person, the absolute maximum quality work hours is ${budget.max} hours a day (${budget.max * 7} hours a week, ${budget.max * 30} hours a month).
- Their standard budget is ${budget.target} hours a day, which means exactly ${budget.target * 7} hours a week (${budget.target * 30} hours a month).
- DYNAMIC ALLOCATION (NEVER HARDCODE): Do NOT assign the exact same constant hours to every month or week. The estimated hours must expand or contract with the complexity of that period, always strictly below the weekly budget cap of ${budget.target * 7} hours.
- A 4-week Month phase must not exceed ${budget.target * 28} hours total; a Week phase must not exceed ${budget.target * 7} hours total.

Return an action plan as a JSON array of objects.

CRITICAL INSTRUCTION: DO NOT generate tiny, daily tasks. Instead, generate exactly ONE major SUB-GOAL or SUB-TASK to be accomplished by EACH "Target Milestone Date" listed above. If there are 3 Milestone Dates, you should only return an array with exactly 3 objects. This single sub-goal per milestone should represent the main objective for that entire period.
The "date" field in your JSON must exactly match the YYYY-MM-DD target dates provided in the milestone list.

Each object must have exactly these keys:
{
  "date": "YYYY-MM-DD",
  "dayTask": "string - short title of the major sub-goal/task including progressive target numbers",
  "description": "string - 1 to 2 sentences detailing what needs to be achieved during this period to hit this sub-goal and its target count.",
  "estimatedHours": number - realistic cumulative estimated hours needed to complete this milestone's task (e.g. 45)
}
\nRETURN ONLY PARSABLE JSON ARRAY FORMAT NO MARKDOWN TAGS.
`;
}

// ─────────────────────────── checking what the AI returned ───────────────────────────

export interface PlanCheck {
    slots: AIGeneratedPlanSlot[];
    /** Problems found and, where possible, already repaired. */
    issues: string[];
    /** True when the result cannot be used and the AI should be asked again. */
    fatal: boolean;
}

const dayMs = 86400000;
const toTime = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

/**
 * Checks the top-level plan against what was asked: one item per milestone date, a real title, no repeated titles,
 * and hours that fit the days available. Dates are forced to the requested ones and impossible hours are capped,
 * so what reaches the user always lines up with their calendar.
 */
export function checkMasterPlan(raw: unknown, expectedDates: string[], startDate: string, maxHoursPerDay: number): PlanCheck {
    const issues: string[] = [];
    if (!Array.isArray(raw)) return { slots: [], issues: ['The AI did not return a list.'], fatal: true };
    if (raw.length !== expectedDates.length) {
        return { slots: [], issues: [`Expected ${expectedDates.length} milestones but got ${raw.length}.`], fatal: true };
    }

    const seen = new Set<string>();
    let previous = startDate;
    const slots: AIGeneratedPlanSlot[] = [];

    for (let i = 0; i < raw.length; i++) {
        const item = raw[i] as Partial<AIGeneratedPlanSlot> | null;
        const title = String(item?.dayTask ?? '').trim();
        if (!title) return { slots: [], issues: [`Milestone ${i + 1} has no title.`], fatal: true };

        const key = title.toLowerCase();
        if (seen.has(key)) issues.push(`Milestone ${i + 1} repeats an earlier title.`);
        seen.add(key);

        if (item?.date !== expectedDates[i]) issues.push(`Milestone ${i + 1} date was corrected to ${expectedDates[i]}.`);

        const days = Math.max(7, Math.round((toTime(expectedDates[i]) - toTime(previous)) / dayMs));
        const cap = days * maxHoursPerDay;
        const hours = Number(item?.estimatedHours);
        let estimatedHours: number | undefined;
        if (Number.isFinite(hours) && hours > 0) {
            estimatedHours = Math.min(Math.round(hours), cap);
            if (hours > cap) issues.push(`Milestone ${i + 1} hours were capped from ${Math.round(hours)} to ${cap}.`);
        } else {
            issues.push(`Milestone ${i + 1} had no usable hours.`);
        }

        slots.push({
            date: expectedDates[i],
            dayTask: title,
            description: String(item?.description ?? '').trim(),
            ...(estimatedHours !== undefined ? { estimatedHours } : {}),
        });
        previous = expectedDates[i];
    }

    // A plan whose titles are all the same is a copy-paste, not a plan
    const fatal = slots.length > 1 && seen.size === 1;
    return { slots, issues, fatal };
}
