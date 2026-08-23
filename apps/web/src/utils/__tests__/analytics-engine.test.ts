import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateGoalProgress,
  analyzeGoal,
  analyzeAllGoals,
  analyzeHabit,
  analyzeAllHabits,
  getWeekKeyFromDisplay,
  analyzeWeekExecution,
  analyzeAllWeeks,
  computeLifeTrajectory,
} from '@/utils/analytics-engine';
import type { Goal, Habit } from '@/types/global-types';
import type { GridState, PlanSlot } from '@/types/planner';

// Golden-value tests for the analytics engine. Several functions here read
// the system clock internally (progress-over-time, velocity, habit streak
// windows), so every describe block below freezes time to a fixed instant
// first. Expected values were captured from the actual implementation.

const FIXED_NOW = new Date(2026, 7, 23, 12, 0, 0); // 2026-08-23 (Sunday)

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('calculateGoalProgress', () => {
  const goal: Goal = {
    id: 'g1', title: 'Year Goal', name: 'Year Goal', purpose: '',
    startDate: '2026-01-01', endDate: '2026-12-31', goalType: 'Year',
  };

  it('returns 0 when the goal has no start/end dates', () => {
    expect(calculateGoalProgress({ ...goal, startDate: '', endDate: '' } as Goal)).toBe(0);
  });

  it('computes elapsed-time progress with no week plan context', () => {
    // 2026-01-01 -> 2026-12-31, "now" pinned to 2026-08-23 noon.
    const progress = calculateGoalProgress(goal);
    expect(progress).toBeCloseTo(64.42, 2);
  });

  it('clamps progress to 100 once past the end date', () => {
    const finished: Goal = { ...goal, startDate: '2025-01-01', endDate: '2025-06-01' };
    expect(calculateGoalProgress(finished)).toBe(100);
  });
});

describe('analyzeGoal / analyzeAllGoals', () => {
  const goalWithMilestones: Goal = {
    id: 'g1', title: 'Launch v2', name: 'Launch v2', purpose: '',
    startDate: '2026-01-01', endDate: '2026-12-31', goalType: 'Year',
    milestones: [
      { id: 'm1', title: 'Design', targetDate: '2026-03-01', completed: true },
      { id: 'm2', title: 'Build', targetDate: '2026-06-01', completed: true },
      { id: 'm3', title: 'Ship', targetDate: '2026-12-01', completed: false },
    ],
  };

  it('produces a rounded analysis snapshot for a goal with milestones', () => {
    const analysis = analyzeGoal(goalWithMilestones);
    expect(analysis).toMatchObject({
      id: 'g1',
      name: 'Launch v2',
      totalMilestones: 3,
      goalType: 'Year',
    });
    expect(analysis.progress).toBeGreaterThan(0);
    expect(analysis.progress).toBeLessThanOrEqual(100);
    expect(analysis.completedMilestones).toBeGreaterThanOrEqual(2);
  });

  it('averages progress across multiple goals and picks the best one', () => {
    const shortGoal: Goal = {
      id: 'g2', title: 'Quick Win', name: 'Quick Win', purpose: '',
      startDate: '2025-01-01', endDate: '2025-02-01', goalType: 'Month',
    };
    const { analyses, average, best } = analyzeAllGoals([goalWithMilestones, shortGoal]);
    expect(analyses).toHaveLength(2);
    expect(best?.id).toBe('g2'); // finished goals clamp to 100% progress
    expect(average).toBe(Math.round((analyses[0].progress + analyses[1].progress) / 2));
  });

  it('returns a null best and 0 average for an empty goal list', () => {
    expect(analyzeAllGoals([])).toEqual({ analyses: [], average: 0, best: null });
  });
});

