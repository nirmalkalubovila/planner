import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/api/helpers/auth-helpers";
import { toast } from "sonner";
import { handleFriendlyError } from "@/utils/error-handler";
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
    show_on_landing?: boolean;
    rating?: number;
    author_name?: string | null;
    author_position?: string | null;
    // Joined from user_profiles (admin only)
    user_email?: string;
    user_name?: string;
}

// ── User: submit feedback ──────────────────────────────────────────
export function useSubmitFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { category: FeedbackCategory; subject: string; message: string; rating?: number }) => {
            const userId = await getCurrentUserId();
            
            // Get user's profile metadata for landing testimonials
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("full_name, current_profession")
                .eq("user_id", userId)
                .maybeSingle();

            const { error } = await supabase
                .from(TABLE_NAME)
                .insert({
                    user_id: userId,
                    category: data.category,
                    subject: data.subject,
                    message: data.message,
                    rating: data.rating ?? 5,
                    author_name: profile?.full_name || null,
                    author_position: profile?.current_profession || null
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

// ── Admin: update feedback fields (including rating, name, position, and visibility) ──
export function useAdminUpdateFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { 
            id: string; 
            show_on_landing?: boolean; 
            author_name?: string | null; 
            author_position?: string | null;
            rating?: number;
            status?: FeedbackStatus;
            category?: FeedbackCategory;
        }) => {
            const { id, ...fields } = data;
            const { error } = await supabase
                .from(TABLE_NAME)
                .update(fields)
                .eq("id", id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
            toast.success("Feedback updated successfully");
        },
        onError: (err) => {
            toast.error("Failed to update feedback: " + err.message);
        },
    });
}

// ── Landing Page Settings ──────────────────────────────────────────
export interface LandingPageSettings {
    id: number;
    desktop_video_url: string;
    mobile_video_url: string;
    desktop_gallery: string[];
    mobile_gallery: string[];
    updated_at: string;
}

export function useLandingSettings() {
    return useQuery({
        queryKey: ["landing_page_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("landing_page_settings")
                .select("*")
                .eq("id", 1)
                .maybeSingle();

            if (error) throw new Error(error.message);
            return data as LandingPageSettings | null;
        },
        staleTime: 60_000,
    });
}

export function useUpdateLandingSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<Omit<LandingPageSettings, "id" | "updated_at">>) => {
            const { error } = await supabase
                .from("landing_page_settings")
                .update(settings)
                .eq("id", 1);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["landing_page_settings"] });
            toast.success("Landing page settings saved");
        },
        onError: (err) => {
            handleFriendlyError(err, "Failed to save landing settings");
        },
    });
}

// ── Public: fetch approved landing feedbacks ────────────────────────
export function usePublicFeedbacks() {
    return useQuery({
        queryKey: ["feedbacks", "public-landing"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select("id, category, subject, message, created_at, rating, author_name, author_position")
                .eq("show_on_landing", true)
                .order("created_at", { ascending: false });

            if (error) throw new Error(error.message);
            return data as Omit<Feedback, "user_id" | "user_email" | "user_name" | "status" | "show_on_landing">[];
        },
        staleTime: 60_000,
    });
}
