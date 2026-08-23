import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridState } from '@llb/core';
import { WeeklyBucketActions } from '@llb/core';
import { WeekUtils } from '@llb/core';
import { supabase } from '../supabase-client';
import { toast } from '@llb/core';
import { handleFriendlyError } from '@llb/core';

const TABLE_NAME = "week_plans";

const getPlan = async (week: string): Promise<GridState> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return {};

    const normalizedWeek = WeekUtils.normalizeWeek(week);
    const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("state")
        .eq("week", dbWeekKey)
        .eq("user_id", userId)
        .maybeSingle();

    if (error && error.code !== "PGRST116") { // PGRST116 is the "no rows returned" error
        throw new Error(error.message);
    }

    return (data?.state as unknown as GridState) || {};
};

export function useGetWeekPlan(week: string) {
    return useQuery({
        queryKey: ["planner", WeekUtils.normalizeWeek(week)],
        queryFn: () => getPlan(week),
        staleTime: 5 * 60 * 1000,      // 5 min — data stays fresh, no refetch on focus/mount
        gcTime: 30 * 60 * 1000,         // 30 min — keep in cache even after unmount
        placeholderData: (prev) => prev, // Keep showing previous week while new one loads
        refetchOnWindowFocus: false,
    });
}

// Prefetch adjacent weeks for instant navigation
export function usePrefetchAdjacentWeeks(week: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prevWeek = WeekUtils.addWeeks(week, -1);
        const nextWeek = WeekUtils.addWeeks(week, 1);

        queryClient.prefetchQuery({
            queryKey: ["planner", WeekUtils.normalizeWeek(prevWeek)],
            queryFn: () => getPlan(prevWeek),
            staleTime: 5 * 60 * 1000,
        });
        queryClient.prefetchQuery({
            queryKey: ["planner", WeekUtils.normalizeWeek(nextWeek)],
            queryFn: () => getPlan(nextWeek),
            staleTime: 5 * 60 * 1000,
        });
    }, [week, queryClient]);
}

export function useSaveWeekPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        onMutate: async ({ week, state }) => {
            const normalizedWeek = WeekUtils.normalizeWeek(week);
            await queryClient.cancelQueries({ queryKey: ["planner", normalizedWeek] });
            const previousPlan = queryClient.getQueryData<GridState>(["planner", normalizedWeek]);
            queryClient.setQueryData(["planner", normalizedWeek], state);
            return { previousPlan, normalizedWeek };
        },
        mutationFn: async ({ week, state }: { week: string; state: GridState }) => {
            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) throw new Error("Not authenticated");

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { user_id: userId, week: dbWeekKey, state: state as any },
                    { onConflict: 'user_id,week' }
                );

            if (error) {
                console.error("Error saving week plan:", error);
                throw new Error(error.message);
            }
            return state;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detailed_analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
            queryClient.invalidateQueries({ queryKey: ['vault_insights'] });
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPlan) {
                queryClient.setQueryData(["planner", context.normalizedWeek], context.previousPlan);
            }
            handleFriendlyError(_err, "Failed to save plan");
        },
    });
}

export function useClearWeekPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (week: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq("week", dbWeekKey)
                .eq("user_id", userId);

            if (error) throw new Error(error.message);
        },
        onError: (err: Error) => {
            toast.error("Failed to clear plan: " + err.message);
        },
        onSuccess: (_: void, week: string) => {
            toast.success("Week plan cleared.");
            queryClient.invalidateQueries({ queryKey: ["planner", WeekUtils.normalizeWeek(week)] });
        },
    });
}

export function useGetWeekBucketActions(week: string) {
    return useQuery({
        queryKey: ["planner_bucket_actions", WeekUtils.normalizeWeek(week)],
        queryFn: async (): Promise<WeeklyBucketActions> => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) return {};

            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);
            const { data } = await supabase
                .from(TABLE_NAME)
                .select("bucket_actions")
                .eq("week", dbWeekKey)
                .eq("user_id", userId)
                .maybeSingle();

            return (data?.bucket_actions as WeeklyBucketActions) || {};
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSaveBucketActions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ week, bucketActions }: { week: string; bucketActions: WeeklyBucketActions }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);

            // Fetch existing plan state first to avoid overwriting grid state
            const { data: existing } = await supabase
                .from(TABLE_NAME)
                .select("state")
                .eq("week", dbWeekKey)
                .eq("user_id", userId)
                .maybeSingle();

            const currentState = existing?.state || {};

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { user_id: userId, week: dbWeekKey, state: currentState as any, bucket_actions: bucketActions as any },
                    { onConflict: 'user_id,week' }
                );

            if (error) throw new Error(error.message);
            return bucketActions;
        },
        onSuccess: (_, variables) => {
            const normalizedWeek = WeekUtils.normalizeWeek(variables.week);
            queryClient.invalidateQueries({ queryKey: ["planner_bucket_actions", normalizedWeek] });
            toast.success("Weekly Outcomes saved!");
        },
        onError: (err) => {
            toast.error("Failed to save bucket actions: " + err.message);
        },
    });
}
