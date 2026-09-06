import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '../supabase-client';
import { toast } from '@llb/core';

export type AiProvider = 'anthropic' | 'openai' | 'gemini';

export interface AiSettings {
    provider: AiProvider | null;
    model: string | null;
    hasApiKey: boolean;
    chatAssistantEnabled: boolean;
    autoWeeklyPlanning: boolean;
}

const EMPTY_SETTINGS: AiSettings = {
    provider: null,
    model: null,
    hasApiKey: false,
    chatAssistantEnabled: false,
    autoWeeklyPlanning: false,
};

/** Whether the current user has connected their own AI (Claude/ChatGPT/Gemini). */
export function useGetAiSettings() {
    return useQuery({
        queryKey: ['ai_settings'],
        queryFn: async (): Promise<AiSettings> => {
            const { data, error } = await supabase.rpc('get_user_ai_settings').maybeSingle();
            if (error) throw new Error(error.message);
            if (!data) return EMPTY_SETTINGS;
            return {
                provider: data.provider,
                model: data.model,
                hasApiKey: data.has_api_key,
                chatAssistantEnabled: data.chat_assistant_enabled,
                autoWeeklyPlanning: data.auto_weekly_planning,
            };
        },
        staleTime: 5 * 60 * 1000,
    });
}

export interface SaveAiSettingsInput {
    provider: AiProvider;
    model?: string;
    /** Omit or pass '' to keep the currently stored key untouched. */
    apiKey?: string;
    chatAssistantEnabled: boolean;
    autoWeeklyPlanning: boolean;
}

/** Connects (or updates) the user's own AI account. The key is encrypted
 *  server-side by the `save-ai-settings` Edge Function -- it never touches
 *  this table directly, since the encryption secret can't live in the client. */
export function useSaveAiSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: SaveAiSettingsInput) => {
            const { data, error } = await supabase.functions.invoke('save-ai-settings', {
                body: {
                    provider: input.provider,
                    model: input.model || null,
                    apiKey: input.apiKey || null,
                    chatAssistantEnabled: input.chatAssistantEnabled,
                    autoWeeklyPlanning: input.autoWeeklyPlanning,
                },
            });
            if (error) throw new Error(error.message || 'Failed to save AI settings');
            if (data?.error) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            toast.success('AI connected.');
            queryClient.invalidateQueries({ queryKey: ['ai_settings'] });
        },
        onError: (err: Error) => {
            toast.error('Failed to save AI settings: ' + err.message);
        },
    });
}

export interface AiPlanBlock {
    date: string;
    startTime: string;
    endTime: string;
    name: string;
    type: 'goal' | 'custom';
    description?: string;
    goalId?: string;
}

export interface PlanWeekWithAiResult {
    blocks: AiPlanBlock[];
    weekDates: string[];
}

/** Asks the user's own connected AI to propose a plan for the given week,
 *  based on their goals, milestones, habits, and sleep schedule. Returns
 *  proposed blocks only -- it does NOT write to the grid. The caller is
 *  expected to merge the result into local grid state and save it through
 *  the normal (undo-able, conflict-safe) planner save path. */
export function usePlanWeekWithAi() {
    return useMutation({
        mutationFn: async (week: string): Promise<PlanWeekWithAiResult> => {
            const { data, error } = await supabase.functions.invoke('ai-plan-week', {
                body: { week },
            });
            if (error) throw new Error(error.message || 'AI planning failed');
            if (data?.error) throw new Error(data.error);
            return data as PlanWeekWithAiResult;
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to plan the week with AI');
        },
    });
}
