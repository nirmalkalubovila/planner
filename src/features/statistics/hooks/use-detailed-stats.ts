import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Goal, Habit, CustomTask } from '@/types/global-types';
import type { GridState } from '@/types/planner';
import type { LifeBucket } from '@/types/time';
import { WeekUtils } from '@/utils/week';
import {
  analyzeAllGoals,
  analyzeAllHabits,
  analyzeAllWeeks,
  computeLifeTrajectory,
  type GoalAnalysis,
  type HabitAnalysis,
  type WeekExecution,
  type LifeTrajectoryScore,
} from '@/utils/analytics-engine';
import {
  calculateWeekBucketHours,
  detectEmptyBucketStreaks,
  calculateBucketBalanceScores,
  type BucketStats,
  type WeeklyBucketHistory,
} from '@/utils/bucket-engine';

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

  // Life Buckets Analytics
  bucketStats: BucketStats;
  bucketHistory: WeeklyBucketHistory[];
  emptyBucketStreaks: Record<LifeBucket, number>;
  bucketBalanceScores: Record<LifeBucket, number>;
  rawGoals: Goal[];
  rawHabits: Habit[];
  rawCustomTasks: CustomTask[];
}

const fetchDetailedAnalytics = async (): Promise<DetailedAnalytics> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [goalsRes, habitsRes, customTasksRes, completedRes, weekPlansRes, profileRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('custom_tasks').select('*').eq('user_id', userId),
    supabase.from('completed_tasks').select('dayStr, taskIds').eq('user_id', userId),
    supabase.from('week_plans').select('week, state').eq('user_id', userId),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ]);

  const profile = profileRes.data;
  const userSleepStart = profile?.sleep_start || profile?.sleepStart || session?.user?.user_metadata?.sleepStart || "22:00";
  const userSleepDuration = Number(profile?.sleep_duration || profile?.sleepDuration || session?.user?.user_metadata?.sleepDuration) || 8;
  const userPlanDay = profile?.plan_day || profile?.planDay || "Sunday";
  let userPlanHours = 1;
  const startTime = profile?.plan_start_time || profile?.planStartTime;
  const endTime = profile?.plan_end_time || profile?.planEndTime;
  if (startTime && endTime) {
    const [psH, psM] = String(startTime).split(':').map(Number);
    const [peH, peM] = String(endTime).split(':').map(Number);
    if (!isNaN(psH) && !isNaN(peH)) {
      userPlanHours = Math.max(0.5, (peH * 60 + peM - (psH * 60 + psM)) / 60);
    }
  }

  const goals: Goal[] = goalsRes.data ?? [];
  const habits: Habit[] = habitsRes.data ?? [];
  const customTasks: CustomTask[] = customTasksRes.data ?? [];

  const completedMap: Record<string, string[]> = {};
  for (const row of (completedRes.data ?? [])) {
    completedMap[row.dayStr] = row.taskIds ?? [];
  }

  const weekPlans: { week: string; state: GridState }[] =
    (weekPlansRes.data ?? []).map((r: any) => ({ week: r.week, state: r.state ?? {} }));

  // Extract custom tasks with bucket tags from all week plans
  const gridCustomTasksMap = new Map<string, CustomTask>();
  weekPlans.forEach((wp) => {
    if (wp.state) {
      Object.values(wp.state).forEach((val: any) => {
        if (val && typeof val === 'object' && val.name) {
          const trimmed = val.name.trim().toLowerCase();
          let b = val.bucket;
          if (!b && val.color) {
            const c = String(val.color).toLowerCase();
            if (c.includes('f59e0b') || c.includes('amber') || c.includes('eab308') || c.includes('d97706')) b = 'relational';
            else if (c.includes('8b5cf6') || c.includes('purple') || c.includes('a855f7')) b = 'asset';
            else if (c.includes('10b981') || c.includes('emerald') || c.includes('06b6d4')) b = 'income';
            else if (c.includes('f43f5e') || c.includes('rose') || c.includes('3b82f6')) b = 'recovery';
          }
          if (b) {
            gridCustomTasksMap.set(trimmed, {
              id: val.name,
              name: val.name,
              bucket: b,
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
    if (!mergedCustomTasks.some(t => t.name && t.name.trim().toLowerCase() === task.name.trim().toLowerCase())) {
      mergedCustomTasks.push(task);
    }
  });

  const currentWeek = WeekUtils.getCurrentWeek();
  const currentWeekPlan = weekPlans.find(wp => wp.week === currentWeek || wp.week === WeekUtils.formatWeekDisplay(currentWeek));

  const { analyses: goalAnalyses, average: goalAverage, best: bestGoal } = analyzeAllGoals(
    goals,
    currentWeek,
    currentWeekPlan?.state,
    completedMap
  );
  const { analyses: habitAnalyses, average: habitAverage, best: bestHabit } = analyzeAllHabits(habits, completedMap);
  const { weeks, average: weekAverage, best: bestWeek } = analyzeAllWeeks(weekPlans, completedMap);

  // Compute bucket stats for current week using user preferences
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

  // Compute bucket stats history across all tracked weeks
  const bucketHistory: WeeklyBucketHistory[] = weekPlans.map((wp) => {
    const stats = calculateWeekBucketHours(
      wp.state,
      goals,
      habits,
      mergedCustomTasks,
      userSleepStart,
      userSleepDuration,
      userPlanDay,
      userPlanHours
    );
    return {
      week: wp.week,
      hours: stats.bucketHours,
      unassignedHours: stats.unassignedHours,
      totalHours: stats.totalAllocatedHours,
    };
  });

  const emptyBucketStreaks = detectEmptyBucketStreaks(bucketHistory);
  const bucketBalanceScores = calculateBucketBalanceScores(bucketStats);

  const avgBalanceScore = (Object.values(bucketBalanceScores).reduce((a, b) => a + b, 0) / 4) * 10;
  const trajectory = computeLifeTrajectory(goalAverage, habitAverage, weekAverage, avgBalanceScore);

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
  };
};

export const useDetailedAnalytics = (enabled: boolean) =>
  useQuery({
    queryKey: ['detailed_analytics'],
    queryFn: fetchDetailedAnalytics,
    enabled,
    staleTime: 60 * 1000,
  });

