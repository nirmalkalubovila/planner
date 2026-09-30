import type { ExecutionProfile, GoalContext, DeepWorkBand, SwitchRecoveryBand, FreeTimeBand } from '../types/execution-profile';

/** Subset of the user profile the prompt builder reads (structurally typed to avoid a package cycle). */
export interface PromptProfile {
    primaryLifeFocus?: string;
    currentProfession?: string;
    energyPeakTime?: string;
    focusAbility?: string;
    taskShiftingAbility?: string;
    dailyFreeHours?: string;
    biggestChallenge?: string;
    executionProfile?: ExecutionProfile | null;
}

export const DEEP_WORK_LABELS: Record<DeepWorkBand, string> = {
    lt20: 'under 20 min', '20to45': '20-45 min', '45to90': '45-90 min', '90plus': '90+ min',
};
export const SWITCH_LABELS: Record<SwitchRecoveryBand, string> = {
    immediate: 'almost immediately', '5to15': '5-15 min', '15to30': '15-30 min', '30plus': '30+ min',
};
export const FREE_TIME_LABELS: Record<FreeTimeBand, string> = {
    lt1: 'under 1 hour', '1to2': '1-2 hours', '2to4': '2-4 hours', '4plus': '4+ hours',
};
const DEEP_WORK_MINUTES: Record<DeepWorkBand, number> = { lt20: 20, '20to45': 45, '45to90': 90, '90plus': 120 };
const FREE_TIME_HOURS: Record<FreeTimeBand, number> = { lt1: 1, '1to2': 2, '2to4': 4, '4plus': 5 };

/** Daily hour budget for goal work: prefer the user's stated free hours, then weekday band, then 3h. */
export function getDailyHourBudget(profile?: PromptProfile | null): { target: number; max: number } {
    const stated = parseFloat(profile?.dailyFreeHours ?? '');
    const band = profile?.executionProfile?.situation?.weekdayFree;
    const target = stated > 0 ? stated : band ? FREE_TIME_HOURS[band] : 3;
    return { target, max: Math.max(target, Math.ceil(target * 1.5)) };
}

const v = (s?: string | null, fallback = 'Not set') => (s && s.trim() ? s.trim() : fallback);

/**
 * Builds the "user persona" block for AI plan prompts, plus scheduling rules derived from the
 * execution profile. Old profiles (no executionProfile) fall back to the legacy fields only.
 */
