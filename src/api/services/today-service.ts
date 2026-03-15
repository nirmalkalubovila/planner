import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const TABLE_NAME = "completed_tasks";

const getCompletedTasks = async (dayStr: string): Promise<string[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("taskIds")
        .eq("dayStr", dayStr)
        .eq("user_id", userId)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is the "no rows returned" error
        throw new Error(error.message);
    }

    return data?.taskIds || [];
};

export const getWeekCompletedTasks = async (dayStrs: string[]): Promise<Record<string, string[]>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return {};

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("dayStr, taskIds")
        .in("dayStr", dayStrs)
        .eq("user_id", userId);

    if (error) {
        throw new Error(error.message);
    }

    const result: Record<string, string[]> = {};
    if (data) {
        data.forEach((row: any) => {
            result[row.dayStr] = row.taskIds || [];
        });
    }
    return result;
};

export function useGetCompletedTasks(dayStr: string) {
    return useQuery({
        queryKey: ["completed", dayStr],
        queryFn: () => getCompletedTasks(dayStr),
    });
}

export function useGetWeekCompletedTasks(dayStrs: string[]) {
    return useQuery({
        queryKey: ["completed_week", ...dayStrs],
        queryFn: () => getWeekCompletedTasks(dayStrs),
        enabled: dayStrs.length > 0
    });
}

export function useToggleCompletedTask() {
    const queryClient = useQueryClient();

    return useMutation({
        onMutate: async ({ dayStr, taskId }) => {
            await queryClient.cancelQueries({ queryKey: ["completed", dayStr] });

            const previousTasks = queryClient.getQueryData<string[]>(["completed", dayStr]) || [];

            const isCompleted = previousTasks.includes(taskId);
            const optimistic = isCompleted
                ? previousTasks.filter(id => id !== taskId)
                : [...previousTasks, taskId];

            queryClient.setQueryData(["completed", dayStr], optimistic);

            return { previousTasks };
        },
        mutationFn: async ({ dayStr }: { dayStr: string; taskId: string }) => {
            const updated = queryClient.getQueryData<string[]>(["completed", dayStr]) || [];

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { user_id: userId, dayStr, taskIds: updated },
                    { onConflict: 'dayStr' }
                );

            if (error) throw new Error(error.message);
            return updated;
        },
        onError: (_err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["completed", variables.dayStr], context.previousTasks);
            }
            toast.error("Failed to update task");
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["completed", variables.dayStr], data);
        },
    });
}
