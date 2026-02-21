import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Habit } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "habits";

// Fetch from Supabase
const getHabits = async (): Promise<Habit[]> => {
    const { data, error } = await supabase.from(TABLE_NAME).select("*").order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
};

// ============ QUERIES ============

export function useGetHabits() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: () => getHabits(),
    });
}

// ============ MUTATIONS ============

export function useCreateHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newHabit: Habit) => {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([newHabit])
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

export function useUpdateHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedHabit: Habit) => {
            const { id, ...updates } = updatedHabit;
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

export function useDeleteHabit() {
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
