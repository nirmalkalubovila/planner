import type { Goal, Habit, CustomTask } from '../types/domain';
import type { GridState, PlanSlot, ReminderItem } from '../types/planner';
import { LIFE_BUCKETS, LifeBucket } from '../types/time';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const TOTAL_WEEK_HOURS = 168; // 7 days x 24 hours

export interface BucketStats {
  bucketHours: Record<LifeBucket, number>;
  unassignedHours: number;
  unassignedTaskNames: string[];
  totalAllocatedHours: number;
  totalWeekHours: number;
  userSleepHours: number;
  userPlanHours: number;
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
 * Resolves the Life Bucket of a plan slot by checking:
 * 1. Direct slot.bucket on the grid slot itself (TRUST THIS FIRST)
 * 2. Sleep and Weekly Planning defaults to Recovery
 * 3. Goal matching by ID, full name/title, token/word overlap, or partial substring
 * 4. Habit slot matching
 * 5. Custom task slot matching
 */
export function resolveSlotBucket(
  slot: PlanSlot,
  goals: Goal[],
  habits: Habit[],
  customTasks: CustomTask[],
  _dayIdx?: number,
  _slotIdx?: number
): LifeBucket | null {
  if (!slot) return null;

  const trimmed = slot.name ? slot.name.trim().toLowerCase() : '';

  // 0. Direct bucket specified on grid slot itself (ALWAYS TRUST THIS FIRST!)
  if (slot.bucket && LIFE_BUCKETS.includes(slot.bucket as LifeBucket)) {
    return slot.bucket as LifeBucket;
  }

  // 1. If slot is a custom task without an explicit bucket:
  if (slot.type === 'custom') {
    // Only check customTasks table by exact name match
    if (trimmed) {
      const task = customTasks.find((t) => {
        const tName = (t.name || '').trim().toLowerCase();
        return tName && tName === trimmed;
      });
      if (task?.bucket && LIFE_BUCKETS.includes(task.bucket as LifeBucket)) {
        return task.bucket as LifeBucket;
      }
    }
    // Otherwise it is explicitly unassigned / unaligned
    return null;
  }

  // 2. Sleep and Weekly Planning slots default to Recovery
  if (slot.type === 'sleep' || slot.type === 'plan' || slot.name === 'Sleep' || slot.name === 'Weekly Planning') {
    return 'recovery';
  }

  // 3. Goal slot matching by goalId (strict & string comparison)
  if (slot.type === 'goal' || slot.goalId) {
    if (slot.goalId) {
      const goal = goals.find((g) => g.id === slot.goalId || String(g.id) === String(slot.goalId));
      if (goal?.bucket && LIFE_BUCKETS.includes(goal.bucket as LifeBucket)) {
        return goal.bucket as LifeBucket;
      }
    }
    if (trimmed) {
      const goal = goals.find((g) => {
        const gName = (g.name || '').trim().toLowerCase();
        const gTitle = (g.title || '').trim().toLowerCase();
        return gName === trimmed || gTitle === trimmed;
      });
      if (goal?.bucket && LIFE_BUCKETS.includes(goal.bucket as LifeBucket)) {
        return goal.bucket as LifeBucket;
      }
    }
    return null;
  }

  // 4. Habit slot matching (exact habit name match)
  if (slot.type === 'habit' && trimmed) {
    const habit = habits.find((h) => {
      const hName = (h.name || '').trim().toLowerCase();
      return hName === trimmed;
    });
    if (habit?.bucket && LIFE_BUCKETS.includes(habit.bucket as LifeBucket)) {
      return habit.bucket as LifeBucket;
    }
    return null;
  }

  // If no explicit bucket or matching goal/habit/custom task with bucket, return null (unassigned)
  return null;
}

/**
 * Calculates bucket hours for a single week plan grid state (48 slots x 7 days)
 * accounting for explicit grid slots, habits scheduled via habit time slots, recurring custom tasks,
 * reminders, AND user preference sleep time + Sunday weekly planning → Recovery.
 */
export function calculateWeekBucketHours(
  gridState: GridState,
  goals: Goal[],
  habits: Habit[],
  customTasks: CustomTask[],
  userSleepStart: string = "22:00",
  userSleepDuration: number = 8,
  userPlanDay: string = "Sunday",
  userPlanHours: number = 1
): BucketStats {
  const bucketHours: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  // If no gridState or empty object, return 0s (no phantom data)
  if (!gridState || Object.keys(gridState).length === 0) {
    return {
      bucketHours,
      unassignedHours: 0,
      unassignedTaskNames: [],
      totalAllocatedHours: 0,
      totalWeekHours: TOTAL_WEEK_HOURS,
      userSleepHours: 0,
      userPlanHours: 0,
      bucketPercentages: { income: 0, asset: 0, recovery: 0, relational: 0 },
      strongestBucket: null,
      weakestBucket: null,
    };
  }

  // Check if grid has at least one real planned cell or reminder
  const hasPlannedContent = Object.keys(gridState).some((k) => {
    const slot = gridState[k];
    return slot && typeof slot === 'object' && 'name' in slot && Boolean(slot.name);
  }) || (Array.isArray(gridState.reminders) && gridState.reminders.length > 0);

  if (!hasPlannedContent) {
    return {
      bucketHours,
      unassignedHours: 0,
      unassignedTaskNames: [],
      totalAllocatedHours: 0,
      totalWeekHours: TOTAL_WEEK_HOURS,
      userSleepHours: 0,
      userPlanHours: 0,
      bucketPercentages: { income: 0, asset: 0, recovery: 0, relational: 0 },
      strongestBucket: null,
      weakestBucket: null,
    };
  }

  let unassignedSlots = 0;
  let totalSlots = 0;
  const unassignedTaskNames: string[] = [];

  // Parse user sleep start slot and duration slots
  const [sH, sM] = userSleepStart.split(':').map(Number);
  const startSleepSlot = sH * 2 + (sM >= 30 ? 1 : 0);
  const sleepSlotCount = Math.round(userSleepDuration * 2);

  const isSleepSlotFunc = (slotIdx: number) => {
    let curr = startSleepSlot;
    for (let c = 0; c < sleepSlotCount; c++) {
      if (curr % 48 === slotIdx) return true;
      curr = (curr + 1) % 48;
    }
    return false;
  };

  // Build Habit Slot Map for recurring habit time windows
  const habitSlotBucketMap = new Map<string, LifeBucket>();
  (habits || []).forEach((h) => {
    if (!h.startTime || !h.endTime || !h.bucket) return;
    if (!LIFE_BUCKETS.includes(h.bucket as LifeBucket)) return;

    const [hsH, hsM] = h.startTime.split(':').map(Number);
    const [heH, heM] = h.endTime.split(':').map(Number);
    if (isNaN(hsH) || isNaN(heH)) return;
    const startSlot = hsH * 2 + (hsM >= 30 ? 1 : 0);
    const endSlot = heH * 2 + (heM >= 30 ? 1 : 0);

    for (let d = 0; d < 7; d++) {
      if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(DAYS_OF_WEEK[d])) continue;
      for (let s = startSlot; s < endSlot; s++) {
        habitSlotBucketMap.set(`${d}-${s}`, h.bucket as LifeBucket);
      }
    }
  });

