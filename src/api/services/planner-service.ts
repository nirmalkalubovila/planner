import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridState } from "@/types/global-types";
import { WeekUtils } from "@/utils/week-utils";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "week_plans";

const getPlan = async (week: string): Promise<GridState> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return {};

    const normalizedWeek = WeekUtils.normalizeWeek(week);
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("state")
        .eq("week", normalizedWeek)
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
        mutationFn: async ({ week, state }: { week: string; state: GridState }) => {
            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { user_id: userId, week: normalizedWeek, state },
                    { onConflict: 'user_id,week' }
                );

            if (error) throw new Error(error.message);
            return state;
        },
        onSuccess: (_, variables) => {
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
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq("week", normalizedWeek)
                .eq("user_id", userId);

            if (error) throw new Error(error.message);
        },
        onSuccess: (_, week) => {
            queryClient.invalidateQueries({ queryKey: ["planner", WeekUtils.normalizeWeek(week)] });
        },
    });
}
