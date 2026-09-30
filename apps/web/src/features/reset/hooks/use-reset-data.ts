import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    useGetWeekPlan, useGetWeekPlanUpdatedAt, useGetWeekBucketActions, useGetGoals, useGetHabits,
    useGetWeekCompletedTasks, useUserProfile,
} from '@llb/api';
import { WeekUtils, getDailyHourBudget, getWeekendHourBudget, type GridState, type ResetInput, type ResetReason } from '@llb/core';

/**
 * Everything Reset needs for the current week, read through the hooks the Week Planner and Today already use,
 * so nothing extra is fetched and the same cache serves all three pages.
 */
export function useResetData() {
    const { user } = useAuth();
    const { profile } = useUserProfile(user);
    const week = WeekUtils.getCurrentWeek();
    const dayStrs = useMemo(() => [1, 2, 3, 4, 5, 6, 7].map((n) => `${week}-${n}`), [week]);

    const plan = useGetWeekPlan(week);
    const updatedAt = useGetWeekPlanUpdatedAt(week);
    const bucketActions = useGetWeekBucketActions(week);
    const goals = useGetGoals();
    const habits = useGetHabits();
    const completed = useGetWeekCompletedTasks(dayStrs);

    const isLoading = plan.isPending || completed.isPending || goals.isPending || habits.isPending || bucketActions.isPending;
    const isError = plan.isError || completed.isError || goals.isError || habits.isError;

    const grid: GridState = plan.data ?? ({} as GridState);

    const priorities = useMemo(() => {
        const raw = (bucketActions.data ?? {}) as Record<string, any>;
        return (['p1', 'p2', 'p3'] as const)
            .map((k) => raw[k])
            .filter((p) => p && typeof p.text === 'string' && p.text.trim())
            .map((p) => ({
                text: p.text as string,
                goalId: p.linkedItemType === 'goal' ? (p.linkedItemId as string | undefined) : undefined,
                name: p.linkedItemName as string | undefined,
            }));
    }, [bucketActions.data]);

    const completedByDay = useMemo(() => {
        const out: Record<number, string[]> = {};
        dayStrs.forEach((key, i) => { out[i] = completed.data?.[key] ?? []; });
        return out;
    }, [completed.data, dayStrs]);

    const planHours = useMemo(() => {
        const start = profile?.planStartTime;
        const end = profile?.planEndTime;
        if (!start || !end) return 1;
        const [sh, sm] = String(start).split(':').map(Number);
        const [eh, em] = String(end).split(':').map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 1;
        return Math.max(0.5, (eh * 60 + em - (sh * 60 + sm)) / 60);
    }, [profile?.planStartTime, profile?.planEndTime]);

    const buildInput = useCallback(
        (now: Date, extra?: { reasons?: ResetReason[]; protectGoalId?: string | null }, gridOverride?: GridState, completedOverride?: Record<number, string[]>): ResetInput => ({
            grid: gridOverride ?? grid,
            weekStr: week,
            now,
            habits: habits.data ?? [],
            goals: goals.data ?? [],
            completedByDay: completedOverride ?? completedByDay,
            priorities,
            sleepStart: profile?.sleepStart || '22:00',
            sleepDuration: Number(profile?.sleepDuration) || 8,
            planDay: profile?.planDay || 'Sunday',
            planHours,
            weekdayHours: getDailyHourBudget(profile).target,
            weekendHours: getWeekendHourBudget(profile),
            reasons: extra?.reasons,
            protectGoalId: extra?.protectGoalId,
        }),
        [grid, week, habits.data, goals.data, completedByDay, priorities, profile, planHours],
    );

    const refetchAll = useCallback(async () => {
        const [p, c, u] = await Promise.all([plan.refetch(), completed.refetch(), updatedAt.refetch()]);
        const byDay: Record<number, string[]> = {};
        dayStrs.forEach((key, i) => { byDay[i] = c.data?.[key] ?? []; });
        return { grid: (p.data ?? ({} as GridState)) as GridState, completedByDay: byDay, updatedAt: u.data ?? null };
    }, [plan, completed, updatedAt, dayStrs]);

    return {
        week,
        dayStrs,
        grid,
        completedByDay,
        updatedAt: updatedAt.data ?? null,
        isLoading,
        isError,
        retry: () => { plan.refetch(); completed.refetch(); goals.refetch(); habits.refetch(); },
        buildInput,
        refetchAll,
    };
}
