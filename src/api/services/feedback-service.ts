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
    consent_to_show?: boolean;
    // Joined from user_profiles (admin only)
    user_email?: string;
    user_name?: string;
}

// ── User: submit feedback ──────────────────────────────────────────
export function useSubmitFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { 
            category: FeedbackCategory; 
            subject: string; 
            message: string; 
            rating?: number;
            author_name?: string | null;
            author_position?: string | null;
            consent_to_show?: boolean;
        }) => {
            const userId = await getCurrentUserId();
            
            const { error } = await supabase
                .from(TABLE_NAME)
                .insert({
                    user_id: userId,
                    category: data.category,
                    subject: data.subject,
                    message: data.message,
                    rating: data.rating ?? 5,
                    author_name: data.author_name || null,
                    author_position: data.author_position || null,
                    consent_to_show: data.consent_to_show ?? false
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

export interface UserActivity {
    user_id: string;
    email: string;
    full_name: string;
    created_at: string;
    is_personalized: boolean;
    goals_count: number;
    habits_count: number;
    week_plans_count: number;
    completed_days_count: number;
    last_active_at: string | null;
    recent_goals: { name: string; start_date: string; created_at: string }[];
}

export function useAdminUsersActivity() {
    return useQuery({
        queryKey: ["user_profiles", "admin-activity"],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc("get_admin_user_activity");

            if (error) throw new Error(error.message);
            return (data ?? []) as UserActivity[];
        },
        staleTime: 30_000, // 30s cache
    });
}

// ── Engagement tier helpers ─────────────────────────────────────────
export type EngagementTier = 'power' | 'active' | 'casual' | 'dormant';

export function getUserEngagementTier(user: UserActivity): EngagementTier {
    const now = new Date();
    const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
    const daysSinceActive = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000)) : Infinity;

    const hasDepth = user.goals_count >= 3 && user.completed_days_count >= 5;
    const hasBasicUsage = user.goals_count >= 1 || user.habits_count >= 1;

    if (hasDepth && daysSinceActive <= 7) return 'power';
    if (hasBasicUsage && daysSinceActive <= 14) return 'active';
    if (daysSinceActive <= 30) return 'casual';
    return 'dormant';
}

