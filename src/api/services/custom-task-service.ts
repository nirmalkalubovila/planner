import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomTask } from "@/types/global-types";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const TABLE_NAME = "custom_tasks";

const getCustomTasks = async (): Promise<CustomTask[]> => {
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

export function useGetCustomTasks() {
    return useQuery({
        queryKey: [TABLE_NAME],
        queryFn: getCustomTasks,
    });
}

export function useCreateCustomTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (task: Partial<CustomTask>) => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            // Remove any undefined fields and the color field to avoid schema cache errors
            const cleanTask = Object.fromEntries(
                Object.entries(task).filter(([k, v]) => v !== undefined && k !== 'color')
            );

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert({
                    ...cleanTask,
                    user_id: userId
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Task added to library!");
        },
        onError: (error: any) => {
            toast.error("Failed to add to library: " + error.message);
        }
    });
}

export function useDeleteCustomTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq("id", id);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Task removed from library.");
        }
    });
}
