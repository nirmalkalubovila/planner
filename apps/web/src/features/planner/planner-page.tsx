import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, usePrefetchAdjacentWeeks, useGetWeekBucketActions } from '@llb/api';
import { useGetGoals } from '@llb/api';
import { useGetHabits } from '@llb/api';
import { usePlanWeekWithAi, type AiPlanBlock } from '@llb/api';
import { WeekUtils, toast } from '@llb/core';
import { Goal, Habit, CustomTask, ReminderItem, PlanSlot, GridState } from '@llb/core';
import { useGetCustomTasks, useDeleteCustomTask } from '@llb/api';
import { useGetMissedTasks, useDeleteMissedTask } from '@llb/api';
import { useNotes, useDeleteNote } from '@llb/api';
import { LIFE_BUCKETS, type LifeBucket } from '@llb/core';

import { PlannerToolbar } from './components/planner-toolbar';
import { PlannerGrid } from './components/planner-grid';
import { SundayFocusDialog } from './forms/sunday-focus-dialog';
import { CustomTaskDialog } from './forms/custom-task-dialog';
import { GoalToolDialog } from './forms/goal-tool-dialog';
import { TaskEditDialog } from './forms/task-edit-dialog';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

import { useLocation } from 'react-router-dom';
import { usePlannerGrid } from './hooks/use-planner-grid';
import { usePlannerHistory } from './hooks/use-planner-history';
import { createPlannerHandlers } from './hooks/use-planner-handlers';

