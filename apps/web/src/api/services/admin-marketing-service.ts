import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type Audience = "all" | "new_7d" | "no_goals" | "dormant_30d";

export const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
    { value: "all", label: "All opted-in users", hint: "Everyone who agreed to marketing emails" },
    { value: "new_7d", label: "New users (7 days)", hint: "Signed up in the last week" },
    { value: "no_goals", label: "No goals yet", hint: "Personalized but never created a goal" },
    { value: "dormant_30d", label: "Dormant (30 days)", hint: "No completed tasks in 30 days" },
];

export interface CampaignProgress {
    campaignId: string;
    total: number;
    sent: number;
    failed: number;
    remaining: number;
    done: boolean;
}

const FUNCTION = "send-marketing-email";

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke(FUNCTION, { body });
    if (error) {
        // Edge function errors carry the JSON body in error.context
        let message = error.message;
        try {
            const ctx = (error as { context?: Response }).context;
            const parsed = ctx ? await ctx.json() : null;
            if (parsed?.error) message = parsed.error;
        } catch { /* keep the generic message */ }
        throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data as T;
}

/** Number of opted-in recipients in an audience (admin-only RPC). */
export function useAudienceCount(audience: Audience) {
    return useQuery({
        queryKey: ["marketing-audience", audience],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_marketing_recipients", { p_audience: audience });
            if (error) throw new Error(error.message);
            return (data ?? []).length;
        },
        staleTime: 30_000,
    });
}

export function useEmailCampaigns() {
    return useQuery({
        queryKey: ["email_campaigns"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("email_campaigns")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);
            if (error) throw new Error(error.message);
            return data ?? [];
        },
        staleTime: 15_000,
    });
}

export const sendTestEmail = (subject: string, body: string) =>
    invoke<{ ok: boolean; sentTo: string }>({ action: "test", subject, body });

/** Starts a campaign and keeps requesting batches until every recipient has been processed. */
export async function runCampaign(
    subject: string,
    body: string,
    audience: Audience,
    onProgress: (p: CampaignProgress) => void,
): Promise<CampaignProgress> {
    let progress = await invoke<CampaignProgress>({ action: "start", subject, body, audience });
    onProgress(progress);
    while (!progress.done) {
        progress = await invoke<CampaignProgress>({ action: "continue", campaignId: progress.campaignId });
        onProgress(progress);
    }
    return progress;
}
