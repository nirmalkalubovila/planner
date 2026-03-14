import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'arcee-ai/trinity-large-preview:free';

function cleanJsonResponse(text: string): string {
    return text
        .replace(/^```json\n?/gm, '')
        .replace(/^```\n?/gm, '')
        .replace(/```$/gm, '')
        .trim();
}

async function callAI(prompt: string): Promise<AIGeneratedPlanSlot[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Legacy Life Builder Planner'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    const rawResult = await response.json();
    if (!response.ok || !rawResult.choices?.[0]?.message?.content) {
        throw new Error(rawResult.error?.message || 'AI response error');
    }

    const cleanJson = cleanJsonResponse(rawResult.choices[0].message.content);
    return JSON.parse(cleanJson) as AIGeneratedPlanSlot[];
}

export function useAiPlanGeneration(user: any) {
    const [generating, setGenerating] = useState(false);
    const [tempPlan, setTempPlan] = useState<AIGeneratedPlanSlot[] | null>(null);

    const generatePlan = async (goal: Goal): Promise<AIGeneratedPlanSlot[] | null> => {
        if (!goal || !user) return null;
        setGenerating(true);

        try {
            const milestoneDatesStr = goal.milestones
                ? goal.milestones.map(m => `- ${m.title}: ${m.targetDate}`).join('\n')
                : `End Date: ${goal.endDate}`;

            const prompt = `
Generate a detailed milestone action plan for achieving a goal.
Goal Name: ${goal.name}
Goal Purpose: ${goal.purpose}
Goal Start Date: ${goal.startDate}
System Current Date: ${format(new Date(), 'MMMM d, yyyy')}

Target Milestone Dates:
${milestoneDatesStr}

User Persona & Preferences:
- Primary Life Focus: ${user?.user_metadata?.primaryLifeFocus || 'Not set'}
- Current Profession: ${user?.user_metadata?.currentProfession || 'Not set'}
- Peak Energy Time: ${user?.user_metadata?.energyPeakTime || 'Morning'}
- Focus Ability: ${user?.user_metadata?.focusAbility || 'normal'}

Based on this, break down the main goal into weighted sub-tasks/sub-goals that need to be accomplished by the end of each milestone period.
Tailor the nature and pacing of the tasks to fit this specific person's profession, life focus, and energy capabilities.
TIMELINE SYNC CRITICAL: Use the "System Current Date" as your reality baseline to understand the exact year and timeframe you are generating this for.

Return an action plan as a JSON array of objects.

CRITICAL INSTRUCTION: DO NOT generate tiny, daily tasks. Instead, generate exactly ONE major SUB-GOAL or SUB-TASK to be accomplished by EACH "Target Milestone Date" listed above. If there are 3 Milestone Dates, you should only return an array with exactly 3 objects. This single sub-goal per milestone should represent the main objective for that entire period.
The "date" field in your JSON must exactly match the YYYY-MM-DD target dates provided in the milestone list.

Each object must have exactly these keys:
{
  "date": "YYYY-MM-DD",
  "dayTask": "string - short title of the major sub-goal/task",
  "description": "string - 1 to 2 sentences detailing what needs to be achieved during this period to hit this sub-goal.",
  "estimatedHours": number - realistic estimated hours needed to complete this milestone's core task (e.g. 8)
}
\nRETURN ONLY PARSABLE JSON ARRAY FORMAT NO MARKDOWN TAGS.
`;
            const planSlots = await callAI(prompt);
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

export { callAI, cleanJsonResponse };
