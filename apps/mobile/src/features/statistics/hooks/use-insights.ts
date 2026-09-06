import { useQuery } from '@tanstack/react-query';
import { supabase } from '@llb/api';
import {
  WeekUtils,
  generateWeeklyInsights,
  generateMonthlyInsights,
  generateWeeklyWins,
  generateMonthlyWins,
  generateMilestoneInsightCard,
  type CustomTask,
  type Goal,
  type GridState,
  type Habit,
  type InsightCardData,
  type SystemWin,
  type VaultNote,
} from '@llb/core';
import { computeMilestoneProgress } from '@/lib/milestone-celebration';

export interface InsightsResult {
  weekly: InsightCardData[];
  monthly: InsightCardData[];
  weeklyWins: SystemWin[];
  monthlyWins: SystemWin[];
}

/** Port of apps/web/src/features/statistics/hooks/use-insights.ts. All the
 * card/win generation is @llb/core's insights-engine, already shared; the
 * only changes here are the supabase import source and using WeekUtils for
 * the current-week key instead of web's inlined copy of that arithmetic. */
const fetchInsights = async (): Promise<InsightsResult> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const today = new Date();
  const currentWeek = WeekUtils.getCurrentWeek();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [goalsRes, habitsRes, customTasksRes, completedRes, weekPlansRes, vaultRes] =
    await Promise.all([
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('custom_tasks').select('*').eq('user_id', userId),
      supabase.from('completed_tasks').select('dayStr, taskIds').eq('user_id', userId),
      supabase.from('week_plans').select('week, state').eq('user_id', userId),
      supabase.from('vault_notes').select('*').eq('user_id', userId),
    ]);

  const goals: Goal[] = (goalsRes.data ?? []) as unknown as Goal[];
  const habits: Habit[] = (habitsRes.data ?? []) as Habit[];
  const customTasks: CustomTask[] = (customTasksRes.data ?? []) as CustomTask[];

  const completedMap: Record<string, string[]> = {};
  for (const row of completedRes.data ?? []) {
    completedMap[row.dayStr] = (row.taskIds as string[]) ?? [];
  }

  const weekPlans: { week: string; state: GridState }[] = (weekPlansRes.data ?? []).map(
    (r: any) => ({ week: r.week, state: r.state ?? {} })
  );

  const vaultNotes: VaultNote[] = (vaultRes.data ?? []).map((row: any) => ({
    ...row,
    title: row.title || '',
    category: row.category || 'ideas',
    is_draft: false,
    source_page: row.source_page || null,
    tags: Array.isArray(row.tags) ? row.tags : row.tags ? JSON.parse(row.tags as string) : [],
  }));

  const weekly = generateWeeklyInsights(
    currentWeek,
    goals,
    habits,
    completedMap,
    weekPlans,
    vaultNotes,
    customTasks
  );
  const monthly = generateMonthlyInsights(
    currentMonth,
    goals,
    habits,
    completedMap,
    weekPlans,
    vaultNotes,
    customTasks
  );
  const weeklyWins = generateWeeklyWins(currentWeek, goals, habits, completedMap, weekPlans, vaultNotes);
  const monthlyWins = generateMonthlyWins(currentMonth, goals, habits, completedMap, weekPlans, vaultNotes);

  const milestoneProgress = computeMilestoneProgress(completedMap);
  if (milestoneProgress.currentStage) {
    const milestoneCard = generateMilestoneInsightCard(
      milestoneProgress.currentStage,
      milestoneProgress.totalDaysExecuted,
      milestoneProgress.currentStreak
    );
    // Slotted in right after the intro card, same as web.
    if (weekly.length > 1) weekly.splice(1, 0, milestoneCard);
    else weekly.push(milestoneCard);

    if (monthly.length > 1) monthly.splice(1, 0, milestoneCard);
    else monthly.push(milestoneCard);
  }

  return { weekly, monthly, weeklyWins, monthlyWins };
};

export const useInsights = () =>
  useQuery({
    queryKey: ['insights_wrapped'],
    queryFn: fetchInsights,
    staleTime: 5 * 60 * 1000,
  });