  // Build Custom Task Slot Map for recurring custom tasks time windows
  const customTaskSlotBucketMap = new Map<string, LifeBucket>();
  (customTasks || []).forEach((t) => {
    if (!t.startTime || !t.endTime || !t.bucket) return;
    if (!LIFE_BUCKETS.includes(t.bucket as LifeBucket)) return;

    const [tsH, tsM] = t.startTime.split(':').map(Number);
    const [teH, teM] = t.endTime.split(':').map(Number);
    if (isNaN(tsH) || isNaN(teH)) return;
    const startSlot = tsH * 2 + (tsM >= 30 ? 1 : 0);
    const endSlot = teH * 2 + (teM >= 30 ? 1 : 0);

    for (let d = 0; d < 7; d++) {
      if (t.daysOfWeek && t.daysOfWeek.length > 0 && !t.daysOfWeek.includes(DAYS_OF_WEEK[d])) continue;
      for (let s = startSlot; s < endSlot; s++) {
        customTaskSlotBucketMap.set(`${d}-${s}`, t.bucket as LifeBucket);
      }
    }
  });

  const planDayIdx = DAYS_OF_WEEK.indexOf(userPlanDay as any) !== -1 ? DAYS_OF_WEEK.indexOf(userPlanDay as any) : 6;
  const planSlotCount = Math.round(userPlanHours * 2);

