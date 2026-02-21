import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Goal } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "goals";

// Fetch from Supabase
const getGoals = async (): Promise<Goal[]> => {
    const { data, error } = await supabase.from(TABLE_NAME).select("*").order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
};

export function useGetGoals() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: () => getGoals(),
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newGoal: Goal) => {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([newGoal])
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedGoal: Goal) => {
            const { id, ...updates } = updatedGoal;
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update({ ...updates, updatedAt: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}
