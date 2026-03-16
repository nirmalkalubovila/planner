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
};

function metaToProfile(meta: Record<string, unknown> | null): Partial<UserProfile> {
    if (!meta) return {};
    return {
        fullName: (meta.full_name as string) ?? "",
        dob: (meta.dob as string) ?? "",
        sleepStart: (meta.sleepStart as string) ?? "22:00",
        sleepDuration: (meta.sleepDuration as string) ?? "8",
        weekStart: (meta.weekStart as string) ?? "Monday",
        planDay: (meta.planDay as string) ?? "Sunday",
        planStartTime: (meta.planStartTime as string) ?? "21:00",
        planEndTime: (meta.planEndTime as string) ?? "22:00",
        primaryLifeFocus: (meta.primaryLifeFocus as string) ?? "",
        currentProfession: (meta.currentProfession as string) ?? "",
        energyPeakTime: (meta.energyPeakTime as string) ?? "Morning",
        focusAbility: (meta.focusAbility as string) ?? "normal",
        taskShiftingAbility: (meta.taskShiftingAbility as string) ?? "normal",
        isPersonalized: (meta.isPersonalized as boolean) ?? false,
    };
}

function dbRowToProfile(row: Record<string, unknown> | null): Partial<UserProfile> {
    if (!row) return {};
    return {
        fullName: (row.full_name as string) ?? "",
        dob: (row.dob as string) ?? "",
        sleepStart: (row.sleep_start as string) ?? "22:00",
        sleepDuration: (row.sleep_duration as string) ?? "8",
        weekStart: (row.week_start as string) ?? "Monday",
        planDay: (row.plan_day as string) ?? "Sunday",
        planStartTime: (row.plan_start_time as string) ?? "21:00",
        planEndTime: (row.plan_end_time as string) ?? "22:00",
        primaryLifeFocus: (row.primary_life_focus as string) ?? "",
        currentProfession: (row.current_profession as string) ?? "",
        energyPeakTime: (row.energy_peak_time as string) ?? "Morning",
        focusAbility: (row.focus_ability as string) ?? "normal",
        taskShiftingAbility: (row.task_shifting_ability as string) ?? "normal",
        isPersonalized: (row.is_personalized as boolean) ?? false,
    };
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

    const profile: UserProfile | null = query.data ?? null;

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

            const { error } = await supabase.from(TABLE_NAME).upsert(row, {
                onConflict: "user_id",
            });

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