export function buildPersonaPromptBlock(profile?: PromptProfile | null, goalContext?: GoalContext | null): string {
    const ep = profile?.executionProfile;
    const lines: string[] = [
        `- Primary Life Focus: ${v(profile?.primaryLifeFocus)}`,
        `- Current Profession: ${v(profile?.currentProfession)}`,
        `- Peak Energy Time: ${v(profile?.energyPeakTime, 'Morning')}`,
        `- Focus Ability: ${v(profile?.focusAbility, 'normal')}`,
        `- Task Shifting: ${v(profile?.taskShiftingAbility, 'normal')}`,
        `- Free Hours Per Day For Goals: ${v(profile?.dailyFreeHours)}`,
        `- Biggest Challenge: ${v(profile?.biggestChallenge)}`,
    ];
    const rules: string[] = [];

    if (ep) {
        if (ep.situation?.status) lines.push(`- Life Situation: ${ep.situation.status.replace('_', ' ')}`);
        if (ep.situation?.weekendFree) lines.push(`- Weekend Free Time: ${FREE_TIME_LABELS[ep.situation.weekendFree]}`);
        if (ep.capacity?.deepWorkMin) lines.push(`- Deep-Work Capacity: ${DEEP_WORK_LABELS[ep.capacity.deepWorkMin]}`);
        if (ep.capacity?.switchRecovery) lines.push(`- Context-Switch Recovery: ${SWITCH_LABELS[ep.capacity.switchRecovery]}`);
        if (ep.capacity?.sessionStyle) lines.push(`- Preferred Sessions: ${ep.capacity.sessionStyle === 'one_long' ? 'one long focused session' : 'several short sessions'}`);
        if (ep.capacity?.lowEnergyPeriod) lines.push(`- Low-Energy Period: ${ep.capacity.lowEnergyPeriod}`);
        if (ep.capacity?.maxDailyLoad) lines.push(`- Max Realistic Daily Load: ${ep.capacity.maxDailyLoad}`);
        if (ep.style?.structure) lines.push(`- Schedule Style: ${ep.style.structure}`);
        if (ep.style?.projectMode) lines.push(`- Project Mode: ${ep.style.projectMode === 'single' ? 'one major thing at a time' : 'comfortable with multiple projects'}`);
        if (ep.style?.deadlineResponse) lines.push(`- Motivation: ${ep.style.deadlineResponse === 'deadline_driven' ? 'deadline-driven' : 'self-driven'}`);
        if (ep.risks?.patterns?.length) lines.push(`- Failure Patterns: ${ep.risks.patterns.map(p => p.replace(/_/g, ' ')).join(', ')}`);
        if (ep.risks?.stopBehavior?.trim()) lines.push(`- When they stop following a goal: "${ep.risks.stopBehavior.trim()}"`);

        const slowSwitch = ep.capacity?.switchRecovery === '15to30' || ep.capacity?.switchRecovery === '30plus';
        if (slowSwitch) rules.push('Switching cost is HIGH: assign ONE main focus area per day (batch by theme), never alternate unrelated work within a day.');
        if (ep.capacity?.deepWorkMin) {
            const cap = DEEP_WORK_MINUTES[ep.capacity.deepWorkMin];
            rules.push(`Keep any single task block at or under ${cap} minutes; longer work must be split into separate sessions.`);
        }
        if (ep.capacity?.sessionStyle === 'several_short') rules.push('Prefer several short sessions over one long session.');
        if (ep.capacity?.lowEnergyPeriod) rules.push(`Put admin, review and light tasks in the ${ep.capacity.lowEnergyPeriod.toLowerCase()}; hard work near their peak energy.`);
        if (ep.capacity?.maxDailyLoad === 'light') rules.push('Keep daily load light; do not stack more than one demanding task per day.');
        const p = ep.risks?.patterns ?? [];
        if (p.includes('perfectionism') || p.includes('unrealistic_planning')) rules.push('Under-plan: keep tasks small and achievable; avoid ambitious stretch tasks.');
        if (p.includes('motivation') || p.includes('procrastination') || /miss|abandon|quit|give up/i.test(ep.risks?.stopBehavior ?? '')) {
            rules.push('Include a minimum viable action for each period so a missed day does not derail the whole plan.');
        }
        if (p.includes('too_many_things') || ep.style?.projectMode === 'single') rules.push('Limit parallel focus areas; sequence work instead of running it in parallel.');
    }

    const { target, max } = getDailyHourBudget(profile);
    rules.push(`Daily hours budget for this goal: about ${target} hours per day, never above ${max} hours per day.`);

    if (goalContext) {
        const g: string[] = [];
        if (goalContext.why?.trim()) g.push(`- Why it matters: ${goalContext.why.trim()}`);
        if (goalContext.successMeasure?.trim()) g.push(`- Success measure: ${goalContext.successMeasure.trim()}`);
        if (goalContext.deadlineFlex) g.push(`- Deadline: ${goalContext.deadlineFlex}`);
        if (goalContext.weeklyHours?.trim()) g.push(`- Hours available per week for this goal: ${goalContext.weeklyHours.trim()}`);
        const r = goalContext.resources;
        if (r?.budget) g.push(`- Budget: ${r.budget}`);
        if (r?.skills?.trim()) g.push(`- Existing skills: ${r.skills.trim()}`);
        if (r?.tools?.trim()) g.push(`- Tools/equipment: ${r.tools.trim()}`);
        if (r?.network?.trim()) g.push(`- People who can help: ${r.network.trim()}`);
        const a = goalContext.priorAttempt;
        if (a?.attempted) g.push(`- Previous attempt: tried "${v(a.whatTried, 'unspecified')}", stopped because "${v(a.whyStopped, 'unspecified')}" - design the plan to avoid that failure`);
        if (g.length) lines.push('', 'Goal Context:', ...g);
        if (goalContext.deadlineFlex === 'flexible') rules.push('The deadline is flexible: prefer a sustainable pace over cramming.');
        if (goalContext.resources?.budget === 'none') rules.push('Do not include tasks that require spending money.');
    }

    return `User Persona & Preferences:\n${lines.join('\n')}\n\nPERSONALIZATION RULES (follow strictly):\n${rules.map(r => `- ${r}`).join('\n')}`;
}
