import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridState } from "@/types/global-types";
import { WeekUtils } from "@/utils/week-utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is the "no rows returned" error
        throw new Error(error.message);
    }

    return data?.state || {};
};

export function useGetWeekPlan(week: string) {
    return useQuery({
        queryKey: ["planner", WeekUtils.normalizeWeek(week)],
        queryFn: () => getPlan(week),
    });
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
                    { user_id: userId, week: dbWeekKey, state },
                    { onConflict: 'week' }
                );

            if (error) {
                console.error("Error saving week plan:", error);
                throw new Error(error.message);
            }
            return state;
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPlan) {
                queryClient.setQueryData(["planner", context.normalizedWeek], context.previousPlan);
            }
            toast.error("Failed to save plan: " + _err.message);
        },
        onSuccess: () => {
            toast.success("Week plan saved! Keep up the good work.");
        },
        onSettled: (_, __, variables) => {
            queryClient.invalidateQueries({ queryKey: ["planner", WeekUtils.normalizeWeek(variables.week)] });
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
        onError: (err) => {
            toast.error("Failed to clear plan: " + err.message);
        },
        onSuccess: (_, week) => {
            toast.success("Week plan cleared.");
            queryClient.invalidateQueries({ queryKey: ["planner", WeekUtils.normalizeWeek(week)] });
        },
    });
}
