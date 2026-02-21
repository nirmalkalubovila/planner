import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Goal } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "goals";

// Fetch from Supabase
const getGoals = async (): Promise<Goal[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("user_id", userId)
        .order("createdAt", { ascending: false });

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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const goalData = { ...newGoal, user_id: userId };

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([goalData])
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const { id, ...updates } = updatedGoal;
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update({ ...updates, updatedAt: new Date().toISOString() })
                .eq("id", id)
                .eq("user_id", userId)
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id).eq("user_id", userId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}
