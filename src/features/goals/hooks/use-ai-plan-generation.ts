import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { recordGenTime } from '@/components/common/ai-loading-popup';
import { useUserProfile } from '@/api/services/profile-service';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

/** Free-tier Gemini models for text generation, ordered by preference. Try next on quota/rate-limit. */
const GEMINI_FREE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];

function isQuotaOrRetryableError(err: unknown): boolean {
    const msg = String(err instanceof Error ? err.message : err).toLowerCase();
    return (
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('resource exhausted') ||
        msg.includes('429') ||
        msg.includes('not found') ||
        msg.includes('not supported')
    );
}

function cleanJsonResponse(text: string): string {
    return text
        .replace(/^```json\n?/gm, '')
        .replace(/^```\n?/gm, '')
        .replace(/```$/gm, '')
        .trim();
}

function isGeminiKey(key: string): boolean {
    return key?.startsWith('AIza');
}

async function callNativeGemini(prompt: string, apiKey: string, model: string): Promise<AIGeneratedPlanSlot[]> {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
    });

    const rawResult = await response.json();
    const text = rawResult.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!response.ok || !text) {
        throw new Error(rawResult.error?.message || 'Gemini API error');
    }

    const cleanJson = cleanJsonResponse(text);
    return JSON.parse(cleanJson) as AIGeneratedPlanSlot[];
}

async function callOpenRouter(prompt: string, apiKey: string, model: string): Promise<AIGeneratedPlanSlot[]> {
    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Legacy Life Builder Planner'
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    const rawResult = await response.json();
    const text = rawResult.choices?.[0]?.message?.content;
    if (!response.ok || !text) {
        throw new Error(rawResult.error?.message || 'OpenRouter API error');
    }

    const cleanJson = cleanJsonResponse(text);
    return JSON.parse(cleanJson) as AIGeneratedPlanSlot[];
}

async function callAI(prompt: string): Promise<AIGeneratedPlanSlot[]> {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!geminiKey && !openRouterKey) {
        throw new Error('Missing API key. Add VITE_GEMINI_API_KEY or VITE_OPENROUTER_API_KEY to .env');
    }

    if (geminiKey && isGeminiKey(geminiKey)) {
        let lastError: Error | null = null;
        for (const model of GEMINI_FREE_MODELS) {
            try {
                return await callNativeGemini(prompt, geminiKey, model);
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (isQuotaOrRetryableError(err)) continue;
                throw lastError;
            }
        }
        if (openRouterKey) {
            try {
                return await callOpenRouter(prompt, openRouterKey, OPENROUTER_MODEL);
            } catch (openRouterErr) {
                throw openRouterErr;
            }
        }
        throw lastError ?? new Error('All Gemini models failed');
    }

    if (openRouterKey) {
        const model = import.meta.env.VITE_AI_MODEL ?? OPENROUTER_MODEL;
        return await callOpenRouter(prompt, openRouterKey, model);
    }

    throw new Error('No valid API key found');
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
Goal Name: ${goal.name}
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

export { callAI, cleanJsonResponse };
