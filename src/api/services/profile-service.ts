import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/api/helpers/auth-helpers";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const TABLE_NAME = "user_profiles";

export interface UserProfile {
    fullName: string;
    dob: string;
    sleepStart: string;
    sleepDuration: string;
    weekStart: string;
    planDay: string;
    planStartTime: string;
    planEndTime: string;
    primaryLifeFocus: string;
    currentProfession: string;
    energyPeakTime: string;
    focusAbility: string;
    taskShiftingAbility: string;
    isPersonalized: boolean;
    avatarUrl: string;
}

const DEFAULTS: UserProfile = {
    fullName: "",
    dob: "",
    sleepStart: "22:00",
    sleepDuration: "8",
    weekStart: "Monday",
    planDay: "Sunday",
    planStartTime: "21:00",
    planEndTime: "22:00",
    primaryLifeFocus: "",
    currentProfession: "",
    energyPeakTime: "Morning",
    focusAbility: "normal",
    taskShiftingAbility: "normal",
    isPersonalized: false,
    avatarUrl: "",
};

function metaToProfile(meta: Record<string, unknown> | null): Partial<UserProfile> {
    if (!meta) return {};
    const res: Partial<UserProfile> = {};
    if (meta.full_name !== null && meta.full_name !== undefined) res.fullName = meta.full_name as string;
    if (meta.fullName !== null && meta.fullName !== undefined) res.fullName = meta.fullName as string;
    if (meta.dob !== null && meta.dob !== undefined) res.dob = meta.dob as string;
    if (meta.sleepStart !== null && meta.sleepStart !== undefined) res.sleepStart = meta.sleepStart as string;
    if (meta.sleepDuration !== null && meta.sleepDuration !== undefined) res.sleepDuration = meta.sleepDuration as string;
    if (meta.weekStart !== null && meta.weekStart !== undefined) res.weekStart = meta.weekStart as string;
    if (meta.planDay !== null && meta.planDay !== undefined) res.planDay = meta.planDay as string;
    if (meta.planStartTime !== null && meta.planStartTime !== undefined) res.planStartTime = meta.planStartTime as string;
    if (meta.planEndTime !== null && meta.planEndTime !== undefined) res.planEndTime = meta.planEndTime as string;
    if (meta.primaryLifeFocus !== null && meta.primaryLifeFocus !== undefined) res.primaryLifeFocus = meta.primaryLifeFocus as string;
    if (meta.currentProfession !== null && meta.currentProfession !== undefined) res.currentProfession = meta.currentProfession as string;
    if (meta.energyPeakTime !== null && meta.energyPeakTime !== undefined) res.energyPeakTime = meta.energyPeakTime as string;
    
    if (meta.focusAbility !== null && meta.focusAbility !== undefined) {
        const focus = (meta.focusAbility as string).toLowerCase();
        res.focusAbility = focus === "normal" ? "normal" : focus === "high" ? "high" : focus === "low" ? "low" : focus;
    }
    if (meta.taskShiftingAbility !== null && meta.taskShiftingAbility !== undefined) {
        const shifting = (meta.taskShiftingAbility as string).toLowerCase();
        res.taskShiftingAbility = shifting === "fast" || shifting === "high" ? "high" : shifting === "slow" || shifting === "low" ? "low" : "normal";
    }
    
    if (meta.isPersonalized !== null && meta.isPersonalized !== undefined) res.isPersonalized = meta.isPersonalized as boolean;
    if (meta.avatar_url !== null && meta.avatar_url !== undefined) res.avatarUrl = meta.avatar_url as string;
    if (meta.avatarUrl !== null && meta.avatarUrl !== undefined) res.avatarUrl = meta.avatarUrl as string;
    return res;
}

