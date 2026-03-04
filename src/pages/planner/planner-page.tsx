import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, useSaveWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetGoals } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { WeekUtils } from '@/utils/week-utils';
import { GridState, Goal, Habit, CustomTask } from '@/types/global-types';
import { useGetCustomTasks, useDeleteCustomTask } from '@/api/services/custom-task-service';
import { useGetMissedTasks, useDeleteMissedTask } from '@/api/services/missed-task-service';

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
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [localGridState, setLocalGridState] = useState<GridState>({});

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
    const { data: missedLibraryTasks } = useGetMissedTasks();
    const deleteLibraryTask = useDeleteCustomTask();
    const deleteMissedTask = useDeleteMissedTask();
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

    const isPlanSlot = (dayIdx: number, slotIdx: number) => {
        if (!user) return false;
        const planDay = user.user_metadata?.planDay || 'Sunday';
        const planStartTimeStr = user.user_metadata?.planStartTime || '21:00';
        const durationSlots = Number(user.user_metadata?.planDurationPacks) || 2;

        const targetDayIdx = FULL_DAYS.indexOf(planDay);
        if (dayIdx !== targetDayIdx) return false;

        const [pH, pM] = planStartTimeStr.split(':').map(Number);
        const startSlot = pH * 2 + (pM >= 30 ? 1 : 0);
        const endSlot = startSlot + durationSlots;

        return slotIdx >= startSlot && slotIdx < endSlot;
    };

    // removed getAvailableTimeBlocks as it is no longer needed

    const handleAllocateGoalTime = (goalId: string, hours: number) => {
        const requiredSlots = Math.round(hours * 2);
        const targetGoal = activeGoalsForWeek.find(g => g.id === goalId);
        if (!targetGoal) return;

        // Find empty slots
        const emptySlotsGroupedByDay: { dayIdx: number, slotIdx: number }[][] = [[], [], [], [], [], [], []];
        let totalEmptySlots = 0;

        for (let d = 0; d < 7; d++) {
            for (let s = 0; s < SLOTS_PER_DAY; s++) {
                if (!isSleepSlot(s) && !isHabitSlot(d, s) && !isPlanSlot(d, s) && !localGridState[`${d}-${s}`]) {
                    emptySlotsGroupedByDay[d].push({ dayIdx: d, slotIdx: s });
                    totalEmptySlots++;
                }
            }
        }

        if (totalEmptySlots < requiredSlots) {
            toast.error(`Cannot allocate ${hours}h. Need ${requiredSlots} blocks, but only ${totalEmptySlots} blocks empty.`);
            return;
        }

        const newState = { ...localGridState };
        let slotsToAllocate = requiredSlots;

        // Spread them out evenly across days sequentially
        let loopProtect = 0;
        let d = 0;
        while (slotsToAllocate > 0 && loopProtect < 1000) {
            loopProtect++;
            if (emptySlotsGroupedByDay[d].length > 0) {
                const slot = emptySlotsGroupedByDay[d].shift()!;
                newState[`${slot.dayIdx}-${slot.slotIdx}`] = {
                    type: 'goal',
                    name: targetGoal.name,
                    goalId: targetGoal.id
                };
                slotsToAllocate--;
            }
            d = (d + 1) % 7;
        }

        updateGridState(newState);
        setIsGoalToolDialogOpen(false);
        toast.success(`Allocated ${hours} hours for "${targetGoal.name}"!`);
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
                        if (isSleepSlot(i) || isHabitSlot(dayIdx, i) || isPlanSlot(dayIdx, i) || newState[`${dayIdx}-${i}`]) {
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
            // Check both libraries (simple approach)
            deleteLibraryTask.mutate(idToDeleteFromLibrary);
            deleteMissedTask.mutate(idToDeleteFromLibrary);
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
        if (isSleepSlot(slotIdx) || isHabitSlot(dayIdx, slotIdx) || isPlanSlot(dayIdx, slotIdx)) return;

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
            // Empty now without preview logic

            if (!selectedGoalId && (!existing || existing.type !== 'goal')) {
                toast.error("Please select a goal first!");
                return;
            }

            if (existing && existing.type === 'goal' && existing.name && (!selectedGoalId || existing.goalId === selectedGoalId)) {
                return;
            }

            newState[key] = {
                type: 'goal',
                name: (existing && existing.name) ? existing.name : 'Goal Work',
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
        if (isSleepSlot(slotIdx)) return { type: 'sleep', name: 'Sleep' };
        if (isPlanSlot(dayIdx, slotIdx)) return { type: 'plan', name: 'Weekly Planning' };
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
            "flex flex-col h-full w-full overflow-hidden",
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
                missedTasks={missedLibraryTasks || []}
                previewPlan={null}
                onCancelPreview={() => { }}
                commitPreviewPlan={() => { }}
                onGoalToolClick={() => setIsGoalToolDialogOpen(true)}
            />

            <GoalToolDialog
                isOpen={isGoalToolDialogOpen}
                onClose={() => setIsGoalToolDialogOpen(false)}
                activeGoals={activeGoalsForWeek}
                selectedGoalId={selectedGoalId}
                setSelectedGoalId={setSelectedGoalId}
                onAllocate={handleAllocateGoalTime}
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
                    isPlanSlot={isPlanSlot}
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
