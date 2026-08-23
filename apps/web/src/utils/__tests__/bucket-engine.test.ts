import { describe, it, expect } from 'vitest';
import {
  resolveSlotBucket,
  calculateWeekBucketHours,
  detectEmptyBucketStreaks,
  calculateBucketBalanceScores,
  TOTAL_WEEK_HOURS,
  type WeeklyBucketHistory,
} from '@/utils/bucket-engine';
import type { Goal, Habit, CustomTask } from '@/types/global-types';
import type { GridState, PlanSlot } from '@/types/planner';

// Golden-value tests for the bucket engine — capture today's behavior for
// fixed inputs so the move to @llb/core can be verified lossless.

const goals: Goal[] = [
  { id: 'g1', title: 'Ship the app', name: 'Ship the app', purpose: '', startDate: '2026-01-01', endDate: '2026-12-31', goalType: 'Year', bucket: 'income' },
];
const habits: Habit[] = [
  { name: 'Morning Run', startTime: '06:00', endTime: '07:00', bucket: 'recovery', daysOfWeek: ['Monday'] },
];
const customTasks: CustomTask[] = [
  { name: 'Read', startTime: '20:00', endTime: '20:30', daysOfWeek: [], bucket: 'asset' },
];

describe('resolveSlotBucket', () => {
  it('trusts an explicit bucket on the slot itself over everything else', () => {
    const slot: PlanSlot = { type: 'custom', name: 'Anything', bucket: 'relational' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('relational');
  });

  it('defaults sleep slots to recovery', () => {
    const slot: PlanSlot = { type: 'sleep', name: 'Sleep' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('recovery');
  });

  it('defaults weekly-planning slots to recovery', () => {
    const slot: PlanSlot = { type: 'plan', name: 'Weekly Planning' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('recovery');
  });

  it('resolves a goal slot by goalId', () => {
    const slot: PlanSlot = { type: 'goal', name: 'Ship the app', goalId: 'g1' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('income');
  });

  it('resolves a goal slot by matching name when goalId is absent', () => {
    const slot: PlanSlot = { type: 'goal', name: 'Ship the app' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('income');
  });

  it('resolves a habit slot by exact name match', () => {
    const slot: PlanSlot = { type: 'habit', name: 'Morning Run' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('recovery');
  });

  it('resolves a custom task slot by exact name match', () => {
    const slot: PlanSlot = { type: 'custom', name: 'Read' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBe('asset');
  });

  it('returns null for an unmatched custom task', () => {
    const slot: PlanSlot = { type: 'custom', name: 'Something Unlisted' } as PlanSlot;
    expect(resolveSlotBucket(slot, goals, habits, customTasks)).toBeNull();
  });

  it('returns null for a falsy slot', () => {
    expect(resolveSlotBucket(null as any, goals, habits, customTasks)).toBeNull();
  });
});

describe('calculateWeekBucketHours', () => {
  it('returns all zeros for an empty grid', () => {
    const result = calculateWeekBucketHours({} as GridState, goals, habits, customTasks);
    expect(result).toEqual({
      bucketHours: { income: 0, asset: 0, recovery: 0, relational: 0 },
      unassignedHours: 0,
      unassignedTaskNames: [],
      totalAllocatedHours: 0,
      totalWeekHours: TOTAL_WEEK_HOURS,
      userSleepHours: 0,
      userPlanHours: 0,
      bucketPercentages: { income: 0, asset: 0, recovery: 0, relational: 0 },
      strongestBucket: null,
      weakestBucket: null,
    });
  });

  it('returns all zeros when the grid has keys but no planned content', () => {
    const grid = { 'some-meta-key': null } as unknown as GridState;
    const result = calculateWeekBucketHours(grid, goals, habits, customTasks);
    expect(result.totalAllocatedHours).toBe(0);
    expect(result.strongestBucket).toBeNull();
  });

  it('allocates a single goal slot to its bucket and counts sleep/plan defaults', () => {
    const grid: GridState = {
      '0-0': { type: 'goal', name: 'Ship the app', goalId: 'g1' } as PlanSlot,
    } as GridState;

    const result = calculateWeekBucketHours(
      grid,
      goals,
      habits,
      customTasks,
      '22:00', // userSleepStart
      8,       // userSleepDuration (hours)
      'Sunday',
      1
    );

    // One explicit goal slot -> 0.5h income.
    expect(result.bucketHours.income).toBe(0.5);
    // Sleep (8h) + Sunday planning (1h) both default to recovery.
    expect(result.userSleepHours).toBe(56); // 8h * 7 days
    expect(result.userPlanHours).toBe(1);
    expect(result.bucketHours.recovery).toBeGreaterThan(0);
    expect(result.totalWeekHours).toBe(TOTAL_WEEK_HOURS);
  });

  it('records unassigned task names for slots with no resolvable bucket', () => {
    const grid: GridState = {
      '1-10': { type: 'custom', name: 'Mystery Task' } as PlanSlot,
    } as GridState;
    const result = calculateWeekBucketHours(grid, [], [], [], '22:00', 8, 'Sunday', 1);
    expect(result.unassignedTaskNames).toContain('Mystery Task');
    expect(result.unassignedHours).toBeGreaterThan(0);
  });
});

describe('detectEmptyBucketStreaks', () => {
  it('counts trailing zero-hour weeks per bucket', () => {
    const history: WeeklyBucketHistory[] = [
      { week: '2026-30', hours: { income: 5, asset: 0, recovery: 10, relational: 0 }, unassignedHours: 0, totalHours: 15 },
      { week: '2026-31', hours: { income: 0, asset: 0, recovery: 10, relational: 0 }, unassignedHours: 0, totalHours: 10 },
      { week: '2026-32', hours: { income: 0, asset: 0, recovery: 10, relational: 2 }, unassignedHours: 0, totalHours: 12 },
    ];
    expect(detectEmptyBucketStreaks(history)).toEqual({
      income: 2,      // last two weeks were 0
      asset: 3,       // all three weeks were 0
      recovery: 0,    // most recent week is non-zero
      relational: 0,  // most recent week (2) is non-zero
    });
  });

  it('returns all zeros for empty history', () => {
    expect(detectEmptyBucketStreaks([])).toEqual({ income: 0, asset: 0, recovery: 0, relational: 0 });
  });
});

describe('calculateBucketBalanceScores', () => {
  it('scores buckets out of 10 relative to a 42h (25%) weekly target', () => {
    const stats = {
      bucketHours: { income: 42, asset: 21, recovery: 0, relational: 84 },
    } as any;
    expect(calculateBucketBalanceScores(stats)).toEqual({
      income: 10,   // exactly at target
      asset: 5,     // half target
      recovery: 0,
      relational: 10, // capped at 10 even though double target
    });
  });
});
