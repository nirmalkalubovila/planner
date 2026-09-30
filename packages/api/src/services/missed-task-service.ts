import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomTask } from '@llb/core';
import { supabase } from '../supabase-client';
import { getCurrentUserId, getOptionalUserId } from '../helpers/auth-helpers';
import { toast } from '@llb/core';

const TABLE_NAME = "missed_tasks";

const getMissedTasks = async (): Promise<CustomTask[]> => {
    const userId = await getOptionalUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("user_id", userId)
        .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as CustomTask[];
};

export function useGetMissedTasks() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: getMissedTasks,
        staleTime: 5 * 60 * 1000, // 5 min -- prevents unnecessary re-fetches on mount
    });
}

export function useCreateMissedTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (task: Partial<CustomTask>) => {
            const userId = await getCurrentUserId();

            const cleanTask = Object.fromEntries(
                Object.entries(task).filter(([k, v]) => v !== undefined && k !== 'color' && k !== 'id')
            );

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert({ ...cleanTask, user_id: userId } as any)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Task added to Missed Library!");
        },
        onError: (error: any) => {
            toast.error("Failed to add to Missed Library: " + error.message);
        }
    });
}

export function useDeleteMissedTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const userId = await getCurrentUserId();

            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq("id", id)
                .eq("user_id", userId);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Task removed from Missed Library.");
        }
    });
}

/**
 * Reset defers work out of a week instead of deleting it: each deferred task goes to the Missed Library
 * in one insert (no per-task toast), and the ids come back so the whole reset can be undone.
 */
export function useDeferToMissedLibrary() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tasks: { name: string; description?: string; startTime: string; endTime: string }[]): Promise<string[]> => {
            if (tasks.length === 0) return [];
            const userId = await getCurrentUserId();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert(tasks.map((t) => ({ ...t, daysOfWeek: [], user_id: userId })) as any)
                .select("id");
            if (error) throw new Error(error.message);
            return (data || []).map((r: { id: string }) => r.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}

export function useRestoreFromMissedLibrary() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            if (ids.length === 0) return;
            const userId = await getCurrentUserId();
            const { error } = await supabase.from(TABLE_NAME).delete().in("id", ids).eq("user_id", userId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
    });
}
