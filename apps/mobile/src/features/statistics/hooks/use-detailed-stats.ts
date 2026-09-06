import { useQuery } from '@tanstack/react-query';
import { supabase } from '@llb/api';
import {
  LIFE_BUCKETS,
  WeekUtils,
  analyzeAllGoals,
  analyzeAllHabits,
  analyzeAllWeeks,
  computeLifeTrajectory,
  calculateWeekBucketHours,
  detectEmptyBucketStreaks,
  calculateBucketBalanceScores,
  type Goal,
  type Habit,
  type CustomTask,
  type GridState,
  type LifeBucket,
  type GoalAnalysis,
  type HabitAnalysis,
  type WeekExecution,
  type LifeTrajectoryScore,
  type BucketStats,
  type WeeklyBucketHistory,
} from '@llb/core';
import { computeMilestoneProgress, type MilestoneProgress } from '@/lib/milestone-celebration';

export interface DetailedAnalytics {
  trajectory: LifeTrajectoryScore;

  goals: GoalAnalysis[];
  goalAverage: number;
  bestGoal: GoalAnalysis | null;

  habits: HabitAnalysis[];
  habitAverage: number;
  bestHabit: HabitAnalysis | null;

  weeks: WeekExecution[];
  weekAverage: number;
  bestWeek: WeekExecution | null;

  bucketStats: BucketStats;
  bucketHistory: WeeklyBucketHistory[];
  emptyBucketStreaks: Record<LifeBucket, number>;
  bucketBalanceScores: Record<LifeBucket, number>;
  rawGoals: Goal[];
  rawHabits: Habit[];
  rawCustomTasks: CustomTask[];

  milestoneProgress: MilestoneProgress;
  completedMap: Record<string, string[]>;
}

/** Port of apps/web/src/features/statistics/hooks/use-detailed-stats.ts —
 * all the heavy lifting is @llb/core engines (analyzeAllGoals/Habits/Weeks,
 * calculateWeekBucketHours, computeLifeTrajectory) already ported in an
 * earlier phase; this hook itself only changed its supabase import source. */
