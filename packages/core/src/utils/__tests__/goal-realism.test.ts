import { describe, it, expect } from 'vitest';
import {
    assessGoalRealism, parseLkrAmounts, goalDurationMonths, monthsToGoalDuration, LKR_TYPICAL_MONTHLY_WAGE,
} from '../goal-realism';
import { ALL_GOAL_CHIPS, PRIMARY_GOAL_CHIPS, findGoalChip } from '../landing-goals';
import { checkMasterPlan, buildMasterPlanPrompt, PLAN_REALISM_RULES } from '../plan-prompts';

describe('parseLkrAmounts', () => {
    it('reads the ways people write rupee amounts', () => {
        expect(parseLkrAmounts('Save LKR 500,000 for an emergency fund')).toEqual([500000]);
        expect(parseLkrAmounts('earn Rs. 100k a month')).toEqual([100000]);
        expect(parseLkrAmounts('save 2 lakh rupees')).toEqual([200000]);
        expect(parseLkrAmounts('earn 1.5m LKR')).toEqual([1500000]);
        expect(parseLkrAmounts('read 12 books')).toEqual([]);
    });
});

describe('assessGoalRealism', () => {
    it('catches savings that need more than a typical wage every month', () => {
        const n = assessGoalRealism({ text: 'Save LKR 500,000 for an emergency fund', months: 6 })!;
        expect(n.level).toBe('unrealistic');
        expect(n.suggestedMonths).toBeGreaterThan(24);
        expect(n.detail).toContain('83,333');
    });

    it('accepts savings at a comfortable share of a typical wage', () => {
        expect(assessGoalRealism({ text: 'Save LKR 100,000 for an emergency fund', months: 12 })!.level).toBe('ok');
    });

    it('flags income goals far above a typical wage, and accepts reachable ones', () => {
        expect(assessGoalRealism({ text: 'Start a side business and earn LKR 100,000/month', months: 12 })!.level).toBe('unrealistic');
        expect(assessGoalRealism({ text: 'Start a side business and earn LKR 30,000 a month', months: 12 })!.level).toBe('ok');
    });

    it('makes the same income target harder on a short runway', () => {
        expect(assessGoalRealism({ text: 'earn LKR 30,000 a month', months: 3 })!.level).toBe('stretch');
    });

    it('checks weight loss against a safe weekly pace', () => {
        expect(assessGoalRealism({ text: 'Lose 10 kg', months: 1 })!.level).toBe('unrealistic');
        expect(assessGoalRealism({ text: 'Lose 10 kg and exercise 4 days a week', months: 6 })!.level).toBe('ok');
    });

    it('stays silent when there is nothing it can measure', () => {
        expect(assessGoalRealism({ text: 'Get a better-paying job within 6 months', months: 6 })).toBeNull();
        expect(assessGoalRealism({ text: 'Read 12 books this year', months: 12 })).toBeNull();
    });

    it('uses the typical wage as its reference', () => {
        expect(LKR_TYPICAL_MONTHLY_WAGE).toBe(43000);
    });
});

describe('landing chips', () => {
    it('every chip is realistic over its own timeline', () => {
        for (const chip of ALL_GOAL_CHIPS) {
            const note = assessGoalRealism({ text: chip.text, months: chip.months });
            if (note) expect(note.level, `${chip.text} (${chip.months} months): ${note.detail}`).toBe('ok');
        }
    });

    it('timelines fit what the goal form accepts', () => {
        for (const chip of ALL_GOAL_CHIPS) {
            const { goalType, durationValue } = monthsToGoalDuration(chip.months);
            if (goalType === 'Month') expect(durationValue).toBeGreaterThanOrEqual(2);
            expect(goalDurationMonths(goalType, durationValue)).toBeGreaterThanOrEqual(chip.months - 0.5);
        }
    });

    it('shows four primary chips, and finds a chip from typed text', () => {
        expect(PRIMARY_GOAL_CHIPS).toHaveLength(4);
        expect(findGoalChip('  get a BETTER-paying job within 6 months ')?.months).toBe(6);
        expect(findGoalChip('something else')).toBeUndefined();
    });
});

describe('the plan prompt and its checks', () => {
    const goal = { title: 'Save', name: 'Save LKR 500,000', purpose: 'Safety', startDate: '2026-10-01', endDate: '2027-03-31', milestones: [{ id: '1', title: 'M1', targetDate: '2026-12-31', completed: false }, { id: '2', title: 'M2', targetDate: '2027-03-31', completed: false }] } as any;

    it('puts the reality rules and the feasibility facts in front of the AI', () => {
        const note = assessGoalRealism({ text: goal.name, months: 6 })!;
        const prompt = buildMasterPlanPrompt({ goal, todayLabel: 'October 1, 2026', feasibility: note });
        expect(prompt).toContain(PLAN_REALISM_RULES.split('\n')[0]);
        expect(prompt).toContain('FEASIBILITY NOTES FROM THE SYSTEM');
        expect(prompt).toContain('Do not fake the original target');
        expect(prompt).toContain('2026-12-31');
    });

    it('repairs dates and impossible hours, and rejects unusable answers', () => {
        const good = checkMasterPlan(
            [{ date: 'wrong', dayTask: 'Open account', description: 'x', estimatedHours: 9999 }, { date: '2027-03-31', dayTask: 'Save LKR 20,000', description: 'y', estimatedHours: 30 }],
            ['2026-12-31', '2027-03-31'], '2026-10-01', 4,
        );
        expect(good.fatal).toBe(false);
        expect(good.slots[0].date).toBe('2026-12-31');
        expect(good.slots[0].estimatedHours).toBeLessThanOrEqual(91 * 4);
        expect(good.issues.length).toBeGreaterThan(0);

        expect(checkMasterPlan([{ dayTask: 'a' }], ['2026-12-31', '2027-03-31'], '2026-10-01', 4).fatal).toBe(true);
        expect(checkMasterPlan('nope', ['2026-12-31'], '2026-10-01', 4).fatal).toBe(true);
        expect(checkMasterPlan([{ dayTask: '' }], ['2026-12-31'], '2026-10-01', 4).fatal).toBe(true);
        const copy = checkMasterPlan([{ dayTask: 'Same' }, { dayTask: 'same' }], ['2026-12-31', '2027-03-31'], '2026-10-01', 4);
        expect(copy.fatal).toBe(true);
    });
});
