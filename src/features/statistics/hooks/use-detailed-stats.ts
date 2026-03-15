import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Goal, Habit } from '@/types/global-types';
import type { GridState } from '@/types/planner';
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
}

const fetchDetailedAnalytics = async (): Promise<DetailedAnalytics> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [goalsRes, habitsRes, completedRes, weekPlansRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('completed_tasks').select('dayStr, taskIds').eq('user_id', userId),
    supabase.from('week_plans').select('week, state').eq('user_id', userId),
  ]);

  const goals: Goal[] = goalsRes.data ?? [];
  const habits: Habit[] = habitsRes.data ?? [];

  const completedMap: Record<string, string[]> = {};
  for (const row of (completedRes.data ?? [])) {
    completedMap[row.dayStr] = row.taskIds ?? [];
  }

  const weekPlans: { week: string; state: GridState }[] =
    (weekPlansRes.data ?? []).map((r: any) => ({ week: r.week, state: r.state ?? {} }));

  const { analyses: goalAnalyses, average: goalAverage, best: bestGoal } = analyzeAllGoals(goals);
  const { analyses: habitAnalyses, average: habitAverage, best: bestHabit } = analyzeAllHabits(habits, completedMap);
  const { weeks, average: weekAverage, best: bestWeek } = analyzeAllWeeks(weekPlans, completedMap);

  const trajectory = computeLifeTrajectory(goalAverage, habitAverage, weekAverage);

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
  };
};

export const useDetailedAnalytics = (enabled: boolean) =>
  useQuery({
    queryKey: ['detailed_analytics'],
    queryFn: fetchDetailedAnalytics,
    enabled,
    staleTime: 60 * 1000,
  });
