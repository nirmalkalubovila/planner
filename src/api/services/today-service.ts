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

export function useGetCompletedTasks(dayStr: string) {
    return useQuery({
        queryKey: ["completed", dayStr],
        queryFn: () => getCompletedTasks(dayStr),
    });
}

export function useToggleCompletedTask() {
    const queryClient = useQueryClient();

    return useMutation({
        onMutate: async ({ dayStr, taskId }) => {
            await queryClient.cancelQueries({ queryKey: ["completed", dayStr] });

            const previousTasks = queryClient.getQueryData<string[]>(["completed", dayStr]);

            queryClient.setQueryData(["completed", dayStr], (old: string[] | undefined) => {
                const current = old || [];
                const isCompleted = current.includes(taskId);
                if (isCompleted) {
                    return current.filter(id => id !== taskId);
                } else {
                    return [...current, taskId];
                }
            });

            return { previousTasks };
        },
        mutationFn: async ({ dayStr, taskId }: { dayStr: string; taskId: string }) => {
            const current = await getCompletedTasks(dayStr);
            const isCompleted = current.includes(taskId);
            const updated = isCompleted
                ? current.filter(id => id !== taskId)
                : [...current, taskId];

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) throw new Error("Not authenticated");

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { user_id: userId, dayStr, taskIds: updated },
                    { onConflict: 'dayStr' }
                );

            if (error) {
                console.error("Error updating completed tasks:", error);
                throw new Error(error.message);
            }
            return updated;
        },
        onError: (_err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["completed", variables.dayStr], context.previousTasks);
            }
            toast.error("Failed to update task: " + _err.message);
        },
        onSuccess: () => {
            // we can display a toast for success, checking if it was a completion or an undo
            // but we don't have the previous length here unless we pass it from onMutate or calculate it.
            // Simple approach:
            toast.success("Task progress logged!");
        },
        onSettled: (_, __, variables) => {
            queryClient.invalidateQueries({ queryKey: ["completed", variables.dayStr] });
        },
    });
}