function dbRowToProfile(row: Record<string, unknown> | null): Partial<UserProfile> {
    if (!row) return {};
    const res: Partial<UserProfile> = {};
    if (row.full_name !== null && row.full_name !== undefined) res.fullName = row.full_name as string;
    if (row.dob !== null && row.dob !== undefined) res.dob = row.dob as string;
    if (row.sleep_start !== null && row.sleep_start !== undefined) res.sleepStart = row.sleep_start as string;
    if (row.sleep_duration !== null && row.sleep_duration !== undefined) res.sleepDuration = row.sleep_duration as string;
    if (row.week_start !== null && row.week_start !== undefined) res.weekStart = row.week_start as string;
    if (row.plan_day !== null && row.plan_day !== undefined) res.planDay = row.plan_day as string;
    if (row.plan_start_time !== null && row.plan_start_time !== undefined) res.planStartTime = row.plan_start_time as string;
    if (row.plan_end_time !== null && row.plan_end_time !== undefined) res.planEndTime = row.plan_end_time as string;
    if (row.primary_life_focus !== null && row.primary_life_focus !== undefined) res.primaryLifeFocus = row.primary_life_focus as string;
    if (row.current_profession !== null && row.current_profession !== undefined) res.currentProfession = row.current_profession as string;
    if (row.energy_peak_time !== null && row.energy_peak_time !== undefined) res.energyPeakTime = row.energy_peak_time as string;
    
    if (row.focus_ability !== null && row.focus_ability !== undefined) {
        const focus = (row.focus_ability as string).toLowerCase();
        res.focusAbility = focus === "normal" ? "normal" : focus === "high" ? "high" : focus === "low" ? "low" : focus;
    }
    if (row.task_shifting_ability !== null && row.task_shifting_ability !== undefined) {
        const shifting = (row.task_shifting_ability as string).toLowerCase();
        res.taskShiftingAbility = shifting === "fast" || shifting === "high" ? "high" : shifting === "slow" || shifting === "low" ? "low" : "normal";
    }
    
    if (row.is_personalized !== null && row.is_personalized !== undefined) res.isPersonalized = row.is_personalized as boolean;
    if (row.avatar_url !== null && row.avatar_url !== undefined) res.avatarUrl = row.avatar_url as string;
    return res;
}

function mergeProfile(...sources: Partial<UserProfile>[]): UserProfile {
    const merged = { ...DEFAULTS };
    for (const src of sources) {
        for (const [k, v] of Object.entries(src)) {
            if (v !== undefined && v !== null) {
                (merged as Record<string, unknown>)[k] = v;
            }
        }
    }
    return merged;
}

async function fetchUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    if (!data) return null;
    return dbRowToProfile(data);
}

export function useUserProfile(user: User | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [TABLE_NAME, user?.id],
        queryFn: () => fetchUserProfile(user!.id),
        enabled: !!user?.id,
    });

    const profile: Partial<UserProfile> | null = query.data ?? null;

    const mergedProfile = user
        ? mergeProfile(DEFAULTS, metaToProfile(user.user_metadata as Record<string, unknown>), profile ?? {})
        : null;

    const saveMutation = useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            const userId = await getCurrentUserId();
            const row: Record<string, unknown> = {
                user_id: userId,
                updated_at: new Date().toISOString(),
            };
            if (updates.fullName !== undefined) row.full_name = updates.fullName;
            if (updates.dob !== undefined) row.dob = updates.dob;
            if (updates.sleepStart !== undefined) row.sleep_start = updates.sleepStart;
            if (updates.sleepDuration !== undefined) row.sleep_duration = updates.sleepDuration;
            if (updates.weekStart !== undefined) row.week_start = updates.weekStart;
            if (updates.planDay !== undefined) row.plan_day = updates.planDay;
            if (updates.planStartTime !== undefined) row.plan_start_time = updates.planStartTime;
            if (updates.planEndTime !== undefined) row.plan_end_time = updates.planEndTime;
            if (updates.primaryLifeFocus !== undefined) row.primary_life_focus = updates.primaryLifeFocus;
            if (updates.currentProfession !== undefined) row.current_profession = updates.currentProfession;
            if (updates.energyPeakTime !== undefined) row.energy_peak_time = updates.energyPeakTime;
            if (updates.focusAbility !== undefined) row.focus_ability = updates.focusAbility;
            if (updates.taskShiftingAbility !== undefined) row.task_shifting_ability = updates.taskShiftingAbility;
            if (updates.isPersonalized !== undefined) row.is_personalized = updates.isPersonalized;
            if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;

            const { data: existing, error: fetchErr } = await supabase
                .from(TABLE_NAME)
                .select("id")
                .eq("user_id", userId)
                .maybeSingle();

            if (fetchErr) throw new Error(fetchErr.message);

            let error;
            if (existing) {
                const { error: err } = await supabase
                    .from(TABLE_NAME)
                    .update(row)
                    .eq("user_id", userId);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from(TABLE_NAME)
                    .insert(row);
                error = err;
            }

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
        },
        onError: (err) => {
            toast.error("Failed to save profile: " + err.message);
        },
    });

    return {
        profile: mergedProfile,
        isLoading: query.isLoading,
        saveProfile: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
    };
}
