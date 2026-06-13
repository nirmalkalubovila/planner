import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/api/helpers/auth-helpers";
import { toast } from "sonner";
import type { FeedbackCategory, FeedbackStatus } from "@/features/admin/admin-constants";

const TABLE_NAME = "feedbacks";

export interface Feedback {
    id: string;
    user_id: string;
    category: FeedbackCategory;
    subject: string;
    message: string;
    status: FeedbackStatus;
    created_at: string;
    // Joined from user_profiles (admin only)
    user_email?: string;
    user_name?: string;
}

// ── User: submit feedback ──────────────────────────────────────────
export function useSubmitFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { category: FeedbackCategory; subject: string; message: string }) => {
            const userId = await getCurrentUserId();
            const { error } = await supabase
                .from(TABLE_NAME)
                .insert({
                    user_id: userId,
                    category: data.category,
                    subject: data.subject,
                    message: data.message,
                });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Feedback submitted! Thank you for helping us improve.");
        },
        onError: (err) => {
            toast.error("Failed to submit feedback: " + err.message);
        },
    });
}

// ── Admin: fetch all feedbacks ──────────────────────────────────────
export function useAdminFeedbacks() {
    return useQuery({
        queryKey: [TABLE_NAME, "admin-all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw new Error(error.message);
            return (data ?? []) as Feedback[];
        },
        staleTime: 30_000, // 30s cache
    });
}

// ── Admin: update feedback status ───────────────────────────────────
export function useAdminUpdateFeedbackStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
            const { error } = await supabase
                .from(TABLE_NAME)
                .update({ status })
                .eq("id", id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Status updated");
        },
        onError: (err) => {
            toast.error("Failed to update: " + err.message);
        },
    });
}

// ── Admin: fetch all user profiles ──────────────────────────────────
export function useAdminUsers() {
    return useQuery({
        queryKey: ["user_profiles", "admin-all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("user_id, full_name, created_at, is_personalized")
                .order("created_at", { ascending: false });

            if (error) throw new Error(error.message);
            return data ?? [];
        },
        staleTime: 60_000, // 1min cache
    });
}

// ── Admin: aggregate stats ──────────────────────────────────────────
export function useAdminStats() {
    const feedbacksQuery = useAdminFeedbacks();
    const usersQuery = useAdminUsers();

    const feedbacks = feedbacksQuery.data ?? [];
    const users = usersQuery.data ?? [];

    const totalFeedbacks = feedbacks.length;
    const openCount = feedbacks.filter(f => f.status === "open").length;
    const reviewedCount = feedbacks.filter(f => f.status === "reviewed").length;
    const resolvedCount = feedbacks.filter(f => f.status === "resolved").length;

    // Users who joined in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = users.filter(u => new Date(u.created_at) >= weekAgo).length;

    return {
        isLoading: feedbacksQuery.isLoading || usersQuery.isLoading,
        totalUsers: users.length,
        totalFeedbacks,
        openCount,
        reviewedCount,
        resolvedCount,
        recentUsers,
        personalizedUsers: users.filter(u => u.is_personalized).length,
    };
}
