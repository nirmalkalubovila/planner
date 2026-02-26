import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lightbulb, ExternalLink, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, useSaveWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetGoals } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { WeekUtils } from '@/utils/week-utils';
import { GridState, Goal, Habit, CustomTask } from '@/types/global-types';
import { useGetCustomTasks, useDeleteCustomTask } from '@/api/services/custom-task-service';

// Modular Components
import { PlannerToolbar } from './components/planner-toolbar';
import { PlannerGrid } from './components/planner-grid';
import { CustomTaskDialog } from './forms/custom-task-dialog';
import { GoalToolDialog } from './forms/goal-tool-dialog';
import { TaskEditDialog } from './forms/task-edit-dialog';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS_PER_DAY = 48; // 30-min slots for 24 hours

export const PlannerPage: React.FC = () => {
    const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
    const [selectedTool, setSelectedTool] = useState<'erase' | 'goal' | 'duplicate' | null>(null);
    const [copiedTask, setCopiedTask] = useState<any>(null);
    const [showTipsDialog, setShowTipsDialog] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [localGridState, setLocalGridState] = useState<GridState>({});

    // AI Generate states
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewPlan, setPreviewPlan] = useState<any[] | null>(null);
    const navigate = useNavigate();

    // Dialog States
    const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
    const [selectedLibraryTask, setSelectedLibraryTask] = useState<CustomTask | null>(null);
    const [isGoalToolDialogOpen, setIsGoalToolDialogOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
    const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
    const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);
    const [idToDeleteFromLibrary, setIdToDeleteFromLibrary] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Edit states
    const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
    const [editingTaskData, setEditingTaskData] = useState<any>(null);
    const [editingTaskCell, setEditingTaskCell] = useState<{ dayIdx: number, slotIdx: number } | null>(null);

    // History for Undo/Redo
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: goals } = useGetGoals();
    const { data: libraryTasks } = useGetCustomTasks();
    const deleteLibraryTask = useDeleteCustomTask();
    const { user } = useAuth();
    const savePlan = useSaveWeekPlan();

    const updateGridState = (newState: GridState, skipHistory = false) => {
        setLocalGridState(newState);
        setHasUnsavedChanges(true);
        if (!skipHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > 50) newHistory.shift();
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setLocalGridState(history[prevIndex]);
            setHistoryIndex(prevIndex);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setLocalGridState(history[nextIndex]);
            setHistoryIndex(nextIndex);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedTool(null);
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]);

    useEffect(() => {
        if (weekPlan) {
            const normalized: GridState = {};
            Object.entries(weekPlan).forEach(([key, val]) => {
                normalized[key.replace(/\s/g, '')] = val as any;
            });
            setLocalGridState(normalized);
            setHistory([normalized]);
            setHistoryIndex(0);
            setHasUnsavedChanges(false);
        }
    }, [weekPlan]);

    const activeGoalsForWeek = useMemo(() => {
        return (goals || []).filter((g: Goal) => {
            const startWk = WeekUtils.getWeekFromDate(g.startDate);
            const endWk = WeekUtils.getWeekFromDate(g.endDate);
            return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
        });
    }, [goals, currentWeek]);

    const isSleepSlot = (slotIdx: number) => {
        if (!user) return false;
        const sleepStartStr = user.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user.user_metadata?.sleepDuration) || 8;
        const [sH, sM] = sleepStartStr.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const durationSlots = Math.round(sleepDuration * 2);
        const endSlot = (startSlot + durationSlots) % SLOTS_PER_DAY;
        if (startSlot < endSlot) return slotIdx >= startSlot && slotIdx < endSlot;
        return slotIdx >= startSlot || slotIdx < endSlot;
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

    const getAvailableTimeBlocks = () => {
        const blocks: string[] = [];
        for (let d = 0; d < 7; d++) {
            let currentBlockStart: number | null = null;
            for (let s = 0; s < SLOTS_PER_DAY; s++) {
                const isFree = !isSleepSlot(s) && !isHabitSlot(d, s) && !localGridState[`${d}-${s}`];
                if (isFree && currentBlockStart === null) {
                    currentBlockStart = s;
                } else if (!isFree && currentBlockStart !== null) {
                    const startH = Math.floor(currentBlockStart / 2).toString().padStart(2, '0');
                    const startM = currentBlockStart % 2 === 0 ? '00' : '30';
                    const endH = Math.floor(s / 2).toString().padStart(2, '0');
                    const endM = s % 2 === 0 ? '00' : '30';
                    blocks.push(`${FULL_DAYS[d]}: ${startH}:${startM} - ${endH}:${endM}`);
                    currentBlockStart = null;
                }
            }
            if (currentBlockStart !== null) {
                const startH = Math.floor(currentBlockStart / 2).toString().padStart(2, '0');
                const startM = currentBlockStart % 2 === 0 ? '00' : '30';
                blocks.push(`${FULL_DAYS[d]}: ${startH}:${startM} - 24:00`);
            }
        }
        return blocks.join('\n');
    };

    const handleGenerateWeeklyPlan = async () => {
        if (!selectedGoalId || !user) {
            toast.error("Please select a goal first!");
            return;
        }
        const targetGoal = activeGoalsForWeek.find(g => g.id === selectedGoalId);
        if (!targetGoal) return;

        setIsGenerating(true);
        setPreviewPlan(null);

        try {
            const meta = user.user_metadata || {};
            const habitStr = (habits || []).map((h: Habit) => `- ${h.name}: ${h.startTime} to ${h.endTime}`).join('\n');
            const milestonesStr = targetGoal.milestones ? targetGoal.milestones.map((m: any) => `- ${m.title}`).join('\n') : targetGoal.purpose;

            const availableBlocks = getAvailableTimeBlocks();

            // Extract existing goal tasks
            const existingTasksForGoal = Object.values(localGridState)
                .filter(slot => slot.type === 'goal' && (!selectedGoalId || slot.goalId === selectedGoalId))
                .map(slot => slot.name)
                .filter((v, i, a) => a.indexOf(v) === i); // Unique names

            const existingTasksStr = existingTasksForGoal.length > 0
                ? `Already planned tasks (DO NOT duplicate these concepts): ${existingTasksForGoal.join(', ')}`
                : "No tasks planned yet.";

            const prompt = `
Generate a weekly structured schedule of tasks for this goal.
Goal Name: ${targetGoal.name}
Goal Purpose: ${targetGoal.purpose}
Milestones/Sub-goals to target:
${milestonesStr}

User Constraints & Preferences:
- Minimum task block: ${meta.minTaskTime || 30} minutes
- Maximum task block: ${meta.maxTaskTime || 2} hours
- Focus Ability: ${meta.focusAbility || 'Very Low'}
- Task Shifting Ability: ${meta.taskShifting || 'Very Low'}
- Free Time Required: ${meta.freeTimeHours ? meta.freeTimeHours + ' hours per week' : '0 hours'}

${existingTasksStr}

Available Time Blocks (You MUST STRICTLY schedule ONLY within these free periods):
${availableBlocks || "No free time available."}

Create tasks step-by-step aligned with milestones. 
For "free" type blocks, allocate relaxation/break time as required.

Output format(Strict JSON array):
[
    {
        "dayIdx": number(0 to 6),
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "taskName": "string - short title",
        "description": "string",
        "type": "goal" | "free"
    }
]
RETURN RAW JSON ARRAY ONLY. NO MARKDOWN, NO EXPLANATION. THIS IS FOR AN API PARSER.
            `;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey} `,
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

            const contentMessage = rawResult.choices[0]?.message?.content || "";
            let cleanJson = contentMessage.trim();
            // Try to extract just the array part if markdown is present
            const firstBracket = cleanJson.indexOf('[');
            const lastBracket = cleanJson.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
            } else {
                // Fallback basic markdown removal
                cleanJson = cleanJson.replace(/```json/gi, '').replace(/```/g, '').trim();
            }

            const planSlots = JSON.parse(cleanJson);
            setPreviewPlan(planSlots);
            setIsGoalToolDialogOpen(false);
        } catch (error: any) {
            console.error('Failed to generate weekly plan', error);
            toast.error('Failed to generate plan: ' + error.message);
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
        updateGridState(newState);
        setPreviewPlan(null);
    };

    const handleSave = useCallback(async () => {
        try {
            await savePlan.mutateAsync({ week: currentWeek, state: localGridState });
            setHasUnsavedChanges(false);
            return true;
        } catch (error) {
            console.error("Failed to auto-save:", error);
            return false;
        }
    }, [savePlan, currentWeek, localGridState]);

    // Navigation Blocker Logic
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowUnsavedConfirm(true);
        }
    }, [blocker.state]);

    const handleCustomTaskConfirm = (data: any) => {
        const newState = { ...localGridState };
        const [sH, sM] = data.startTime.split(':').map(Number);
        const [eH, eM] = data.endTime.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

        let canAdd = true;
        if (data.daysOfWeek && data.daysOfWeek.length > 0) {
            data.daysOfWeek.forEach((dayName: string) => {
                const dayIdx = FULL_DAYS.indexOf(dayName);
                if (dayIdx !== -1) {
                    for (let i = startSlot; i < endSlot; i++) {
                        if (i >= SLOTS_PER_DAY) continue;
                        if (isSleepSlot(i) || isHabitSlot(dayIdx, i) || newState[`${dayIdx}-${i}`]) {
                            canAdd = false;
                        }
                    }
                }
            });
        }

        if (!canAdd) {
            toast.error('Cannot make it happen. The selected time block is already reserved by Sleep, Habits, or another Task.');
            return;
        }

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
        updateGridState(newState);
    };

    const handleDeleteLibraryTask = (id: string) => {
        setIdToDeleteFromLibrary(id);
        setShowLibraryDeleteConfirm(true);
    };

    const executeLibraryDelete = () => {
        if (idToDeleteFromLibrary) {
            deleteLibraryTask.mutate(idToDeleteFromLibrary);
            setIdToDeleteFromLibrary(null);
            setShowLibraryDeleteConfirm(false);
        }
    };


    const handleTaskEditSave = (data: any) => {
        if (!editingTaskCell) return;
        const key = `${editingTaskCell.dayIdx}-${editingTaskCell.slotIdx}`;
        const newState = { ...localGridState };
        newState[key] = {
            ...newState[key],
            ...data
        };
        updateGridState(newState);
        setIsTaskEditDialogOpen(false);
    };

    const handleTaskDelete = () => {
        setShowTaskDeleteConfirm(true);
    };

    const executeTaskDelete = () => {
        if (!editingTaskCell) return;
        const key = `${editingTaskCell.dayIdx}-${editingTaskCell.slotIdx}`;
        const newState = { ...localGridState };
        delete newState[key];
        updateGridState(newState);
        setIsTaskEditDialogOpen(false);
        setShowTaskDeleteConfirm(false);
    };

    const handleCellClick = (dayIdx: number, slotIdx: number) => {
        const key = `${dayIdx}-${slotIdx}`;
        if (isSleepSlot(slotIdx) || isHabitSlot(dayIdx, slotIdx)) return;

        const newState = { ...localGridState };
        const existing = newState[key];

        if (!selectedTool) {
            if (existing) {
                setEditingTaskData({ ...existing });
                setEditingTaskCell({ dayIdx, slotIdx });
                setIsTaskEditDialogOpen(true);
            }
            return;
        }

        if (selectedTool === 'erase') {
            delete newState[key];
        } else if (selectedTool === 'goal') {
            let previewName = '';
            if (previewPlan) {
                const previewSlot = previewPlan.find(slot => {
                    if (slot.dayIdx !== dayIdx) return false;
                    const [sH, sM] = slot.startTime.split(':').map(Number);
                    const [eH, eM] = slot.endTime.split(':').map(Number);
                    const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
                    const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);
                    return slotIdx >= startSlot && slotIdx < endSlot;
                });
                if (previewSlot) previewName = previewSlot.taskName;
            }

            if (!selectedGoalId && (!existing || existing.type !== 'goal')) {
                toast.error("Please select a goal first!");
                return;
            }

            if (existing && existing.type === 'goal' && existing.name && (!selectedGoalId || existing.goalId === selectedGoalId)) {
                return;
            }

            newState[key] = {
                type: 'goal',
                name: (existing && existing.name) ? existing.name : (previewName || 'Goal Work'),
                goalId: selectedGoalId || (existing && (existing as any).goalId)
            };
        } else if (selectedTool === 'duplicate') {
            if (existing) {
                // Pick up the task
                setCopiedTask({ ...existing });
            } else if (copiedTask) {
                // Paste the task
                newState[key] = { ...copiedTask };
            }
        }
        updateGridState(newState);
    };

    const getCellContent = (dayIdx: number, slotIdx: number) => {
        if (previewPlan) {
            const previewSlot = previewPlan.find(slot => {
                if (slot.dayIdx !== dayIdx) return false;
                const [sH, sM] = slot.startTime.split(':').map(Number);
                const [eH, eM] = slot.endTime.split(':').map(Number);
                const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
                const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);
                return slotIdx >= startSlot && slotIdx < endSlot;
            });
            if (previewSlot) {
                return {
                    type: previewSlot.type === 'free' ? 'preview-free' : 'preview',
                    name: previewSlot.taskName
                };
            }
        }
        if (isSleepSlot(slotIdx)) return { type: 'sleep', name: 'Sleep' };
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
        return localGridState[`${dayIdx}-${slotIdx}`];
    };

    return (
        <div className={cn(
            "flex flex-col h-full w-full",
            selectedTool === 'erase' && "cursor-[url('https://api.iconify.design/lucide:eraser.svg?color=%23ef4444'),_auto]",
            selectedTool === 'goal' && "cursor-crosshair",
            selectedTool === 'duplicate' && (copiedTask ? "cursor-alias" : "cursor-copy")
        )}>
            <PlannerToolbar
                currentWeek={currentWeek}
                setCurrentWeek={setCurrentWeek}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                onClear={() => setShowClearConfirm(true)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onSave={handleSave}
                onCreateCustomTask={(task: CustomTask | undefined) => {
                    setSelectedLibraryTask(task || null);
                    setIsCustomTaskDialogOpen(true);
                }}
                libraryTasks={libraryTasks || []}
                previewPlan={previewPlan}
                onCancelPreview={() => setPreviewPlan(null)}
                commitPreviewPlan={commitPreviewPlan}
                onGoalToolClick={() => setIsGoalToolDialogOpen(true)}
                onShowTips={() => setShowTipsDialog(true)}
            />

            {/* Centered Tips Dialog */}
            {showTipsDialog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card border shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm">
                                    <Lightbulb size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Expert Planner Tips</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Master your schedule</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowTipsDialog(false)} className="rounded-full h-10 w-10 hover:bg-muted">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                                    <Info size={18} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="font-bold text-base">1. Smart Habit Overlaps</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        When building goal tasks with AI, always create your <span className="text-foreground font-semibold">Goals & recurring Habits</span> first.
                                        The AI detects these blocks and intelligently builds your plan around them to avoid conflicts.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                                    <ExternalLink size={18} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-bold text-base">2. Set Your Preferences</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Defining your unique constraints (sleep, work hours, breaks) allows the AI to craft a plan that truly reflects your lifestyle instead of a generic one.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="h-10 px-6 rounded-xl font-bold border-primary/20 hover:bg-primary/5 text-primary flex items-center gap-2 group"
                                        onClick={() => {
                                            setShowTipsDialog(false);
                                            navigate('/profile');
                                        }}
                                    >
                                        Configure Profile <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-muted/5 border-t flex justify-end">
                            <Button
                                variant="secondary"
                                className="px-8 rounded-xl font-bold hover:bg-muted"
                                onClick={() => setShowTipsDialog(false)}
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                onDelete={handleDeleteLibraryTask}
                initialData={selectedLibraryTask}
            />

            <TaskEditDialog
                isOpen={isTaskEditDialogOpen}
                onClose={() => setIsTaskEditDialogOpen(false)}
                onSave={handleTaskEditSave}
                onDelete={handleTaskDelete}
                initialData={editingTaskData}
            />

            <div className="w-full flex-1 flex flex-col min-h-0">
                <PlannerGrid
                    currentWeek={currentWeek}
                    localGridState={localGridState}
                    setLocalGridState={updateGridState}
                    isSleepSlot={isSleepSlot}
                    isHabitSlot={isHabitSlot}
                    getCellContent={getCellContent}
                    handleCellClick={handleCellClick}
                />
            </div>

            <ConfirmationDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    updateGridState({});
                    setShowClearConfirm(false);
                }}
                title="Clear Entire Plan?"
                description="This will permanently erase all scheduled goal tasks and custom blocks for the current week. This action cannot be undone unless you have a previous state in history."
                confirmText="Clear Plan"
                cancelText="Keep Plan"
                variant="destructive"
            />

            <ConfirmationDialog
                isOpen={showUnsavedConfirm}
                onClose={() => {
                    setShowUnsavedConfirm(false);
                    if (blocker.state === "blocked") blocker.reset();
                }}
                onConfirm={async () => {
                    const success = await handleSave();
                    if (success && blocker.state === "blocked") {
                        blocker.proceed();
                    }
                    setShowUnsavedConfirm(false);
                }}
                title="Unsaved Planner Changes"
                description="You have unsaved changes in your planner. Would you like to save them before leaving?"
                confirmText="Save & Leave"
                cancelText="Discard & Leave"
                onCancel={() => {
                    setShowUnsavedConfirm(false);
                    if (blocker.state === "blocked") blocker.proceed();
                }}
            />

            <ConfirmationDialog
                isOpen={showTaskDeleteConfirm}
                onClose={() => setShowTaskDeleteConfirm(false)}
                onConfirm={executeTaskDelete}
                title="Delete Task Slot?"
                description="Are you sure you want to remove this specific task slot? This will only remove this single 30-minute block."
                confirmText="Delete Slot"
                variant="destructive"
            />

            <ConfirmationDialog
                isOpen={showLibraryDeleteConfirm}
                onClose={() => setShowLibraryDeleteConfirm(false)}
                onConfirm={executeLibraryDelete}
                title="Remove from Library?"
                description="Are you sure you want to remove this task from your library? This will not remove existing tasks from your planner grid, but you won't be able to quickly schedule it again."
                confirmText="Remove Task"
                variant="destructive"
            />
        </div>
    );
};
