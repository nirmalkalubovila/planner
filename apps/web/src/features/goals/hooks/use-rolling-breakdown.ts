import { useEffect, useRef } from 'react';
import { toast, type Goal, type PromptProfile } from '@llb/core';
import { useUpdateGoal } from '@llb/api';
import { ensureRollingBreakdown, needsBreakdown } from '../lib/breakdown-ai';

/**
 * Keeps the rolling breakdown current: when a new month becomes the current one, its weeks are planned
 * automatically the next time Goals opens. It only touches goals that were planned with the automatic
 * breakdown (their phases carry exact period bounds), so older goals never trigger surprise AI calls.
 */
export function useRollingBreakdown(goals: Goal[], profile?: PromptProfile | null) {
    const updateGoal = useUpdateGoal();
    const busy = useRef(false);
    const attempted = useRef(new Set<string>());

    useEffect(() => {
        if (busy.current || !profile) return;
        const due = goals.filter((g) => g.id && g.plans?.[0]?.periodStart && !attempted.current.has(g.id) && needsBreakdown(g));
        if (due.length === 0) return;

        busy.current = true;
        (async () => {
            for (const goal of due) {
                attempted.current.add(goal.id!); // one try per goal per visit, so a failing call cannot loop
                try {
                    const { plans, generated } = await ensureRollingBreakdown(goal, profile);
                    if (generated.length === 0) continue;
                    await updateGoal.mutateAsync({ ...goal, plans });
                    toast.success(`Planned ${generated.join(' and ')} for ${goal.title || goal.name}`);
                } catch {
                    // stays unplanned; the next visit tries again
                }
            }
            busy.current = false;
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goals, profile]);
}
