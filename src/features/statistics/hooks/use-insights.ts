import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Goal, Habit } from '@/types/global-types';
import type { VaultNote } from '@/types/vault';
import type { GridState } from '@/types/planner';
import { generateWeeklyInsights, generateMonthlyInsights, type InsightCardData } from '@/utils/insights-engine';

export interface InsightsResult {
  weekly: InsightCardData[];
  monthly: InsightCardData[];
}

const fetchInsights = async (): Promise<InsightsResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const today = new Date();
  
  // Get current week key e.g. "2026-26"
  const currentYear = today.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const startDay = startOfYear.getDay() || 7;
  const currentWeekNum = Math.ceil((days + startDay) / 7);
  const currentWeek = `${currentYear}-${String(currentWeekNum).padStart(2, '0')}`;
  
  // Get current month key e.g. "2026-06"
  const currentMonth = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [goalsRes, habitsRes, completedRes, weekPlansRes, vaultRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('completed_tasks').select('dayStr, taskIds').eq('user_id', userId),
    supabase.from('week_plans').select('week, state').eq('user_id', userId),
    supabase.from('vault_notes').select('*').eq('user_id', userId),
  ]);

  const goals: Goal[] = goalsRes.data ?? [];
  const habits: Habit[] = habitsRes.data ?? [];

  const completedMap: Record<string, string[]> = {};
  for (const row of (completedRes.data ?? [])) {
    completedMap[row.dayStr] = row.taskIds ?? [];
  }

  const weekPlans: { week: string; state: GridState }[] =
    (weekPlansRes.data ?? []).map((r: any) => ({ week: r.week, state: r.state ?? {} }));

  const vaultNotes: VaultNote[] = (vaultRes.data ?? []).map((row: any) => ({
    ...row,
    title: row.title || '',
    category: row.category || 'ideas',
    is_draft: false,
    source_page: row.source_page || null,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags as unknown as string) : []),
  }));

  const weekly = generateWeeklyInsights(currentWeek, goals, habits, completedMap, weekPlans, vaultNotes);
  const monthly = generateMonthlyInsights(currentMonth, goals, habits, completedMap, weekPlans, vaultNotes);

  return {
    weekly,
    monthly,
  };
};

export const useInsights = () =>
  useQuery({
    queryKey: ['insights_wrapped'],
    queryFn: fetchInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes cache to make switching tabs instant
  });
