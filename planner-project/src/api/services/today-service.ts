import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "completed_tasks";

const getCompletedTasks = async (dayStr: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("taskIds")
        .eq("dayStr", dayStr)
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
        mutationFn: async ({ dayStr, taskId }: { dayStr: string; taskId: string }) => {
            const current = await getCompletedTasks(dayStr);
            const isCompleted = current.includes(taskId);
            const updated = isCompleted
                ? current.filter(id => id !== taskId)
                : [...current, taskId];

            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    { dayStr, taskIds: updated },
                    { onConflict: 'dayStr' }
                );

            if (error) throw new Error(error.message);
            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["completed", variables.dayStr] });
        },
    });
}
