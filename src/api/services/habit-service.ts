import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Habit } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "habits";

// Fetch from Supabase
const getHabits = async (): Promise<Habit[]> => {
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const { description, ...safeHabit } = newHabit as any;
            const habitData = { ...safeHabit, user_id: userId };

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([habitData])
                .select()
                .single();
            if (error) {
                console.error("Supabase Insert Error:", error);
                alert("Failed to insert habit: " + error.message);
                throw new Error(error.message);
            }
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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useDeleteHabit() {
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
