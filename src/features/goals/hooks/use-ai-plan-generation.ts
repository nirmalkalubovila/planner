import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { recordGenTime } from '@/components/common/ai-loading-popup';
import { useUserProfile } from '@/api/services/profile-service';
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
            const milestoneDatesStr = goal.milestones
                ? goal.milestones.map(m => `- ${m.title}: ${m.targetDate}`).join('\n')
                : `End Date: ${goal.endDate}`;

            const prompt = `
Generate a detailed milestone action plan for achieving a goal.
Goal Title: ${goal.title || ''}
Goal Description/Mission: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
System Current Date: ${format(new Date(), 'MMMM d, yyyy')}

Target Milestone Dates:
${milestoneDatesStr}

User Persona & Preferences:
- Primary Life Focus: ${profile?.primaryLifeFocus || user?.user_metadata?.primaryLifeFocus || 'Not set'}
- Current Profession: ${profile?.currentProfession || user?.user_metadata?.currentProfession || 'Not set'}
- Peak Energy Time: ${profile?.energyPeakTime || user?.user_metadata?.energyPeakTime || 'Morning'}
- Focus Ability: ${profile?.focusAbility || user?.user_metadata?.focusAbility || 'normal'}

Based on this, break down the main goal into weighted sub-tasks/sub-goals that need to be accomplished by the end of each milestone period.
Tailor the nature and pacing of the tasks to fit this specific person's profession, life focus, and energy capabilities.
TIMELINE SYNC CRITICAL: Use the "System Current Date" as your reality baseline to understand the exact year and timeframe you are generating this for.

NUMERICAL PROGRESSION & TARGET INTERPOLATION:
If the Goal Title, Description/Mission, or Purpose contains a specific numeric target (e.g., "reach 10k followers", "earn $5000", "lose 10kg", "write 50 pages"), you MUST mathematically interpolate/scale this target across the target milestones.
- Identify the starting baseline if specified (e.g., "currently at 241 followers" or "currently 241 followers"). If not specified, assume 0 or a reasonable starting point.
- Calculate progressive, mathematically realistic numeric targets for each milestone date (e.g., if duration is 6 months and target is 10k followers, Milestone 1: Reach 1k followers, Milestone 2: Reach 2.5k followers, Milestone 3: Reach 4.5k followers, etc. scaling to the final target of 10k).
- You MUST explicitly state the progressive count target in the sub-goal title ("dayTask") and details ("description") for each milestone, reflecting the calculated target for that period.

REALISTIC ESTIMATED HOURS:
- The "estimatedHours" MUST be a highly realistic, non-generic estimation of the cumulative hours required to execute that specific milestone's tasks.
- If the milestone requires significant effort (e.g., creating weeks of content, outreach campaigns, studying, writing), estimate the actual hours required (e.g., 30, 45, 60, or 80 hours depending on complexity and scale) instead of defaulting to a small generic number like 8.

Return an action plan as a JSON array of objects.

CRITICAL INSTRUCTION: DO NOT generate tiny, daily tasks. Instead, generate exactly ONE major SUB-GOAL or SUB-TASK to be accomplished by EACH "Target Milestone Date" listed above. If there are 3 Milestone Dates, you should only return an array with exactly 3 objects. This single sub-goal per milestone should represent the main objective for that entire period.
The "date" field in your JSON must exactly match the YYYY-MM-DD target dates provided in the milestone list.

Each object must have exactly these keys:
{
  "date": "YYYY-MM-DD",
  "dayTask": "string - short title of the major sub-goal/task including progressive target numbers",
  "description": "string - 1 to 2 sentences detailing what needs to be achieved during this period to hit this sub-goal and its target count.",
  "estimatedHours": number - realistic cumulative estimated hours needed to complete this milestone's task (e.g. 45)
}
\nRETURN ONLY PARSABLE JSON ARRAY FORMAT NO MARKDOWN TAGS.
`;
            const planSlots = await callAI(prompt);
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

