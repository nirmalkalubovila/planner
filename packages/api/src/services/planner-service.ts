import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridState } from '@llb/core';
import { WeeklyBucketActions } from '@llb/core';
import { WeekUtils } from '@llb/core';
import { mergeGridState } from '@llb/core';
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

/**
 * The version stamp `useSaveWeekPlan` needs to tell "nothing else changed
 * this since I last read it" from "someone else wrote to this week while
 * I was offline" — a single extra column read, kept separate from
 * `useGetWeekPlan` so its many existing callers keep getting a plain
 * `GridState` with no shape change.
 */
export function useGetWeekPlanUpdatedAt(week: string) {
    return useQuery({
        queryKey: ["planner_updated_at", WeekUtils.normalizeWeek(week)],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) return null;

            const dbWeekKey = WeekUtils.formatWeekDisplay(WeekUtils.normalizeWeek(week));
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select("updated_at")
                .eq("week", dbWeekKey)
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw new Error(error.message);
            return data?.updated_at ?? null;
        },
        staleTime: 5 * 60 * 1000,
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

export interface SaveWeekPlanInput {
    week: string;
    state: GridState;
    /**
     * The state as of `lastSeenUpdatedAt` — i.e. before this session's own
     * edits. Required to three-way-merge correctly on conflict; omitting it
     * (an older/offline caller) just means the merge falls back to treating
     * every one of THIS session's slots as "changed", which is still
     * correct, only less precise about which slots truly conflicted.
     */
    baseState?: GridState;
    lastSeenUpdatedAt?: string | null;
}

export interface SaveWeekPlanResult {
    /** What actually ended up in the database — identical to the submitted
     *  state unless a conflict forced a merge, in which case the caller
     *  MUST resync its local state to this or the next autosave will
     *  silently re-clobber the merge. */
    state: GridState;
    updatedAt: string | null;
    conflicted: boolean;
    conflictedDayIndexes?: number[];
}

/** Stable identifier for this mutation, registered via
 *  `queryClient.setMutationDefaults(SAVE_WEEK_PLAN_MUTATION_KEY, ...)` on
 *  mobile so a save that was paused offline and persisted to disk can be
 *  resumed after a full app restart — a rehydrated paused mutation has no
 *  function attached to it, only this key, which is looked up against the
 *  registered defaults at resume time. */
export const SAVE_WEEK_PLAN_MUTATION_KEY = ['saveWeekPlan'] as const;

/**
 * Whole-week replace, made offline-safe.
 *
 * Online, two writers racing here is a sub-second window. Offline, it's
 * days: edit this week on the phone in airplane mode over a weekend while
 * also editing it on web, reconnect Monday — the old unconditional upsert
 * would let whichever write reaches the server last silently erase the
 * other. The fix: a conditional update keyed on `updated_at`.
 *
 *   1. Try to update, but only WHERE updated_at still matches what this
 *      session last saw. Zero rows affected means someone else wrote here
 *      first (or the row doesn't exist yet).
 *   2. No existing row → this is the first save for the week; insert.
 *   3. Existing row, stamp mismatch → real conflict. Three-way merge
 *      (base vs. this session's edits vs. whatever is on the server now)
 *      and write the merged result — never the caller's un-merged state.
 *
 * The plan's explicitly out-of-scope list (live multi-device merge, CRDTs)
 * means step 3's write-back does not itself re-check the stamp again —
 * a THIRD writer landing in that exact instant could still lose a slot.
 * That window is now sub-second again rather than days wide, which is the
 * actual problem this exists to fix.
 *
 * Exported as a standalone function (not just inline in the hook below) so
 * mobile's offline setup can register the exact same logic via
 * `setMutationDefaults` — one implementation, two entry points.
 */
export async function saveWeekPlanMutationFn({ week, state, baseState, lastSeenUpdatedAt }: SaveWeekPlanInput): Promise<SaveWeekPlanResult> {
    const normalizedWeek = WeekUtils.normalizeWeek(week);
    const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) throw new Error("Not authenticated");

    let conditionalUpdate = supabase
        .from(TABLE_NAME)
        .update({ state: state as any })
        .eq("user_id", userId)
        .eq("week", dbWeekKey);
    if (lastSeenUpdatedAt) {
        conditionalUpdate = conditionalUpdate.eq("updated_at", lastSeenUpdatedAt);
    }
    const { data: updatedRows, error: updateError } = await conditionalUpdate.select("updated_at");
    if (updateError) throw new Error(updateError.message);

    if (updatedRows && updatedRows.length > 0) {
        return { state, updatedAt: updatedRows[0].updated_at, conflicted: false };
    }

    // Either there's no row yet, or the stamp didn't match.
    const { data: existing, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select("state, updated_at")
        .eq("user_id", userId)
        .eq("week", dbWeekKey)
        .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);

    if (!existing) {
        const { data: inserted, error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert({ user_id: userId, week: dbWeekKey, state: state as any })
            .select("updated_at")
            .single();
        if (insertError) throw new Error(insertError.message);
        return { state, updatedAt: inserted.updated_at, conflicted: false };
    }

    // A real conflict: the row moved under us while we were away.
    const { merged, conflictedDayIndexes } = mergeGridState(
        baseState || {},
        state,
        (existing.state as unknown as GridState) || {}
    );

    const { data: reconciled, error: mergeError } = await supabase
        .from(TABLE_NAME)
        .update({ state: merged as any })
        .eq("user_id", userId)
        .eq("week", dbWeekKey)
        .select("updated_at")
        .single();
    if (mergeError) throw new Error(mergeError.message);

    return {
        state: merged,
        updatedAt: reconciled.updated_at,
        conflicted: conflictedDayIndexes.length > 0,
        conflictedDayIndexes,
    };
}

export function useSaveWeekPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: SAVE_WEEK_PLAN_MUTATION_KEY,
        onMutate: async ({ week, state }: SaveWeekPlanInput) => {
            const normalizedWeek = WeekUtils.normalizeWeek(week);
            await queryClient.cancelQueries({ queryKey: ["planner", normalizedWeek] });
            const previousPlan = queryClient.getQueryData<GridState>(["planner", normalizedWeek]);
            queryClient.setQueryData(["planner", normalizedWeek], state);
            return { previousPlan, normalizedWeek };
        },
        mutationFn: saveWeekPlanMutationFn,
        onSuccess: (result, variables) => {
            const normalizedWeek = WeekUtils.normalizeWeek(variables.week);
            if (result.conflicted) {
                // The optimistic write from onMutate assumed no conflict —
                // correct the cache to what the server actually holds, or
                // the next autosave resubmits the un-merged state.
                queryClient.setQueryData(["planner", normalizedWeek], result.state);
                toast.info("Some changes from another device were merged into this week's plan.");
            }
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

/**
 * This used to read `state` before writing, purely to carry it forward
 * unchanged in the upsert payload — a read-then-write race that offline
 * replay makes materially worse: a mutation queued while offline and
 * replayed later would read whatever `state` happens to be sitting on the
 * server AT REPLAY TIME and re-save it verbatim, silently reverting any
 * grid edits made in between. Updating only `bucket_actions`, with no read
 * of `state` at all, removes the race rather than narrowing its window.
 */
export function useSaveBucketActions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ week, bucketActions }: { week: string; bucketActions: WeeklyBucketActions }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const dbWeekKey = WeekUtils.formatWeekDisplay(normalizedWeek);

            const { data: updatedRows, error: updateError } = await supabase
                .from(TABLE_NAME)
                .update({ bucket_actions: bucketActions as any })
                .eq("week", dbWeekKey)
                .eq("user_id", userId)
                .select("id");
            if (updateError) throw new Error(updateError.message);

            if (!updatedRows || updatedRows.length === 0) {
                // No row for this week yet — create one. There is no grid
                // state to preserve because there was nothing to read.
                const { error: insertError } = await supabase
                    .from(TABLE_NAME)
                    .insert({ user_id: userId, week: dbWeekKey, state: {} as any, bucket_actions: bucketActions as any });
                if (insertError) throw new Error(insertError.message);
            }

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