const fetchDetailedAnalytics = async (): Promise<DetailedAnalytics> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [goalsRes, habitsRes, customTasksRes, completedRes, weekPlansRes, profileRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('custom_tasks').select('*').eq('user_id', userId),
    supabase.from('completed_tasks').select('dayStr, taskIds').eq('user_id', userId),
    supabase.from('week_plans').select('week, state').eq('user_id', userId),
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const profile = profileRes.data as any;
  const userSleepStart = profile?.sleep_start || session?.user?.user_metadata?.sleepStart || '22:00';
  const userSleepDuration = Number(profile?.sleep_duration || session?.user?.user_metadata?.sleepDuration) || 8;
  const userPlanDay = profile?.plan_day || 'Sunday';
  let userPlanHours = 1;
  const startTime = profile?.plan_start_time;
  const endTime = profile?.plan_end_time;
  if (startTime && endTime) {
    const [psH, psM] = String(startTime).split(':').map(Number);
    const [peH, peM] = String(endTime).split(':').map(Number);
    if (!isNaN(psH) && !isNaN(peH)) {
      userPlanHours = Math.max(0.5, (peH * 60 + peM - (psH * 60 + psM)) / 60);
    }
  }

  const goals: Goal[] = (goalsRes.data ?? []) as unknown as Goal[];
  const habits: Habit[] = (habitsRes.data ?? []) as Habit[];
  const customTasks: CustomTask[] = (customTasksRes.data ?? []) as CustomTask[];

  const completedMap: Record<string, string[]> = {};
  for (const row of completedRes.data ?? []) {
    completedMap[row.dayStr] = (row.taskIds as string[]) ?? [];
  }

  const weekPlans: { week: string; state: GridState }[] = (weekPlansRes.data ?? []).map((r: any) => ({
    week: r.week,
    state: r.state ?? {},
  }));

  const gridCustomTasksMap = new Map<string, CustomTask>();
  weekPlans.forEach((wp) => {
    if (wp.state) {
      Object.values(wp.state).forEach((val: any) => {
        if (val && typeof val === 'object' && val.name) {
          const trimmed = val.name.trim().toLowerCase();
          const explicitBucket = val.bucket;
          if (explicitBucket && LIFE_BUCKETS.includes(explicitBucket as LifeBucket)) {
            gridCustomTasksMap.set(trimmed, {
              id: val.name,
              name: val.name,
              bucket: explicitBucket as LifeBucket,
              type: 'custom',
            } as any);
          }
        }
      });
      ((wp.state as any).reminders || []).forEach((r: any) => {
        if (r && r.name && r.bucket) {
          gridCustomTasksMap.set(r.name.trim().toLowerCase(), {
            id: r.name,
            name: r.name,
            bucket: r.bucket,
            type: 'custom',
          } as any);
        }
      });
    }
  });

  const mergedCustomTasks = [...customTasks];
  gridCustomTasksMap.forEach((task) => {
    if (!mergedCustomTasks.some((t) => t.name && t.name.trim().toLowerCase() === task.name.trim().toLowerCase())) {
      mergedCustomTasks.push(task);
    }
  });

  const currentWeek = WeekUtils.getCurrentWeek();
  const currentWeekNorm = WeekUtils.normalizeWeek(currentWeek);
  const currentWeekPlan = weekPlans.find(
    (wp) =>
      wp.week === currentWeek ||
      wp.week === WeekUtils.formatWeekDisplay(currentWeek) ||
      WeekUtils.normalizeWeek(wp.week) === currentWeekNorm
  );

  const { analyses: goalAnalyses, average: goalAverage, best: bestGoal } = analyzeAllGoals(
    goals,
    currentWeek,
    currentWeekPlan?.state,
    completedMap
  );
  const { analyses: habitAnalyses, average: habitAverage, best: bestHabit } = analyzeAllHabits(habits, completedMap);
  const { weeks, average: weekAverage, best: bestWeek } = analyzeAllWeeks(weekPlans, completedMap);

  const currentGridState = currentWeekPlan?.state || {};
  const bucketStats = calculateWeekBucketHours(
    currentGridState,
    goals,
    habits,
    mergedCustomTasks,
    userSleepStart,
    userSleepDuration,
    userPlanDay,
    userPlanHours
  );

  const trailingWeeksChronological: string[] = [];
  for (let i = 7; i >= 0; i--) {
    trailingWeeksChronological.push(WeekUtils.addWeeks(currentWeek, -i));
  }

  const bucketHistory: WeeklyBucketHistory[] = trailingWeeksChronological.map((wCode) => {
    // Hoisted out of the find() predicate below — inside it, this Intl-backed
    // format call re-ran for every element scanned, on every one of the 8
    // trailing weeks.
    const wDisplay = WeekUtils.formatWeekDisplay(wCode);
    const wp = weekPlans.find(
      (p) => p.week === wCode || p.week === wDisplay || WeekUtils.getWeekFromDate(p.week) === wCode
    );

    const stats = calculateWeekBucketHours(
      wp?.state || {},
      goals,
      habits,
      mergedCustomTasks,
      userSleepStart,
      userSleepDuration,
      userPlanDay,
      userPlanHours
    );

    return {
      week: WeekUtils.formatWeekDisplay(wCode),
      hours: stats.bucketHours,
      unassignedHours: stats.unassignedHours,
      totalHours: stats.totalAllocatedHours,
    };
  });

  const emptyBucketStreaks = detectEmptyBucketStreaks(bucketHistory);
  const bucketBalanceScores = calculateBucketBalanceScores(bucketStats);

  const avgBalanceScore = (Object.values(bucketBalanceScores).reduce((a, b) => a + b, 0) / 4) * 10;
  const trajectory = computeLifeTrajectory(goalAverage, habitAverage, weekAverage, avgBalanceScore);
  const milestoneProgress = computeMilestoneProgress(completedMap);

  return {
    trajectory,
    goals: goalAnalyses,
    goalAverage,
    bestGoal,
    habits: habitAnalyses,
    habitAverage,
    bestHabit,
    weeks,
    weekAverage,
    bestWeek,
    bucketStats,
    bucketHistory,
    emptyBucketStreaks,
    bucketBalanceScores,
    rawGoals: goals,
    rawHabits: habits,
    rawCustomTasks: customTasks,
    milestoneProgress,
    completedMap,
  };
};

export const useDetailedAnalytics = (enabled: boolean) =>
  useQuery({
    queryKey: ['detailed_analytics'],
    queryFn: fetchDetailedAnalytics,
    enabled,
    // Deliberately longer than web's 5s. This query pulls six unbounded
    // tables and then does all the aggregate math synchronously on the JS
    // thread; at 5s it re-ran on essentially every visit to the tab, which
    // on a phone means both a stall and a chunk of mobile data each time.
    staleTime: 60 * 1000,
  });