export const PlannerPage: React.FC = () => {
    const location = useLocation();
    const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
    const [selectedTool, setSelectedTool] = useState<'erase' | 'goal' | 'duplicate' | 'drag' | null>(null);
    const [copiedTask, setCopiedTask] = useState<any>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');

    // Dialog states
    const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
    const [selectedLibraryTask, setSelectedLibraryTask] = useState<CustomTask | null>(null);
    const [isGoalToolDialogOpen, setIsGoalToolDialogOpen] = useState(false);
    const [isSundayFocusDialogOpen, setIsSundayFocusDialogOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
    const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);
    const [idToDeleteFromLibrary, setIdToDeleteFromLibrary] = useState<string | null>(null);

    // Auto-open SundayFocusDialog if requested via navigation
    useEffect(() => {
        const state = location.state as any;
        const params = new URLSearchParams(location.search);
        if (state?.openOutcomes || params.get('openOutcomes') === 'true') {
            setIsSundayFocusDialogOpen(true);
        }
    }, [location]);

    // Edit states
    const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
    const [editingTaskData, setEditingTaskData] = useState<any>(null);
    const [editingTaskCell, setEditingTaskCell] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
    const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

    // Data queries
    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: bucketActions = {} } = useGetWeekBucketActions(currentWeek);
    const { data: goals = [] } = useGetGoals();
    const { data: habits = [] } = useGetHabits();
    const { data: libraryTasks } = useGetCustomTasks();
    const { data: missedLibraryTasks } = useGetMissedTasks();
    const { data: notes = [] } = useNotes();
    const deleteLibraryTask = useDeleteCustomTask();
    const deleteMissedTask = useDeleteMissedTask();
    const deleteNote = useDeleteNote();

    usePrefetchAdjacentWeeks(currentWeek);

    // Hooks
    const {
        localGridState, updateGridState, loadWeekPlan,
        handleUndo, handleRedo, canUndo, canRedo, saveStatus,
    } = usePlannerHistory(currentWeek);

    const { isSleepSlot, isHabitSlot, isPlanSlot, getCellContent } = usePlannerGrid(currentWeek, localGridState);

    // AI weekly planning -- see ai-plan-week Edge Function. The AI only
    // proposes blocks; applying them goes through the exact same
    // updateGridState() path as any manual edit, so it autosaves and is
    // one Undo away from being reverted, same as everything else here.
    const planWeekWithAi = usePlanWeekWithAi();
    const [aiPlacedBlocks, setAiPlacedBlocks] = useState<AiPlanBlock[] | null>(null);

    const handlePlanWithAi = async () => {
        try {
            const result = await planWeekWithAi.mutateAsync(currentWeek);

            const weekDates = WeekUtils.getDaysForWeek(currentWeek);
            const dateToDayIdx = new Map<string, number>();
            weekDates.forEach((d, idx) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dateToDayIdx.set(key, idx);
            });

            const newState: GridState = { ...localGridState };
            const placed: AiPlanBlock[] = [];

            for (const block of result.blocks) {
                const dayIdx = dateToDayIdx.get(block.date);
                if (dayIdx === undefined) continue;

                const [startH, startM] = block.startTime.split(':').map(Number);
                const [endH, endM] = block.endTime.split(':').map(Number);
                if (![startH, startM, endH, endM].every(Number.isFinite)) continue;
                const startSlot = Math.floor((startH * 60 + startM) / 30);
                const endSlot = Math.max(startSlot + 1, Math.ceil((endH * 60 + endM) / 30));

                // Never overwrite a slot that's already occupied -- the
                // prompt asks the AI to avoid this too, but this is the
                // guarantee that actually holds regardless of what it returns.
                let hasRoom = true;
                for (let s = startSlot; s < endSlot && s < 48; s++) {
                    if (newState[`${dayIdx}-${s}`]) { hasRoom = false; break; }
                }
                if (!hasRoom) continue;

                for (let s = startSlot; s < endSlot && s < 48; s++) {
                    newState[`${dayIdx}-${s}`] = {
                        type: block.type,
                        name: block.name,
                        description: block.description,
                        goalId: block.goalId,
                    };
                }
                placed.push(block);
            }

            if (placed.length === 0) {
                toast.info("No free time was left to place an AI plan into this week.");
                return;
            }

            updateGridState(newState);
            setAiPlacedBlocks(placed);
            toast.success(`AI planned ${placed.length} block${placed.length === 1 ? '' : 's'} into your free time this week.`);
        } catch {
            // Failure toast already shown by usePlanWeekWithAi's onError.
        }
    };

    const activeGoalsForWeek = useMemo(() => {
        return (goals || []).filter((g: Goal) => {
            const startWk = WeekUtils.getWeekFromDate(g.startDate);
            const endWk = WeekUtils.getWeekFromDate(g.endDate);
            return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
        });
    }, [goals, currentWeek]);

    const combinedBacklog = useMemo<CustomTask[]>(() => {
        const missed = missedLibraryTasks || [];
        const notesAsTasks: CustomTask[] = (notes || [])
            .filter((n) => n.category === 'nextweek')
            .map((n) => ({
                id: `note-${n.id}`,
                name: n.title || 'Untitled Note',
                description: n.content,
                startTime: '09:00',
                endTime: '10:00',
                daysOfWeek: [] as string[]
            }));
        return [...missed, ...notesAsTasks];
    }, [missedLibraryTasks, notes]);

    const handlers = createPlannerHandlers({
        localGridState, updateGridState,
        isSleepSlot, isHabitSlot, isPlanSlot, getCellContent,
        activeGoalsForWeek, selectedTool, selectedGoalId,
        copiedTask, setCopiedTask,
        setEditingTaskData, setEditingTaskCell, setIsTaskEditDialogOpen,
        setIsGoalToolDialogOpen,
    });

    // Load week plan data
    useEffect(() => { loadWeekPlan(weekPlan); }, [weekPlan, loadWeekPlan]);

    // Keyboard shortcuts
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
    }, [handleUndo, handleRedo]);

    const handleDeleteLibraryTask = (id: string) => {
        setIdToDeleteFromLibrary(id);
        setShowLibraryDeleteConfirm(true);
    };

    const executeLibraryDelete = () => {
        if (idToDeleteFromLibrary) {
            if (idToDeleteFromLibrary.startsWith('note-')) {
                const noteId = idToDeleteFromLibrary.replace('note-', '');
                deleteNote.mutate(noteId);
            } else {
                deleteLibraryTask.mutate(idToDeleteFromLibrary);
                deleteMissedTask.mutate(idToDeleteFromLibrary);
            }
            setIdToDeleteFromLibrary(null);
            setShowLibraryDeleteConfirm(false);
        }
    };

    const activeHabitsForWeek = useMemo(() => {
        return (habits || []).filter((h: Habit) => {
            if (!h.startDate) return true;
            const startWk = WeekUtils.getWeekFromDate(h.startDate);
            const endWk = h.endDate ? WeekUtils.getWeekFromDate(h.endDate) : '9999-W52';
            return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
        });
    }, [habits, currentWeek]);

    const allCustomTasks = useMemo(() => {
        const tasksMap = new Map<string, CustomTask>();
        
        // Collect custom tasks currently placed on the planner grid for this week
        Object.entries(localGridState || {}).forEach(([slotKey, rawCell]) => {
            if (slotKey === 'reminders' || !rawCell || typeof rawCell !== 'object' || Array.isArray(rawCell)) return;
            const cell = rawCell as PlanSlot;
            if (cell.name && cell.type === 'custom') {
                const key = cell.name.trim().toLowerCase();
                if (!tasksMap.has(key)) {
                    tasksMap.set(key, {
                        id: `task-${key}`,
                        name: cell.name.trim(),
                        description: cell.description || '',
                        startTime: '09:00',
                        endTime: '10:00',
                        daysOfWeek: [],
                        bucket: cell.bucket,
                    });
                }
            }
        });

        // Collect reminders currently placed on localGridState for this week
        (localGridState?.reminders || []).forEach((r: ReminderItem) => {
            if (r.name) {
                const key = r.name.trim().toLowerCase();
                if (!tasksMap.has(key)) {
                    tasksMap.set(key, {
                        id: r.id || `reminder-${key}`,
                        name: r.name.trim(),
                        description: r.description || '',
                        startTime: r.time || '09:00',
                        endTime: '09:30',
                        daysOfWeek: [],
                        isReminder: true,
                        bucket: r.bucket,
                    });
                }
            }
        });

        return Array.from(tasksMap.values());
    }, [localGridState]);

    const sundayFocusCount = useMemo(() => {
        // Weekly Outcomes are 3 fixed slots (p1/p2/p3) -- see SundayFocusDialog's
        // OUTCOME_SLOTS -- not the 4 LIFE_BUCKETS, which this used to (wrongly)
        // count against, so the toolbar badge never matched the dialog itself.
        return (['p1', 'p2', 'p3'] as const).filter(
            key => !!(bucketActions as any)[key]?.text?.trim()
        ).length;
    }, [bucketActions]);

    return (
        <div className={cn(
            "flex flex-col flex-1 h-full w-full overflow-hidden relative",
            selectedTool === 'erase' && "cursor-[url('https://api.iconify.design/lucide:eraser.svg?color=%23ef4444'),_auto]",
            selectedTool === 'goal' && "cursor-crosshair",
            selectedTool === 'duplicate' && (copiedTask ? "cursor-alias" : "cursor-copy"),
            selectedTool === 'drag' && "cursor-grab active:cursor-grabbing"
        )}>
            <div className="w-full flex-1 flex flex-row min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
                    <PlannerGrid
                        currentWeek={currentWeek}
                        setCurrentWeek={setCurrentWeek}
                        localGridState={localGridState}
                        setLocalGridState={updateGridState}
                        isSleepSlot={isSleepSlot}
                        getCellContent={getCellContent}
                        handleCellClick={handlers.handleCellClick}
                        selectedTool={selectedTool}
                        onEditReminder={(reminder) => {
                            setEditingReminder(reminder);
                            setEditingTaskData({
                                ...reminder,
                                type: 'custom',
                                isReminder: true,
                            });
                            setEditingTaskCell(null);
                            setIsTaskEditDialogOpen(true);
                        }}
                    />
                </div>

                <PlannerToolbar
                    selectedTool={selectedTool}
                    setSelectedTool={setSelectedTool}
                    onClear={() => setShowClearConfirm(true)}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    saveStatus={saveStatus}
                    onCreateCustomTask={(task: CustomTask | undefined) => {
                        setSelectedLibraryTask(task || null);
                        setIsCustomTaskDialogOpen(true);
                    }}
                    libraryTasks={libraryTasks || []}
                    missedTasks={combinedBacklog}
                    previewPlan={aiPlacedBlocks}
                    onCancelPreview={() => {
                        handleUndo();
                        setAiPlacedBlocks(null);
                    }}
                    commitPreviewPlan={() => setAiPlacedBlocks(null)}
                    onGoalToolClick={() => setIsGoalToolDialogOpen(true)}
                    onOpenSundayFocus={() => setIsSundayFocusDialogOpen(true)}
                    sundayFocusCount={sundayFocusCount}
                    onPlanWithAi={handlePlanWithAi}
                    isPlanningWithAi={planWeekWithAi.isPending}
                />
            </div>

            <SundayFocusDialog
                isOpen={isSundayFocusDialogOpen}
                onClose={() => setIsSundayFocusDialogOpen(false)}
                currentWeek={currentWeek}
                existingActions={bucketActions}
                goals={activeGoalsForWeek}
                habits={activeHabitsForWeek}
                customTasks={allCustomTasks}
            />

            <GoalToolDialog
                isOpen={isGoalToolDialogOpen}
                onClose={() => setIsGoalToolDialogOpen(false)}
                activeGoals={activeGoalsForWeek}
                selectedGoalId={selectedGoalId}
                setSelectedGoalId={setSelectedGoalId}
                onAllocate={handlers.handleAllocateGoalTime}
            />

            <CustomTaskDialog
                isOpen={isCustomTaskDialogOpen}
                onClose={() => {
                    setIsCustomTaskDialogOpen(false);
                    setSelectedLibraryTask(null);
                }}
                onConfirm={handlers.handleCustomTaskConfirm}
                onDelete={handleDeleteLibraryTask}
                initialData={selectedLibraryTask}
            />

            <TaskEditDialog
                isOpen={isTaskEditDialogOpen}
                onClose={() => {
                    setIsTaskEditDialogOpen(false);
                    setEditingReminder(null);
                    setEditingTaskCell(null);
                }}
                onSave={(data: any) => {
                    const newState = { ...localGridState };
                    const reminders = [...(newState.reminders || [])] as ReminderItem[];

                    if (editingTaskCell) {
                        const key = `${editingTaskCell.dayIdx}-${editingTaskCell.slotIdx}`;
                        if (data.isReminder) {
                            delete newState[key];
                            reminders.push({
                                id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                name: data.name,
                                description: data.description,
                                time: data.time || '09:00',
                                dayIdx: editingTaskCell.dayIdx,
                                color: '#f43f5e',
                                isReminder: true,
                                bucket: data.bucket,
                            });
                            newState.reminders = reminders;
                        } else {
                            const target = newState[key] || editingTaskData;
                            let start = editingTaskCell.slotIdx;
                            let end = editingTaskCell.slotIdx;

                            if (target && target.name) {
                                while (start > 0) {
                                    const prevKey = `${editingTaskCell.dayIdx}-${start - 1}`;
                                    const prev = newState[prevKey];
                                    if (prev && (prev.name === target.name || (target.goalId && prev.goalId === target.goalId))) {
                                        start--;
                                    } else {
                                        break;
                                    }
                                }
                                while (end < 47) {
                                    const nextKey = `${editingTaskCell.dayIdx}-${end + 1}`;
                                    const next = newState[nextKey];
                                    if (next && (next.name === target.name || (target.goalId && next.goalId === target.goalId))) {
                                        end++;
                                    } else {
                                        break;
                                    }
                                }
                            }

                            for (let s = start; s <= end; s++) {
                                const slotKey = `${editingTaskCell.dayIdx}-${s}`;
                                const updatedSlot = {
                                    ...newState[slotKey],
                                    type: data.type || newState[slotKey]?.type || target?.type || 'custom',
                                    name: data.name,
                                    description: data.description,
                                    goalId: (data.type === 'goal' || target?.type === 'goal') ? data.goalId : undefined,
                                };
                                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) {
                                    updatedSlot.bucket = data.bucket;
                                } else {
                                    delete updatedSlot.bucket;
                                }
                                newState[slotKey] = updatedSlot;
                            }
                        }
                    } else if (editingReminder) {
                        const idx = reminders.findIndex(r => r.id === editingReminder.id);
                        if (idx !== -1) {
                            if (!data.isReminder) {
                                reminders.splice(idx, 1);
                                newState.reminders = reminders;
                                
                                const [h, m] = (data.time || '09:00').split(':').map(Number);
                                const slotIdx = h * 2 + (m >= 30 ? 1 : 0);
                                const key = `${editingReminder.dayIdx}-${slotIdx}`;
                                const slotObj: any = {
                                    type: 'custom',
                                    name: data.name,
                                    color: editingReminder.color || '#f59e0b',
                                    description: data.description,
                                };
                                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) {
                                    slotObj.bucket = data.bucket;
                                }
                                newState[key] = slotObj;
                            } else {
                                const remObj: any = {
                                    ...reminders[idx],
                                    name: data.name,
                                    description: data.description,
                                    time: data.time || '09:00',
                                };
                                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) {
                                    remObj.bucket = data.bucket;
                                } else {
                                    delete remObj.bucket;
                                }
                                reminders[idx] = remObj;
                                newState.reminders = reminders;
                            }
                        }
                    }

                    updateGridState(newState);
                    setIsTaskEditDialogOpen(false);
                    setEditingReminder(null);
                    setEditingTaskCell(null);
                }}
                onDelete={() => {
                    setIsTaskEditDialogOpen(false);
                    setShowTaskDeleteConfirm(true);
                }}
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
                onClose={() => {
                    setShowTaskDeleteConfirm(false);
                    setEditingReminder(null);
                    setEditingTaskCell(null);
                }}
                onConfirm={() => {
                    const newState = { ...localGridState };
                    if (editingTaskCell) {
                        const { dayIdx, slotIdx } = editingTaskCell;
                        const key = `${dayIdx}-${slotIdx}`;
                        const target = newState[key];

                        if (target) {
                            // Find contiguous slots of the same task/goal block
                            let start = slotIdx;
                            while (start > 0) {
                                const prevKey = `${dayIdx}-${start - 1}`;
                                const prev = newState[prevKey];
                                if (prev && prev.type === target.type && prev.name === target.name) {
                                    start--;
                                } else {
                                    break;
                                }
                            }

                            let end = slotIdx;
                            while (end < 47) {
                                const nextKey = `${dayIdx}-${end + 1}`;
                                const next = newState[nextKey];
                                if (next && next.type === target.type && next.name === target.name) {
                                    end++;
                                } else {
                                    break;
                                }
                            }

                            // Delete all slots in the contiguous block
                            for (let s = start; s <= end; s++) {
                                delete newState[`${dayIdx}-${s}`];
                            }
                        } else {
                            delete newState[key];
                        }
                    } else if (editingReminder) {
                        const reminders = [...(newState.reminders || [])] as ReminderItem[];
                        newState.reminders = reminders.filter(r => r.id !== editingReminder.id);
                    }
                    updateGridState(newState);
                    setShowTaskDeleteConfirm(false);
                    setEditingReminder(null);
                    setEditingTaskCell(null);
                }}
                title={editingReminder ? "Delete Reminder?" : (editingTaskData?.type === 'habit' ? "Reset Habit Slot?" : "Delete Task Block?")}
                description={editingReminder 
                    ? "Are you sure you want to delete this specific time reminder? This cannot be undone."
                    : (editingTaskData?.type === 'habit'
                        ? "Are you sure you want to reset this habit slot? This will clear the daily override and description."
                        : "Are you sure you want to delete this task? This will remove the entire scheduled block from this day.")
                }
                confirmText={editingReminder ? "Delete Reminder" : (editingTaskData?.type === 'habit' ? "Reset Slot" : "Delete Block")}
                variant="destructive"
            />

            <ConfirmationDialog
                isOpen={showLibraryDeleteConfirm}
                onClose={() => setShowLibraryDeleteConfirm(false)}
                onConfirm={executeLibraryDelete}
                title={idToDeleteFromLibrary?.startsWith('note-') ? "Delete Note?" : "Remove from Library?"}
                description={idToDeleteFromLibrary?.startsWith('note-') 
                    ? "Are you sure you want to delete this note from the vault? This cannot be undone." 
                    : "Are you sure you want to remove this task from your library? This will not remove existing tasks from your planner grid, but you won't be able to quickly schedule it again."}
                confirmText={idToDeleteFromLibrary?.startsWith('note-') ? "Delete Note" : "Remove Task"}
                variant="destructive"
            />
        </div>
    );
};
