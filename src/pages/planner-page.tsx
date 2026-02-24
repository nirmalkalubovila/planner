import React, { useState, useEffect, useMemo } from 'react';
import { useGetWeekPlan, useSaveWeekPlan, useClearWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetGoals } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { WeekUtils } from '@/utils/week-utils';
import { GridState, Goal, Habit, CustomTask } from '@/types/global-types';
import { PlannerToolbar } from '@/components/planner/planner-toolbar';
import { PlannerGrid } from '@/components/planner/planner-grid';
import { CustomTaskDialog } from '@/components/planner/custom-task-dialog';
import { useGetCustomTasks } from '@/api/services/custom-task-service';
import { GoalToolDialog } from '@/components/planner/goal-tool-dialog';

const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS_PER_DAY = 48; // 30-min slots for 24 hours

export const PlannerPage: React.FC = () => {
    const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
    const [selectedTool, setSelectedTool] = useState<'erase' | 'goal'>('erase');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [localGridState, setLocalGridState] = useState<GridState>({});

    // AI Generate states
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewPlan, setPreviewPlan] = useState<any[] | null>(null);

    // Custom Task Dialog
    const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
    const [selectedLibraryTask, setSelectedLibraryTask] = useState<CustomTask | null>(null);
    const [isGoalToolDialogOpen, setIsGoalToolDialogOpen] = useState(false);

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: goals } = useGetGoals();
    const { data: libraryTasks } = useGetCustomTasks();
    const { user } = useAuth();

    const savePlan = useSaveWeekPlan();
    const clearPlan = useClearWeekPlan();

    useEffect(() => {
        if (weekPlan) {
            setLocalGridState(weekPlan);
        }
    }, [weekPlan]);

    const activeGoalsForWeek = useMemo(() => {
        return (goals || []).filter((g: Goal) => {
            const startWk = WeekUtils.getWeekFromDate(g.startDate);
            const endWk = WeekUtils.getWeekFromDate(g.endDate);
            return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
        });
    }, [goals, currentWeek]);

    const activeGoal = useMemo(() => activeGoalsForWeek.find((g: Goal) => g.id === selectedGoalId), [activeGoalsForWeek, selectedGoalId]);

    const goalStats = useMemo(() => {
        if (!activeGoal) return null;

        // Calculate currently allocated slots for this goal this week
        let allocatedSlots = 0;
        Object.values(localGridState).forEach(slot => {
            if (slot.type === 'goal' && slot.goalId === selectedGoalId) {
                allocatedSlots++;
            }
        });

        return {
            title: activeGoal.name,
            allocatedSlots,
        };
    }, [activeGoal, localGridState, selectedGoalId]);

    const isSleepSlot = (slotIdx: number) => {
        if (!user) return false;
        const sleepStartStr = user.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user.user_metadata?.sleepDuration) || 8;

        const [sH, sM] = sleepStartStr.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const durationSlots = Math.round(sleepDuration * 2);
        const endSlot = (startSlot + durationSlots) % SLOTS_PER_DAY;

        if (startSlot < endSlot) {
            return slotIdx >= startSlot && slotIdx < endSlot;
        } else {
            return slotIdx >= startSlot || slotIdx < endSlot;
        }
    };

    const handleGenerateWeeklyPlan = async () => {
        if (!selectedGoalId || !user) {
            alert("Please select a goal first!");
            return;
        }

        const targetGoal = activeGoalsForWeek.find(g => g.id === selectedGoalId);
        if (!targetGoal) return;

        setIsGenerating(true);
        setPreviewPlan(null);

        try {
            const meta = user.user_metadata || {};
            const sleepStartStr = meta.sleepStart || '22:00';
            const sleepDuration = Number(meta.sleepDuration) || 8;

            const habitStr = (habits || []).map((h: Habit) => `- ${h.name}: ${h.startTime} to ${h.endTime}`).join('\n');
            const milestonesStr = activeGoal.milestones ? activeGoal.milestones.map((m: any) => `- ${m.title}`).join('\n') : activeGoal.purpose;

            const prompt = `
Generate a weekly structured schedule of tasks for achieving this goal.
Goal Name: ${activeGoal.name}
Goal Purpose: ${activeGoal.purpose}
Milestones/Sub-goals to target:
${milestonesStr}

User Constraints & Preferences:
- Minimum task block: ${meta.minTaskTime || 30} minutes
- Maximum task block: ${meta.maxTaskTime || 2} hours
- Sleep Schedule (UNAVAILABLE): ${sleepStartStr} (Duration: ${sleepDuration}h)
- Free Time Required: ${meta.freeTimeHours ? meta.freeTimeHours + ' hours per week' : '0 hours'}
- Habits (UNAVAILABLE):
${habitStr || 'None'}

Rules:
1. Schedule tasks over 7 days (dayIdx: 0 = Monday, dayIdx: 6 = Sunday).
2. Times MUST be in HH:00 or HH:30 increments (e.g., 09:00, 14:30).
3. DO NOT overlap with Sleep or Habits.
4. Distribute workload realistically without overloading the user. 
5. The JSON must return exactly an array of objects.

Output format (Strict JSON array):
[
  {
    "dayIdx": number (0 to 6),
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "taskName": "string - short title",
    "description": "string",
    "type": "goal" | "free"
  }
]
RETURN ONLY PARSABLE JSON ARRAY FORMAT NO MARKDOWN TAGS.
            `;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Legacy Life Builder Planner'
                },
                body: JSON.stringify({
                    model: "arcee-ai/trinity-large-preview:free",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            const rawResult = await response.json();
            if (!response.ok || rawResult.error) throw new Error(rawResult.error?.message || 'OpenRouter API Error');

            const contentMessage = rawResult.choices[0]?.message?.content;
            let cleanJson = contentMessage.replace(/^```json\n?/gm, '').replace(/```$/gm, '').trim();
            cleanJson = cleanJson.replace(/^```\n?/gm, '').replace(/```$/gm, '').trim();

            const planSlots = JSON.parse(cleanJson);
            setPreviewPlan(planSlots);
            setIsGoalToolDialogOpen(false); // Close dialog after generation
        } catch (error: any) {
            console.error('Failed to generate weekly plan', error);
            alert('Failed to generate plan: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const commitPreviewPlan = () => {
        if (!previewPlan) return;
        const newState = { ...localGridState };

        previewPlan.forEach(slot => {
            const [sH, sM] = slot.startTime.split(':').map(Number);
            const [eH, eM] = slot.endTime.split(':').map(Number);

            const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
            const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

            for (let i = startSlot; i < endSlot; i++) {
                if (i >= SLOTS_PER_DAY) continue;
                newState[`${slot.dayIdx}-${i}`] = {
                    type: slot.type === 'free' ? 'custom' : 'goal',
                    name: slot.taskName,
                    goalId: slot.type === 'goal' ? selectedGoalId : undefined
                };
            }
        });

        setLocalGridState(newState);
        setPreviewPlan(null);
    };

    const handleCustomTaskConfirm = (data: any) => {
        const newState = { ...localGridState };

        const [sH, sM] = data.startTime.split(':').map(Number);
        const [eH, eM] = data.endTime.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

        if (data.daysOfWeek && data.daysOfWeek.length > 0) {
            data.daysOfWeek.forEach((dayName: string) => {
                const dayIdx = FULL_DAYS.indexOf(dayName);
                if (dayIdx !== -1) {
                    for (let i = startSlot; i < endSlot; i++) {
                        if (i >= SLOTS_PER_DAY) continue;
                        newState[`${dayIdx}-${i}`] = {
                            type: 'custom',
                            name: data.name
                        };
                    }
                }
            });
        }

        setLocalGridState(newState);
    };

    const isHabitSlot = (dayIdx: number, slotIdx: number) => {
        return (habits || []).some((h: Habit) => {
            if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(FULL_DAYS[dayIdx])) return false;

            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);

            const habitStartMonth = h.startDate ? h.startDate.substring(0, 7) : null;
            const hasStarted = habitStartMonth ? WeekUtils.compareWeeks(currentWeek, habitStartMonth) >= 0 : true;
            return hasStarted && slotIdx >= startSlot && slotIdx < endSlot;
        });
    };

    const handleCellClick = (dayIdx: number, slotIdx: number) => {
        const key = `${dayIdx}-${slotIdx}`;

        if (isSleepSlot(slotIdx) || isHabitSlot(dayIdx, slotIdx)) return;

        const newState = { ...localGridState };
        if (selectedTool === 'erase') {
            delete newState[key];
        } else if (selectedTool === 'goal') {
            if (!selectedGoalId) {
                alert("Please select a goal first!");
                return;
            }
            newState[key] = { type: 'goal', name: 'Goal Work', goalId: selectedGoalId };
        }
        setLocalGridState(newState);
    };

    const getCellContent = (dayIdx: number, slotIdx: number) => {
        // Priority 0: AI Preview Overlay
        if (previewPlan) {
            const previewSlot = previewPlan.find(slot => {
                if (slot.dayIdx !== dayIdx) return false;
                const [sH, sM] = slot.startTime.split(':').map(Number);
                const [eH, eM] = slot.endTime.split(':').map(Number);
                const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
                const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);
                return slotIdx >= startSlot && slotIdx < endSlot;
            });
            if (previewSlot) return { type: 'preview', name: previewSlot.taskName };
        }

        // Priority 1: Sleep (Static)
        if (isSleepSlot(slotIdx)) return { type: 'sleep', name: 'Sleep' };

        // Priority 2: Habit (Static)
        const habit = (habits || []).find((h: Habit) => {
            if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(FULL_DAYS[dayIdx])) return false;

            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
            const habitStartMonth = h.startDate ? h.startDate.substring(0, 7) : null;
            const hasStarted = habitStartMonth ? WeekUtils.compareWeeks(currentWeek, habitStartMonth) >= 0 : true;
            return hasStarted && slotIdx >= startSlot && slotIdx < endSlot;
        });
        if (habit) return { type: 'habit', name: habit.name };

        // Priority 3: Planned Session
        return localGridState[`${dayIdx}-${slotIdx}`];
    };

    return (
        <div className="flex flex-col h-full w-full">
            <PlannerToolbar
                currentWeek={currentWeek}
                setCurrentWeek={setCurrentWeek}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                selectedGoalId={selectedGoalId}
                setSelectedGoalId={setSelectedGoalId}
                activeGoalsForWeek={activeGoalsForWeek}
                activeGoal={activeGoal}
                goalStats={goalStats}
                isGenerating={isGenerating}
                handleGenerateWeeklyPlan={handleGenerateWeeklyPlan}
                onClear={() => clearPlan.mutate(currentWeek)}
                onSave={() => savePlan.mutate({ week: currentWeek, state: localGridState })}
                onCreateCustomTask={(task) => {
                    setSelectedLibraryTask(task || null);
                    setIsCustomTaskDialogOpen(true);
                }}
                libraryTasks={libraryTasks || []}
                previewPlan={previewPlan}
                onCancelPreview={() => setPreviewPlan(null)}
                commitPreviewPlan={commitPreviewPlan}
            />

            <GoalToolDialog
                isOpen={isGoalToolDialogOpen}
                onClose={() => setIsGoalToolDialogOpen(false)}
                activeGoals={activeGoalsForWeek}
                selectedGoalId={selectedGoalId}
                setSelectedGoalId={setSelectedGoalId}
                isGenerating={isGenerating}
                onGenerate={handleGenerateWeeklyPlan}
            />

            <CustomTaskDialog
                isOpen={isCustomTaskDialogOpen}
                onClose={() => {
                    setIsCustomTaskDialogOpen(false);
                    setSelectedLibraryTask(null);
                }}
                onConfirm={handleCustomTaskConfirm}
                initialData={selectedLibraryTask}
            />

            <div className="w-full flex-1 flex flex-col min-h-0">
                <PlannerGrid
                    currentWeek={currentWeek}
                    localGridState={localGridState}
                    setLocalGridState={setLocalGridState}
                    previewPlan={previewPlan}
                    setPreviewPlan={setPreviewPlan}
                    commitPreviewPlan={commitPreviewPlan}
                    isSleepSlot={isSleepSlot}
                    isHabitSlot={isHabitSlot}
                    getCellContent={getCellContent}
                    handleCellClick={handleCellClick}
                />
            </div>
        </div>
    );
};
