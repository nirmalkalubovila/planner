import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// react-router-dom import removed — auto-save handles all persistence
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, useSaveWeekPlan, usePrefetchAdjacentWeeks } from '@/api/services/planner-service';
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
    const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
    const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);
    const [idToDeleteFromLibrary, setIdToDeleteFromLibrary] = useState<string | null>(null);
    // Save status for toolbar indicator: 'idle' | 'saving' | 'saved'
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Edit states
    const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
    const [editingTaskData, setEditingTaskData] = useState<any>(null);
    const [editingTaskCell, setEditingTaskCell] = useState<{ dayIdx: number, slotIdx: number } | null>(null);

    // History for Undo/Redo
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Auto-save timer ref
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: goals } = useGetGoals();
    const { data: libraryTasks } = useGetCustomTasks();
    const { data: missedLibraryTasks } = useGetMissedTasks();
    const deleteLibraryTask = useDeleteCustomTask();
    const deleteMissedTask = useDeleteMissedTask();
    const { user } = useAuth();
    const savePlan = useSaveWeekPlan();

    // Prefetch adjacent weeks for instant navigation
    usePrefetchAdjacentWeeks(currentWeek);

    const updateGridState = (newState: GridState, skipHistory = false) => {
        setLocalGridState(newState);
        if (!skipHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > 50) newHistory.shift();
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }

        // Debounced auto-save: saves 2s after last edit
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            setSaveStatus('saving');
            savePlan.mutate({ week: currentWeek, state: newState }, {
                onSuccess: () => setSaveStatus('saved'),
                onError: () => setSaveStatus('idle'),
            });
        }, 2000);
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, []);

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

    // Only reset history on initial load or WEEK CHANGE, not on auto-save re-fetch
    const lastLoadedWeekRef = useRef<string>('');
    useEffect(() => {
        if (weekPlan) {
            const normalized: GridState = {};
            Object.entries(weekPlan).forEach(([key, val]) => {
                normalized[key.replace(/\s/g, '')] = val as any;
            });
            setLocalGridState(normalized);
            // Only reset history if the week actually changed
            if (lastLoadedWeekRef.current !== currentWeek) {
                lastLoadedWeekRef.current = currentWeek;
                setHistory([normalized]);
                setHistoryIndex(0);
            }
        }
    }, [weekPlan, currentWeek]);

    const activeGoalsForWeek = useMemo(() => {
        return (goals || []).filter((g: Goal) => {
            const startWk = WeekUtils.getWeekFromDate(g.startDate);
            const endWk = WeekUtils.getWeekFromDate(g.endDate);
            return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
        });
    }, [goals, currentWeek]);

    // Pre-compute sleep slots as a Set for O(1) lookups (called 336+ times per render)
    const sleepSlots = useMemo(() => {
        const set = new Set<number>();
        if (!user) return set;
        const sleepStartStr = user.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user.user_metadata?.sleepDuration) || 8;
        const [sH, sM] = sleepStartStr.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const durationSlots = Math.round(sleepDuration * 2);
        for (let i = 0; i < durationSlots; i++) {
            set.add((startSlot + i) % SLOTS_PER_DAY);
        }
        return set;
    }, [user]);

    const isSleepSlot = useCallback((slotIdx: number) => sleepSlots.has(slotIdx), [sleepSlots]);

    // Pre-compute plan slot Set for O(1) lookups
    const planSlotKeys = useMemo(() => {
        const set = new Set<string>();
        if (!user) return set;
        const planDay = user.user_metadata?.planDay || 'Sunday';
        const planStartTimeStr = user.user_metadata?.planStartTime || '21:00';
        const durationSlots = Number(user.user_metadata?.planDurationPacks) || 2;
        const targetDayIdx = FULL_DAYS.indexOf(planDay);
        if (targetDayIdx === -1) return set;
        const [pH, pM] = planStartTimeStr.split(':').map(Number);
        const startSlot = pH * 2 + (pM >= 30 ? 1 : 0);
        for (let s = startSlot; s < startSlot + durationSlots; s++) {
            set.add(`${targetDayIdx}-${s}`);
        }
        return set;
    }, [user]);

    const isPlanSlot = useCallback((dayIdx: number, slotIdx: number) => planSlotKeys.has(`${dayIdx}-${slotIdx}`), [planSlotKeys]);

    // Pre-compute habit slot map for O(1) lookups
    const habitSlotMap = useMemo(() => {
        const map = new Map<string, string>(); // key -> habit name
        (habits || []).forEach((h: Habit) => {
            const [hStartH, hStartM] = h.startTime.split(':').map(Number);
            const [hEndH, hEndM] = h.endTime.split(':').map(Number);
            const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
            const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
            const habitStartMonth = h.startDate ? h.startDate.substring(0, 7) : null;
            const hasStarted = habitStartMonth ? WeekUtils.compareWeeks(currentWeek, habitStartMonth) >= 0 : true;
            if (!hasStarted) return;
            for (let d = 0; d < 7; d++) {
                if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(FULL_DAYS[d])) continue;
                for (let s = startSlot; s < endSlot; s++) {
                    map.set(`${d}-${s}`, h.name);
                }
            }
        });
        return map;
    }, [habits, currentWeek]);

    const isHabitSlot = useCallback((dayIdx: number, slotIdx: number) => habitSlotMap.has(`${dayIdx}-${slotIdx}`), [habitSlotMap]);

    // Pre-compute full cell content map — one pass for all 336 cells
    const cellContentMap = useMemo(() => {
        const map = new Map<string, any>();
        for (let d = 0; d < 7; d++) {
            for (let s = 0; s < SLOTS_PER_DAY; s++) {
                const key = `${d}-${s}`;
                if (sleepSlots.has(s)) {
                    map.set(key, { type: 'sleep', name: 'Sleep' });
                } else if (planSlotKeys.has(key)) {
                    map.set(key, { type: 'plan', name: 'Weekly Planning' });
                } else if (habitSlotMap.has(key)) {
                    map.set(key, { type: 'habit', name: habitSlotMap.get(key) });
                } else if (localGridState[key]) {
                    map.set(key, localGridState[key]);
                }
            }
        }
        return map;
    }, [sleepSlots, planSlotKeys, habitSlotMap, localGridState]);

    const getCellContent = useCallback((dayIdx: number, slotIdx: number) => {
        return cellContentMap.get(`${dayIdx}-${slotIdx}`) || null;
    }, [cellContentMap]);

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
            toast.error(`Cannot allocate ${hours} h.Need ${requiredSlots} blocks, but only ${totalEmptySlots} blocks empty.`);
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
                    name: targetGoal.title || targetGoal.name,
                    goalId: targetGoal.id
                };
                slotsToAllocate--;
            }
            d = (d + 1) % 7;
        }

        updateGridState(newState);
        setIsGoalToolDialogOpen(false);
        toast.success(`Allocated ${hours} hours for "${targetGoal.title || targetGoal.name}"!`);
    };



    const handleCustomTaskConfirm = (data: any) => {
        const newState = { ...localGridState };
        const [sH, sM] = data.startTime.split(':').map(Number);
        const [eH, eM] = data.endTime.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

        let canAdd = true;
        const conflictDetails: string[] = [];
        if (data.daysOfWeek && data.daysOfWeek.length > 0) {
            data.daysOfWeek.forEach((dayName: string) => {
                const dayIdx = FULL_DAYS.indexOf(dayName);
                if (dayIdx !== -1) {
                    for (let i = startSlot; i < endSlot; i++) {
                        if (i >= SLOTS_PER_DAY) continue;
                        const key = `${dayIdx}-${i}`;
                        if (isSleepSlot(i)) {
                            canAdd = false;
                            conflictDetails.push(`${dayName}: Sleep`);
                        } else if (isHabitSlot(dayIdx, i)) {
                            canAdd = false;
                            conflictDetails.push(`${dayName}: Habit`);
                        } else if (isPlanSlot(dayIdx, i)) {
                            canAdd = false;
                            conflictDetails.push(`${dayName}: Planning`);
                        } else if (newState[key]) {
                            canAdd = false;
                            conflictDetails.push(`${dayName}: ${newState[key].name}`);
                        }
                    }
                }
            });
        }

        if (!canAdd) {
            const uniqueConflicts = [...new Set(conflictDetails)];
            toast.error(`Cannot add task. Conflicts: ${uniqueConflicts.slice(0, 3).join(', ')}${uniqueConflicts.length > 3 ? '...' : ''}`);
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
                            name: data.name,
                            color: data.color
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

    return (
        <div className={cn(
            "flex flex-col h-full w-full overflow-hidden",
            selectedTool === 'erase' && "cursor-[url('https://api.iconify.design/lucide:eraser.svg?color=%23ef4444'),_auto]",
            selectedTool === 'goal' && "cursor-crosshair",
            selectedTool === 'duplicate' && (copiedTask ? "cursor-alias" : "cursor-copy")
        )}>
            <div className="w-full flex-1 flex flex-row min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
                    <PlannerGrid
                        currentWeek={currentWeek}
                        setCurrentWeek={setCurrentWeek}
                        localGridState={localGridState}
                        setLocalGridState={updateGridState}
                        isSleepSlot={isSleepSlot}
                        isHabitSlot={isHabitSlot}
                        isPlanSlot={isPlanSlot}
                        getCellContent={getCellContent}
                        handleCellClick={handleCellClick}
                    />
                </div>

                <PlannerToolbar
                    selectedTool={selectedTool}
                    setSelectedTool={setSelectedTool}
                    onClear={() => setShowClearConfirm(true)}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    saveStatus={saveStatus}
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
            </div>

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
