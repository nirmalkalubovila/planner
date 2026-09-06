import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildWidgetSnapshot } from '../widget-snapshot';
import type { Habit } from '../../types/domain';

// Wednesday of an arbitrary week — dayIdx 2 (Monday=0).
const FIXED_NOW = new Date(2026, 7, 26, 9, 0, 0); // 2026-08-26

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

const habits: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Run',
    startTime: '06:00',
    endTime: '07:00',
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
];

describe('buildWidgetSnapshot', () => {
  it('reports the next task and remaining count for today', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits,
      completedMap: {},
      now: FIXED_NOW,
    });

    expect(snapshot.today.remainingTaskList).toEqual([{ name: 'Morning Run', time: '06:00' }]);
    expect(snapshot.today.remaining).toBe(1);
    expect(snapshot.today.progress).toBe(0);
    expect(snapshot.today.isComplete).toBe(false);
  });

  it('marks today complete once its only task is completed', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits,
      completedMap: { '2026-35-3': ['habit-Morning Run-12'] },
      now: FIXED_NOW,
    });

    expect(snapshot.today.remaining).toBe(0);
    expect(snapshot.today.progress).toBe(100);
    expect(snapshot.today.isComplete).toBe(true);
  });

  it('builds a Monday-first week heatmap scoped to days elapsed so far', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits,
      completedMap: {
        '2026-35-1': ['x'], // Monday
        '2026-35-3': ['x'], // Wednesday (today)
      },
      now: FIXED_NOW,
    });

    expect(snapshot.week.heatmap).toEqual([true, false, true, false, false, false, false]);
    // 2 of 3 elapsed days (Mon, Tue, Wed) completed.
    expect(snapshot.week.progress).toBe(67);
  });

  it('reports zero-length streaks with no completion history', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits: [],
      completedMap: {},
      now: FIXED_NOW,
    });

    expect(snapshot.month.currentStreak).toBe(0);
    expect(snapshot.month.longestStreak).toBe(0);
    expect(snapshot.month.heatmap).toHaveLength(31);
  });

  it('aligns the month grid to weekday columns', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits: [],
      completedMap: {},
      now: FIXED_NOW,
    });

    // 2026-08-01 is a Saturday, which is index 5 Monday-first. Without this
    // offset the widget would draw the 1st in the Monday column.
    expect(snapshot.month.firstDayOffset).toBe(5);
    expect(snapshot.month.monthLabel).toBe('August');
    expect(snapshot.month.daysInMonth).toBe(31);
    // FIXED_NOW is the 26th, so index 25.
    expect(snapshot.month.todayIndex).toBe(25);
  });

  it('carries the counts the widgets label themselves with', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits,
      completedMap: {
        '2026-35-1': ['a', 'b'],
        '2026-35-3': ['c'],
      },
      now: FIXED_NOW,
    });

    expect(snapshot.today.dateLabel).toBe('Wed, Aug 26');
    expect(snapshot.today.total).toBe(1);
    expect(snapshot.today.completed).toBe(0);

    // Monday + Wednesday have completions; Wednesday is today, so three days
    // have elapsed this week.
    expect(snapshot.week.daysElapsed).toBe(3);
    expect(snapshot.week.completedDays).toBe(2);
    expect(snapshot.week.tasksCompleted).toBe(3);
    expect(snapshot.month.activeDays).toBe(2);
  });

  it('carries a per-day task count alongside the week heatmap', () => {
    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits,
      completedMap: {
        '2026-35-1': ['a', 'b', 'c'], // Monday: 3 tasks
        '2026-35-3': ['d'], // Wednesday (today): 1 task
      },
      now: FIXED_NOW,
    });

    expect(snapshot.week.dailyTaskCounts).toEqual([3, 0, 1, 0, 0, 0, 0]);
  });

  it('caps the remaining-task list rather than growing it unbounded', () => {
    const manyHabits: Habit[] = Array.from({ length: 12 }, (_, i) => ({
      id: `h${i}`,
      name: `Habit ${i}`,
      startTime: `${String(i).padStart(2, '0')}:00`,
      endTime: `${String(i).padStart(2, '0')}:30`,
      daysOfWeek: ['Wednesday'],
    }));

    const snapshot = buildWidgetSnapshot({
      weekPlan: undefined,
      habits: manyHabits,
      completedMap: {},
      now: FIXED_NOW,
    });

    expect(snapshot.today.remaining).toBe(12);
    expect(snapshot.today.remainingTaskList).toHaveLength(8);
  });
});
