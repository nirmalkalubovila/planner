import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from '@llb/core';
import { Goal, AIGeneratedPlanSlot } from '@llb/core';
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

PRAGMATIC STRATEGY RULES (ACT AS AN ELITE PERFORMANCE ARCHITECT):
1. ZERO FLUFF: Do not include motivational quotes, generic encouragement, or vague advice in the title ("dayTask") or details ("description"). Provide only tactical, executable tasks.
2. RESPECT CONSTRAINTS: Rigorously apply the constraints, starting situation, and resource limitations provided by the user. Early phases must focus on bootstrapping, free validation, or skill acquisition if time/money are limited.
3. CURRENCY ALIGNMENT: If a specific currency (e.g., LKR) or metric is provided in the goal parameters, use it for all financial estimations, sub-goal targets, and milestones.
4. METRIC-DRIVEN: Every generated task must have a quantifiable metric or threshold of completion in the title or description that proves the task is complete.

NUMERICAL PROGRESSION & TARGET INTERPOLATION:
If the Goal Title, Description/Mission, or Purpose contains a specific numeric target (e.g., "reach 10k followers", "earn $5000", "lose 10kg", "write 50 pages"), you MUST mathematically interpolate/scale this target across the target milestones.
- Identify the starting baseline if specified (e.g., "currently at 241 followers" or "currently 241 followers"). If not specified, assume 0 or a reasonable starting point.
- Calculate progressive, mathematically realistic numeric targets for each milestone date (e.g., if duration is 6 months and target is 10k followers, Milestone 1: Reach 1k followers, Milestone 2: Reach 2.5k followers, Milestone 3: Reach 4.5k followers, etc. scaling to the final target of 10k).
- You MUST explicitly state the progressive count target in the sub-goal title ("dayTask") and details ("description") for each milestone, reflecting the calculated target for that period.

REALISTIC ESTIMATED HOURS:
- The "estimatedHours" MUST be a highly realistic, non-generic estimation of the cumulative hours required to execute that specific milestone's tasks.
- PRACTICAL HOURLY LIMITS: Do not estimate impractical hours. For any individual, the absolute maximum quality work hours they can spend is 5 hours a day (35 hours a week, 140 hours a month).
- Unless user preferences explicitly specify a different time availability, assume a standard average budget of 3 hours a day, which means exactly 21 hours a week (84 hours a month).
- DYNAMIC ALLOCATION (NEVER HARDCODE): Do NOT assign the exact same constant hours (like 84h or 16h) to every month or week. The estimated hours must dynamically expand or contract based on the complexity, scale, and specific tasks of that period (e.g., some lighter weeks might be 5h or 8h, while heavier action weeks might be 15h or 20h, as long as they stay strictly below the weekly budget cap of 21 hours).
- Ensure all estimated hours at the Year, Month, or Week level are mathematically scaled to stay strictly within these bounds (e.g. a 4-week Month phase must not exceed 84 hours total; a Week phase must not exceed 21 hours total).

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

