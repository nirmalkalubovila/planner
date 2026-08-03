import type { Goal, Habit, CustomTask } from '@/types/global-types';
import type { GridState, PlanSlot } from '@/types/planner';
import { LIFE_BUCKETS, LifeBucket } from '@/types/time';

export interface BucketStats {
  bucketHours: Record<LifeBucket, number>;
  unassignedHours: number;
  totalAllocatedHours: number;
  bucketPercentages: Record<LifeBucket, number>;
  weakestBucket: LifeBucket | null;
  strongestBucket: LifeBucket | null;
}

export interface WeeklyBucketHistory {
  week: string;
  hours: Record<LifeBucket, number>;
  unassignedHours: number;
  totalHours: number;
}

/**
 * Resolves the Life Bucket of a plan slot by matching it against
 * goals, habits, or custom tasks.
 */
export function resolveSlotBucket(
  slot: PlanSlot,
  goals: Goal[],
  habits: Habit[],
  customTasks: CustomTask[]
): LifeBucket | null {
  if (!slot) return null;

  if (slot.type === 'goal' && slot.goalId) {
    const goal = goals.find((g) => g.id === slot.goalId);
    if (goal?.bucket) return goal.bucket;
  }

  if (slot.type === 'goal' && slot.name) {
    const goal = goals.find((g) => g.name === slot.name || g.title === slot.name);
    if (goal?.bucket) return goal.bucket;
  }

  if (slot.type === 'habit' && slot.name) {
    const habit = habits.find((h) => h.name === slot.name);
    if (habit?.bucket) return habit.bucket;
  }

  if (slot.type === 'custom' && slot.name) {
    const task = customTasks.find((t) => t.name === slot.name);
    if (task?.bucket) return task.bucket;
  }

  return null;
}

/**
 * Calculates bucket hours for a single week plan grid state (48 slots x 7 days)
 */
export function calculateWeekBucketHours(
  gridState: GridState,
  goals: Goal[],
  habits: Habit[],
  customTasks: CustomTask[]
): BucketStats {
  const bucketHours: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  let unassignedSlots = 0;
  let totalSlots = 0;

  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 48; s++) {
      const slot = gridState[`${d}-${s}`];
      if (slot) {
        totalSlots++;
        const bucket = resolveSlotBucket(slot, goals, habits, customTasks);
        if (bucket && LIFE_BUCKETS.includes(bucket)) {
          bucketHours[bucket] += 0.5; // 30 min per slot
        } else {
          unassignedSlots++;
        }
      }
    }
  }

  const totalAllocatedHours = totalSlots * 0.5;
  const unassignedHours = unassignedSlots * 0.5;

  const bucketPercentages: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  let maxHours = -1;
  let minHours = Infinity;
  let strongestBucket: LifeBucket | null = null;
  let weakestBucket: LifeBucket | null = null;

  const assignedTotalHours = LIFE_BUCKETS.reduce((acc, b) => acc + bucketHours[b], 0);

  LIFE_BUCKETS.forEach((bucket) => {
    const hours = bucketHours[bucket];
    bucketPercentages[bucket] = assignedTotalHours > 0
      ? Math.round((hours / assignedTotalHours) * 100)
      : 0;

    if (hours > maxHours && hours > 0) {
      maxHours = hours;
      strongestBucket = bucket;
    }
    if (hours < minHours) {
      minHours = hours;
      weakestBucket = bucket;
    }
  });

  return {
    bucketHours,
    unassignedHours,
    totalAllocatedHours,
    bucketPercentages,
    weakestBucket: assignedTotalHours > 0 ? weakestBucket : null,
    strongestBucket: assignedTotalHours > 0 ? strongestBucket : null,
  };
}

/**
 * Detects consecutive weeks where a bucket has zero hours.
 */
export function detectEmptyBucketStreaks(
  history: WeeklyBucketHistory[]
): Record<LifeBucket, number> {
  const streaks: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  // Sort history newest first
  const sorted = [...history].sort((a, b) => (a.week > b.week ? -1 : 1));

  LIFE_BUCKETS.forEach((bucket) => {
    let count = 0;
    for (const item of sorted) {
      if ((item.hours[bucket] || 0) === 0) {
        count++;
      } else {
        break;
      }
    }
    streaks[bucket] = count;
  });

  return streaks;
}

/**
 * Computes a balance score from 1 to 10 for each bucket based on average weekly hours
 */
export function calculateBucketBalanceScores(
  history: WeeklyBucketHistory[]
): Record<LifeBucket, number> {
  const scores: Record<LifeBucket, number> = {
    income: 1,
    asset: 1,
    recovery: 1,
    relational: 1,
  };

  if (history.length === 0) return scores;

  LIFE_BUCKETS.forEach((bucket) => {
    const totalHours = history.reduce((acc, h) => acc + (h.hours[bucket] || 0), 0);
    const avgWeeklyHours = totalHours / history.length;

    // Scaling score: 0h = 1, 1-3h = 4, 4-7h = 7, 8h+ = 10
    if (avgWeeklyHours === 0) scores[bucket] = 1;
    else if (avgWeeklyHours < 3) scores[bucket] = Math.round(1 + avgWeeklyHours * 1.5);
    else if (avgWeeklyHours < 8) scores[bucket] = Math.round(5 + (avgWeeklyHours - 3) * 0.8);
    else scores[bucket] = 10;
  });

  return scores;
}
