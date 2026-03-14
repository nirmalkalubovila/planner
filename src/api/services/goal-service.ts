import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Goal } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId, getOptionalUserId } from "@/api/helpers/auth-helpers";
import { toast } from "sonner";

const TABLE_NAME = "goals";

const getGoals = async (): Promise<Goal[]> => {
    const userId = await getOptionalUserId();
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
        queryFn: getGoals,
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newGoal: Goal) => {
            const userId = await getCurrentUserId();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([{ ...newGoal, user_id: userId }])
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        },
        onError: (err) => { toast.error("Failed to create goal: " + err.message); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TABLE_NAME] }); },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedGoal: Goal) => {
            const userId = await getCurrentUserId();
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
        onError: (err) => { toast.error("Failed to update goal: " + err.message); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: [TABLE_NAME] }); },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const userId = await getCurrentUserId();
            const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id).eq("user_id", userId);
            if (error) throw new Error(error.message);
        },
        onError: (err) => { toast.error("Failed to delete goal: " + err.message); },
        onSuccess: () => {
            toast.success("Goal deleted from records.");
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}
