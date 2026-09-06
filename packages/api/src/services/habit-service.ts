import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Habit } from '@llb/core';
import { supabase } from '../supabase-client';
import { getCurrentUserId, getOptionalUserId } from '../helpers/auth-helpers';
import { toast } from '@llb/core';

const TABLE_NAME = "habits";

const getHabits = async (): Promise<Habit[]> => {
    const userId = await getOptionalUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("user_id", userId)
        .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Habit[];
};

export function useGetHabits() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: getHabits,
        staleTime: 5 * 60 * 1000, // 5 min -- prevents redundant fetches from multiple notification hooks
    });
}

export function useCreateHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newHabit: Habit) => {
            const userId = await getCurrentUserId();
            const { description, ...safeHabit } = newHabit as any;
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([{ ...safeHabit, user_id: userId }])
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        },
        onError: (err) => { toast.error("Failed to create habit: " + err.message); },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useUpdateHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedHabit: Habit) => {
            const userId = await getCurrentUserId();
            const { id, description, ...updates } = updatedHabit as any;
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
        onError: (err) => { toast.error("Failed to update habit: " + err.message); },
        onSuccess: () => {
            toast.success("Habit updated successfully!");
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useDeleteHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const userId = await getCurrentUserId();
            const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id).eq("user_id", userId);
            if (error) throw new Error(error.message);
        },
        onError: (err) => { toast.error("Failed to delete habit: " + err.message); },
        onSuccess: () => {
            toast.success("Habit deleted correctly.");
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}