  // Evaluate 7 days x 48 slots grid (max 336 slots = 168h)
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 48; s++) {
      const key = `${d}-${s}`;
      const slot = gridState[key];

      const isSleep = isSleepSlotFunc(s);
      const isPlan = (d === planDayIdx && s >= (44 - planSlotCount) && s < 44);

      if (slot && typeof slot === 'object' && 'name' in slot) {
        totalSlots++;
        let bucket = resolveSlotBucket(slot, goals, habits, customTasks, d, s);
        if (!bucket && habitSlotBucketMap.has(key)) {
          bucket = habitSlotBucketMap.get(key)!;
        }
        if (!bucket && customTaskSlotBucketMap.has(key)) {
          bucket = customTaskSlotBucketMap.get(key)!;
        }

        if (bucket && LIFE_BUCKETS.includes(bucket)) {
          bucketHours[bucket] += 0.5; // 30 min per slot
        } else {
          unassignedSlots++;
          const name = slot.name?.trim();
          if (name && !unassignedTaskNames.includes(name)) {
            unassignedTaskNames.push(name);
          }
        }
      } else if (habitSlotBucketMap.has(key)) {
        totalSlots++;
        const bucket = habitSlotBucketMap.get(key)!;
        bucketHours[bucket] += 0.5; // 30 min per habit slot
      } else if (customTaskSlotBucketMap.has(key)) {
        totalSlots++;
        const bucket = customTaskSlotBucketMap.get(key)!;
        bucketHours[bucket] += 0.5; // 30 min per custom task slot
      } else if (isSleep || isPlan) {
        // User preference sleep and planning → Recovery
        totalSlots++;
        bucketHours.recovery += 0.5;
      }
    }
  }

  // Include reminders on gridState
  (gridState.reminders || []).forEach((r: ReminderItem) => {
    if (r && r.name) {
      totalSlots += 0.5;
      const bucket = r.bucket || resolveSlotBucket({ type: 'custom', name: r.name, description: r.description }, goals, habits, customTasks);
      if (bucket && LIFE_BUCKETS.includes(bucket as LifeBucket)) {
        bucketHours[bucket as LifeBucket] += 0.25;
      } else {
        unassignedSlots += 0.5;
        const name = r.name.trim();
        if (name && !unassignedTaskNames.includes(name)) {
          unassignedTaskNames.push(name);
        }
      }
    }
  });

  // Calculate total allocated hours across the 4 Life Buckets
  const totalAllocatedHours = Math.min(
    TOTAL_WEEK_HOURS,
    Number((bucketHours.income + bucketHours.asset + bucketHours.recovery + bucketHours.relational).toFixed(2))
  );
  const unassignedHours = Number((unassignedSlots * 0.5).toFixed(2));
  const userSleepWeeklyHours = userSleepDuration * 7;

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

  LIFE_BUCKETS.forEach((bucket) => {
    const hours = Math.min(TOTAL_WEEK_HOURS, bucketHours[bucket]);
    bucketHours[bucket] = hours;
    // Percentage calculated against full 168h total week (capped at 100%)
    bucketPercentages[bucket] = Math.min(100, Math.round((hours / TOTAL_WEEK_HOURS) * 100));

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
    unassignedTaskNames,
    totalAllocatedHours,
    totalWeekHours: TOTAL_WEEK_HOURS,
    userSleepHours: userSleepWeeklyHours,
    userPlanHours: userPlanHours,
    bucketPercentages,
    strongestBucket,
    weakestBucket,
  };
}

export function detectEmptyBucketStreaks(
  weeklyHistory: WeeklyBucketHistory[]
): Record<LifeBucket, number> {
  const streaks: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  LIFE_BUCKETS.forEach((bucket) => {
    let streak = 0;
    for (let i = weeklyHistory.length - 1; i >= 0; i--) {
      if ((weeklyHistory[i]?.hours?.[bucket] || 0) === 0) {
        streak++;
      } else {
        break;
      }
    }
    streaks[bucket] = streak;
  });

  return streaks;
}

export function calculateBucketBalanceScores(
  bucketStats: BucketStats
): Record<LifeBucket, number> {
  const scores: Record<LifeBucket, number> = {
    income: 0,
    asset: 0,
    recovery: 0,
    relational: 0,
  };

  LIFE_BUCKETS.forEach((bucket) => {
    const hours = bucketStats.bucketHours[bucket] || 0;
    // Score out of 10 based on hours relative to 168h week target
    scores[bucket] = Math.min(10, Math.round((hours / (TOTAL_WEEK_HOURS * 0.25)) * 10));
  });

  return scores;
}
