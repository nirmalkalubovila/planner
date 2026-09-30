import { describe, it, expect } from 'vitest';
import {
    createResetContext, analyzeHealth, buildProposal, summarizeProposal, applyProposalToGrid,
    goalImpact, getMoveOptions, overrideItem, itemKey, type ResetInput,
} from '../reset-engine';
import { WeekUtils } from '../week';
import type { GridState } from '../../types/planner';

const WEEK = '2026-40';
const days = WeekUtils.getDaysForWeek(WEEK);
const wednesday = new Date(days[2]);
wednesday.setHours(9, 0, 0, 0);

// Block helper: fills slots [start, end) of a day with one task
const put = (grid: Record<string, unknown>, day: number, start: number, end: number, name: string, extra: Record<string, unknown> = {}) => {
    for (let s = start; s < end; s++) grid[`${day}-${s}`] = { type: 'custom', name, ...extra };
};

const base = (grid: GridState, over: Partial<ResetInput> = {}): ResetInput => ({
    grid, weekStr: WEEK, now: wednesday, habits: [], goals: [],
    completedByDay: {}, priorities: [], sleepStart: '22:00', sleepDuration: 8,
    planDay: 'Sunday', planHours: 1, weekdayHours: 3, weekendHours: 3, ...over,
});

describe('reset engine', () => {
    it('reports a healthy week without inventing a problem', () => {
        const g: Record<string, unknown> = {};
        put(g, 3, 20, 22, 'Study');
        const ctx = createResetContext(base(g as GridState));
        const health = analyzeHealth(ctx);
        expect(health.overloadMin).toBe(0);
        expect(health.needsReset).toBe(false);
        expect(health.plannedMin).toBe(60);
    });

    it('ignores completed work and days that are already over', () => {
        const g: Record<string, unknown> = {};
        put(g, 0, 20, 24, 'Monday work');        // past
        put(g, 2, 24, 26, 'Done already');        // today, completed
        put(g, 3, 20, 22, 'Still to do');
        const ctx = createResetContext(base(g as GridState, { completedByDay: { 2: ['custom-Done already-24'] } }));
        expect(analyzeHealth(ctx).plannedMin).toBe(60);
    });

    it('fixes an overloaded day with keep, move, reduce and remove, without overlaps', () => {
        const g: Record<string, unknown> = {};
        put(g, 3, 20, 28, 'Client sample', { type: 'goal', goalId: 'g1' }); // 4h, priority
        put(g, 3, 28, 34, 'Website copy');                                   // 3h
        put(g, 3, 34, 38, 'Workout');                                        // 2h
        put(g, 3, 38, 40, 'Research');                                       // 1h
        const goals = [{ id: 'g1', name: 'Launch', title: 'Launch', endDate: '2026-12-31', startDate: '2026-01-01', purpose: '', goalType: 'Month' }] as any;
        const ctx = createResetContext(base(g as GridState, { goals, priorities: [{ text: 'Ship sample', goalId: 'g1' }], weekdayHours: 2, weekendHours: 1 }));
        const health = analyzeHealth(ctx);
        expect(health.overloadMin).toBeGreaterThan(0);
        expect(health.prioritiesAtRisk).toEqual(['Ship sample']);

        const items = buildProposal(ctx);
        const summary = summarizeProposal(ctx, items);
        expect(summary.overlaps).toEqual([]);
        expect(summary.afterMin).toBeLessThanOrEqual(summary.availableMin);
        expect(items.find((i) => i.name === 'Client sample')?.action).not.toBe('remove'); // priority protected
        expect(summary.afterMin).toBeLessThan(summary.beforeMin);

        const { state, deferred } = applyProposalToGrid(g as GridState, items);
        // nothing removed from the plan is deleted from the data: it is handed back to be kept
        deferred.forEach((d) => expect(Object.values(state).some((v: any) => v?.name === d.name)).toBe(false));
        expect(deferred.length).toBe(summary.counts.remove);
        // every non-removed task still exists exactly once in the new grid
        items.filter((i) => i.action !== 'remove').forEach((i) => {
            const slots = Object.entries(state).filter(([, v]: any) => v?.name === i.name);
            expect(slots.length * 30).toBe(i.newMinutes ?? i.minutes);
        });
    });

    it('protecting a goal keeps its work ahead of everything else', () => {
        const g: Record<string, unknown> = {};
        put(g, 3, 20, 30, 'Other work', { type: 'goal', goalId: 'other' });
        put(g, 3, 30, 40, 'Brand work', { type: 'goal', goalId: 'brand' });
        const goals = [
            { id: 'other', name: 'Other', title: 'Other', endDate: '2027-01-01', startDate: '2026-01-01', purpose: '', goalType: 'Month' },
            { id: 'brand', name: 'Brand', title: 'Brand', endDate: '2027-01-01', startDate: '2026-01-01', purpose: '', goalType: 'Month' },
        ] as any;
        const items = buildProposal(createResetContext(base(g as GridState, { goals, weekdayHours: 5, weekendHours: 0, protectGoalId: 'brand' })));
        expect(items.find((i) => i.name === 'Brand work')?.action).toBe('keep');
        expect(items.find((i) => i.name === 'Other work')?.action).not.toBe('keep');
        const impact = goalImpact(createResetContext(base(g as GridState, { goals })), items);
        expect(impact.some((x) => x.name === 'Other')).toBe(true);
    });

    it('moves work that is overdue today to a later slot and lets the user override', () => {
        const g: Record<string, unknown> = {};
        put(g, 2, 14, 16, 'Missed this morning'); // 07:00-08:00, now is 09:00
        const ctx = createResetContext(base(g as GridState));
        const items = buildProposal(ctx);
        expect(items[0].action).toBe('move');
        expect(items[0].to!.startSlot).toBeGreaterThanOrEqual(19);

        const options = getMoveOptions(ctx, items, items[0]);
        expect(options.length).toBeGreaterThan(1);
        const again = overrideItem(ctx, items, itemKey(items[0]), { action: 'move', to: options[1] });
        expect(again[0].to).toEqual(options[1]);
        const removed = overrideItem(ctx, again, itemKey(again[0]), { action: 'remove' });
        expect(removed[0].action).toBe('remove');
    });

    it('never schedules into sleep or over a habit', () => {
        const g: Record<string, unknown> = {};
        put(g, 2, 14, 16, 'Missed this morning');
        const habit = { id: 'h', name: 'Gym', startTime: '09:30', endTime: '10:30', daysOfWeek: [] } as any;
        const ctx = createResetContext(base(g as GridState, { habits: [habit] }));
        const items = buildProposal(ctx);
        expect(summarizeProposal(ctx, items).overlaps).toEqual([]);
        const to = items[0].to!;
        expect(to.startSlot >= 21 || to.endSlot <= 19).toBe(true); // not inside 09:30-10:30
        expect(to.endSlot).toBeLessThanOrEqual(44);
    });
});
