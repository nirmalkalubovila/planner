import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { WeekUtils } from '@/utils/week';

export interface UserStatsCache {
  predictive_burnout_warning: string | null;
  consistency_grade: string;
  habit_heatmap: { date: string; count: number }[];
  top_goal: {
    name: string;
    progress: number;
    projected_completion: string;
  };
  bio_sync: {
    sleep_duration: number;
    completion_volume: number;
    correlationText: string;
  };
}

const fetchUserStatsCache = async (): Promise<UserStatsCache> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  const metadata = session?.user?.user_metadata;

  // Try the pre-aggregated cache first
  const { data: cached, error: cacheError } = await supabase
    .from('user_stats_cache')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!cacheError && cached) {
    const row = cached as any;
    return {
      predictive_burnout_warning: row.predictive_burnout_warning ?? null,
      consistency_grade: row.consistency_grade ?? 'F',
      habit_heatmap: row.habit_heatmap ?? [],
      top_goal: row.top_goal ?? { name: 'No active goals', progress: 0, projected_completion: '-' },
      bio_sync: row.bio_sync ?? { sleep_duration: 7, completion_volume: 0, correlationText: '' },
    };
  }

  // Fallback: compute from raw tables when cache row doesn't exist
  const today = new Date();

  // Build a list of the last 30 days with both ISO date (for display) and dayStr (for DB lookup)
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today.getTime() - (29 - i) * 86400000);
    const isoDate = d.toISOString().split('T')[0];
    // dayStr format matching today-service: "YYYY-WW-D" (e.g. "2026-22-3")
    const weekKey = WeekUtils.getWeekFromDate(d);
    const dayNum = d.getDay() === 0 ? 7 : d.getDay();
    const dayStr = `${weekKey}-${dayNum}`;
    return { isoDate, dayStr };
  });

  const dayStrs = last30Days.map(d => d.dayStr);

  const [completedRes, goalsRes] = await Promise.all([
    supabase
      .from('completed_tasks')
      .select('dayStr, taskIds')
      .in('dayStr', dayStrs)
      .eq('user_id', userId),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false }),
  ]);

  const completedMap: Record<string, number> = {};
  for (const row of (completedRes.data ?? [])) {
    completedMap[row.dayStr] = row.taskIds?.length || 0;
  }

  const habit_heatmap = last30Days.map(day => ({
    date: day.isoDate,
    count: completedMap[day.dayStr] || 0,
  }));

  const totalCompleted = habit_heatmap.reduce((s, d) => s + d.count, 0);
  const avgCompleted = last30Days.length
    ? Math.round((totalCompleted / last30Days.length) * 10) / 10
    : 0;

  const activeDaysCount = habit_heatmap.filter(d => d.count > 0).length;
  let consistency_grade = 'F';
  if (activeDaysCount > 25) consistency_grade = 'A+';
  else if (activeDaysCount > 20) consistency_grade = 'A';
  else if (activeDaysCount > 15) consistency_grade = 'B+';
  else if (activeDaysCount > 10) consistency_grade = 'B';
  else if (activeDaysCount > 5) consistency_grade = 'C';
  else if (activeDaysCount > 0) consistency_grade = 'D';

  const sleepDuration = Number(metadata?.sleepDuration) || 7;
  let predictive_burnout_warning: string | null = null;
  if (sleepDuration < 6 && avgCompleted >= 5) {
    predictive_burnout_warning = 'Pacing required. High output vs. low sleep detected.';
  }

  let top_goal = { name: 'No active goals', progress: 0, projected_completion: '-' };
  const goalsData = goalsRes.data ?? [];
  if (goalsData.length > 0) {
    const goal = goalsData.find((g: any) => g.milestones?.length > 0) || goalsData[0];
    let progress = 0;
    if (goal.milestones?.length > 0) {
      const finished = goal.milestones.filter((m: any) => m.completed).length;
      progress = Math.round((finished / goal.milestones.length) * 100);
    }
    top_goal = {
      name: goal.name,
      progress,
      projected_completion: goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'TBD',
    };
  }

  return {
    predictive_burnout_warning,
    consistency_grade,
    habit_heatmap,
    top_goal,
    bio_sync: {
      sleep_duration: sleepDuration,
      completion_volume: avgCompleted,
      correlationText:
        sleepDuration >= 7 && avgCompleted > 2
          ? 'Healthy sleep positively correlates with your task execution rate.'
          : 'Warning: Sleep debt may naturally reduce optimal daily execution.',
    },
  };
};

export const useUserStats = () =>
  useQuery({
    queryKey: ['user_stats_cache'],
    queryFn: fetchUserStatsCache,
    staleTime: 5 * 60 * 1000,
  });
