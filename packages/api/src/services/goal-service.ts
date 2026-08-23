import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Goal } from '@llb/core';
import { supabase } from '../supabase-client';
import { getCurrentUserId, getOptionalUserId } from '../helpers/auth-helpers';
import { toast } from '@llb/core';

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
    // The DB's `title` column is a nullable legacy leftover (the app really
    // uses `name`); Goal.title is typed required, matching how the rest of
    // the app already treats it.
    return (data || []) as unknown as Goal[];
};

export function useGetGoals() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: getGoals,
        staleTime: 5 * 60 * 1000, // 5 min -- also used by notification hooks
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newGoal: Goal) => {
            const userId = await getCurrentUserId();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                // milestones (Milestone[]) isn't statically assignable to the
                // generated jsonb `Json` column type; the runtime shape is fine.
                .insert([{ ...newGoal, user_id: userId }] as any)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data as unknown as Goal;
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
            if (!id) throw new Error("Cannot update a goal with no id");
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update({ ...updates, updatedAt: new Date().toISOString() } as any)
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data as unknown as Goal;
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
