import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GridState } from "@/types/global-types";
import { WeekUtils } from "@/utils/week-utils";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "week_plans";

const getPlan = async (week: string): Promise<GridState> => {
    const normalizedWeek = WeekUtils.normalizeWeek(week);
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("state")
        .eq("week", normalizedWeek)
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
            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { week: normalizedWeek, state },
                    { onConflict: 'week' }
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
            const normalizedWeek = WeekUtils.normalizeWeek(week);
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq("week", normalizedWeek);

            if (error) throw new Error(error.message);
        },
        onSuccess: (_, week) => {
            queryClient.invalidateQueries({ queryKey: ["planner", WeekUtils.normalizeWeek(week)] });
        },
    });
}