export const TIER_META: Record<EngagementTier, { label: string; color: string; bgColor: string; borderColor: string }> = {
    power:   { label: 'Power User',  color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    active:  { label: 'Active',      color: 'text-blue-400',    bgColor: 'bg-blue-500/10',    borderColor: 'border-blue-500/20' },
    casual:  { label: 'Casual',      color: 'text-amber-400',   bgColor: 'bg-amber-500/10',   borderColor: 'border-amber-500/20' },
    dormant: { label: 'Dormant',     color: 'text-red-400',     bgColor: 'bg-red-500/10',     borderColor: 'border-red-500/20' },
};

// ── Admin: aggregate stats (advanced analytics) ─────────────────────
export function useAdminStats() {
    const feedbacksQuery = useAdminFeedbacks();
    const usersQuery = useAdminUsers();
    const activityQuery = useAdminUsersActivity();

    const feedbacks = feedbacksQuery.data ?? [];
    const users = usersQuery.data ?? [];
    const activity = activityQuery.data ?? [];

    const now = new Date();
    const totalUsers = users.length;
    const totalActivity = activity.length;

    // ── Basic feedback stats ──
    const actionableFeedbacks = feedbacks.filter(f => f.category !== 'About Legacy Life Builder');
    const totalFeedbacks = actionableFeedbacks.length;
    const openCount = actionableFeedbacks.filter(f => f.status === "open").length;
    const reviewedCount = actionableFeedbacks.filter(f => f.status === "reviewed").length;
    const resolvedCount = actionableFeedbacks.filter(f => f.status === "resolved").length;
    const bugReports = actionableFeedbacks.filter(f => f.category === 'Bug Report').length;
    const featureRequests = actionableFeedbacks.filter(f => f.category === 'Feature Request').length;

    // ── Users who joined in the last 7 days ──
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = users.filter(u => new Date(u.created_at) >= weekAgo).length;

    // ── Feature adoption ──
    const withGoals = activity.filter(u => u.goals_count > 0).length;
    const withHabits = activity.filter(u => u.habits_count > 0).length;
    const withPlans = activity.filter(u => u.week_plans_count > 0).length;
    const withCompletions = activity.filter(u => u.completed_days_count > 0).length;

    const featureAdoption = {
        goals:       { count: withGoals,       pct: totalActivity > 0 ? Math.round((withGoals / totalActivity) * 100) : 0 },
        habits:      { count: withHabits,      pct: totalActivity > 0 ? Math.round((withHabits / totalActivity) * 100) : 0 },
        planner:     { count: withPlans,        pct: totalActivity > 0 ? Math.round((withPlans / totalActivity) * 100) : 0 },
        completions: { count: withCompletions,  pct: totalActivity > 0 ? Math.round((withCompletions / totalActivity) * 100) : 0 },
    };

    // ── Average depth metrics ──
    const avgGoals = totalActivity > 0 ? +(activity.reduce((s, u) => s + u.goals_count, 0) / totalActivity).toFixed(1) : 0;
    const avgHabits = totalActivity > 0 ? +(activity.reduce((s, u) => s + u.habits_count, 0) / totalActivity).toFixed(1) : 0;
    const avgPlans = totalActivity > 0 ? +(activity.reduce((s, u) => s + u.week_plans_count, 0) / totalActivity).toFixed(1) : 0;

    // ── Most used feature ──
    const featureScores = [
        { name: 'Goals', score: withGoals },
        { name: 'Habits', score: withHabits },
        { name: 'Planner', score: withPlans },
        { name: 'Task Completion', score: withCompletions },
    ];
    const mostUsedFeature = featureScores.reduce((best, f) => f.score > best.score ? f : best, featureScores[0]).name;

    // ── Engagement tiers ──
    const tiers = { power: 0, active: 0, casual: 0, dormant: 0 };
    for (const u of activity) {
        tiers[getUserEngagementTier(u)]++;
    }

    // ── Active users (7d and 14d) ──
    const activeUsers7d = activity.filter(u => {
        if (!u.last_active_at) return false;
        return (now.getTime() - new Date(u.last_active_at).getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const activeUsers14d = activity.filter(u => {
        if (!u.last_active_at) return false;
        return (now.getTime() - new Date(u.last_active_at).getTime()) <= 14 * 24 * 60 * 60 * 1000;
    }).length;

    const engagementRate = totalUsers > 0 ? Math.round((activeUsers7d / totalUsers) * 100) : 0;

    // ── Engagement funnel ──
    const personalizedCount = users.filter(u => u.is_personalized).length;
    const funnel = {
        signedUp:      totalUsers,
        personalized:  personalizedCount,
        createdGoal:   withGoals,
        active7d:      activeUsers7d,
    };

    // ── Weekly signup velocity (last 4 weeks) ──
    const weeklySignups: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const label = `W-${i}`;
        const count = users.filter(u => {
            const d = new Date(u.created_at);
            return d >= start && d < end;
        }).length;
        weeklySignups.push({ week: label, count });
    }

    // ── Growth projection ──
    const growthTarget = 50;
    const avgWeeklySignups = weeklySignups.length > 0
        ? weeklySignups.reduce((s, w) => s + w.count, 0) / weeklySignups.length
        : 0;
    const remaining = Math.max(0, growthTarget - activeUsers7d);
    const weeksToTarget = avgWeeklySignups > 0 ? Math.ceil(remaining / avgWeeklySignups) : null;

    return {
        isLoading: feedbacksQuery.isLoading || usersQuery.isLoading || activityQuery.isLoading,
        // Basic
        totalUsers,
        totalFeedbacks,
        openCount,
        reviewedCount,
        resolvedCount,
        recentUsers,
        personalizedUsers: personalizedCount,
        bugReports,
        featureRequests,
        // Advanced
        activeUsers7d,
        activeUsers14d,
        engagementRate,
        featureAdoption,
        avgGoals,
        avgHabits,
        avgPlans,
        mostUsedFeature,
        tiers,
        funnel,
        weeklySignups,
        growthTarget,
        remaining,
        weeksToTarget,
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
            consent_to_show?: boolean;
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
    maintenance_mode: boolean;
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
