import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from '@llb/core';
import { Goal, AIGeneratedPlanSlot, getDailyHourBudget, assessGoalRealism, buildMasterPlanPrompt, checkMasterPlan } from '@llb/core';
import { recordGenTime } from '@/components/common/ai-loading-popup';
import { useUserProfile } from '@llb/api';
import { supabase } from '@/lib/supabaseClient';

export function cleanJsonResponse(text: string): string {
    return text
        .replace(/^```json\n?/gm, '')
        .replace(/^```\n?/gm, '')
        .replace(/```$/gm, '')
        .trim();
}

export async function callAI(prompt: string): Promise<AIGeneratedPlanSlot[]> {
    const { data, error } = await supabase.functions.invoke('generate-ai-plan', {
        body: { prompt }
    });

    if (error) {
        console.error('Edge function invocation failed:', error);
        throw new Error(error.message || 'AI Generation Edge Function error');
    }

    if (!data) {
        throw new Error('AI Generation Edge Function returned empty response');
    }

    return data as AIGeneratedPlanSlot[];
}


export function useAiPlanGeneration(user: any) {
    const { profile } = useUserProfile(user);
    const [generating, setGenerating] = useState(false);
    const [tempPlan, setTempPlan] = useState<AIGeneratedPlanSlot[] | null>(null);
    const genStartRef = useRef(0);

    const generatePlan = async (goal: Goal): Promise<AIGeneratedPlanSlot[] | null> => {
        if (!goal || !user) return null;
        setGenerating(true);
        genStartRef.current = Date.now();

        try {
            const budget = getDailyHourBudget(profile);
            const expectedDates = goal.milestones?.length ? goal.milestones.map((m) => m.targetDate) : [goal.endDate];

            // Is the goal achievable in this time? The facts go to the AI, so it plans at an honest pace
            const months = Math.max(0.25, (new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (30.4375 * 86400000));
            const feasibility = assessGoalRealism({ text: `${goal.title || ''} ${goal.name} ${goal.purpose || ''}`, months });

            const prompt = buildMasterPlanPrompt({
                goal,
                profile,
                todayLabel: format(new Date(), 'MMMM d, yyyy'),
                feasibility,
            });
            // Check what comes back against what was asked; one retry with the exact problem if it is unusable
            let planSlots: AIGeneratedPlanSlot[] | null = null;
            let lastIssues: string[] = [];
            for (let attempt = 0; attempt < 2 && !planSlots; attempt++) {
                const retryNote = attempt === 0 ? '' : `\n\nYOUR PREVIOUS ANSWER WAS REJECTED: ${lastIssues.join(' ')} Return exactly ${expectedDates.length} objects, one for each target milestone date, each with a different, specific title.`;
                const raw = await callAI(prompt + retryNote);
                const checked = checkMasterPlan(raw, expectedDates, goal.startDate, budget.max);
                lastIssues = checked.issues;
                if (!checked.fatal) planSlots = checked.slots;
            }
            if (!planSlots) throw new Error('The planner did not return a usable plan. Please try again.');
            recordGenTime(Date.now() - genStartRef.current);
            setTempPlan(planSlots);
            return planSlots;
        } catch (error: any) {
            toast.error('Generation Failed: ' + (error.message || 'Unknown error'));
            return null;
        } finally {
            setGenerating(false);
        }
    };

    const clearTempPlan = () => setTempPlan(null);

    return { generating, tempPlan, setTempPlan, generatePlan, clearTempPlan };
}