describe('analyzeHabit / analyzeAllHabits', () => {
  const habit: Habit = {
    id: 'h1', name: 'Morning Run', startTime: '06:00', endTime: '07:00',
    daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
  };

  it('computes consistency as 0 with an empty completion map', () => {
    const analysis = analyzeHabit(habit, {});
    expect(analysis).toEqual({
      id: 'h1', name: 'Morning Run', consistency: 0, longestStreak: 0,
      activeDays: 0, totalExpectedDays: expect.any(Number),
    });
    expect(analysis.totalExpectedDays).toBeGreaterThan(0);
  });

  it('credits a completed day that matches the habit task-id convention', () => {
    // 2026-08-23 is a Sunday, not one of the habit's active days, so walk
    // back to the most recent Friday (2026-08-21) within the 30-day window.
    const dayStr = '2026-34-5'; // Friday of week 34
    const completedMap = { [dayStr]: ['habit-Morning Run-12'] };
    const analysis = analyzeHabit(habit, completedMap);
    expect(analysis.activeDays).toBe(1);
    expect(analysis.consistency).toBeGreaterThan(0);
  });

  it('averages consistency across habits and picks the best', () => {
    const { analyses, average, best } = analyzeAllHabits([habit], {});
    expect(analyses).toHaveLength(1);
    expect(average).toBe(0);
    expect(best?.id).toBe('h1');
  });
});

describe('getWeekKeyFromDisplay', () => {
  it('passes through and normalizes an already-canonical week code', () => {
    expect(getWeekKeyFromDisplay('2026-05')).toBe('2026-05');
  });

  it('derives the week code from a display range by its end date', () => {
    expect(getWeekKeyFromDisplay('Aug 24 - Aug 30, 2026')).toBe('2026-35');
  });

  it('returns empty string for empty input', () => {
    expect(getWeekKeyFromDisplay('')).toBe('');
  });
});

describe('analyzeWeekExecution / analyzeAllWeeks', () => {
  it('counts distinct planned tasks and completion efficiency for a week', () => {
    const state: GridState = {
      '0-0': { type: 'goal', name: 'Write' } as PlanSlot,
      '0-1': { type: 'goal', name: 'Write' } as PlanSlot, // same task, contiguous -> 1 planned task
      '1-5': { type: 'habit', name: 'Run' } as PlanSlot,
    } as GridState;
    const completedMap = { '2026-34-1': ['goal-Write-0'] };

    const result = analyzeWeekExecution('2026-34', state, completedMap);
    expect(result.planned).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.efficiency).toBe(50);
  });

  it('caps efficiency at 100 even if completed exceeds planned', () => {
    const state: GridState = { '0-0': { type: 'goal', name: 'Write' } as PlanSlot } as GridState;
    const completedMap = { '2026-34-1': ['a', 'b', 'c'] };
    const result = analyzeWeekExecution('2026-34', state, completedMap);
    expect(result.efficiency).toBe(100);
  });

  it('averages efficiency across weeks that have planned tasks', () => {
    const weekPlans = [
      { week: '2026-34', state: { '0-0': { type: 'goal', name: 'A' } as PlanSlot } as GridState },
      { week: '2026-35', state: {} as GridState }, // no planned tasks -> excluded from average
    ];
    const { weeks, average, best } = analyzeAllWeeks(weekPlans, {});
    expect(weeks).toHaveLength(2);
    expect(average).toBe(0); // the only week with planned tasks had 0% completion
    expect(best?.weekKey).toBe('2026-34');
  });
});

describe('computeLifeTrajectory', () => {
  it('weights the four dimensions at 30/30/25/15 and rounds the total', () => {
    const score = computeLifeTrajectory(100, 100, 100, 100);
    expect(score).toEqual({ total: 100, goalScore: 30, habitScore: 30, executionScore: 25, balanceScore: 15 });
  });

  it('defaults balance to 50 when not provided', () => {
    const score = computeLifeTrajectory(0, 0, 0);
    expect(score.balanceScore).toBe(8); // round(50 * 0.15)
    expect(score.total).toBe(8);
  });

  it('clamps each input at 100 before weighting', () => {
    const score = computeLifeTrajectory(200, 200, 200, 200);
    expect(score).toEqual({ total: 100, goalScore: 30, habitScore: 30, executionScore: 25, balanceScore: 15 });
  });
});
