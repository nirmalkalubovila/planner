import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, usePrefetchAdjacentWeeks } from '@/api/services/planner-service';
import { useGetGoals } from '@/api/services/goal-service';
import { WeekUtils } from '@/utils/week-utils';
import { Goal, CustomTask, ReminderItem } from '@/types/global-types';
import { useGetCustomTasks, useDeleteCustomTask } from '@/api/services/custom-task-service';
import { useGetMissedTasks, useDeleteMissedTask } from '@/api/services/missed-task-service';
import { useNotes, useDeleteNote } from '@/api/services/vault-service';

import { PlannerToolbar } from './components/planner-toolbar';
import { PlannerGrid } from './components/planner-grid';
import { CustomTaskDialog } from './forms/custom-task-dialog';
import { GoalToolDialog } from './forms/goal-tool-dialog';
import { TaskEditDialog } from './forms/task-edit-dialog';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

import { usePlannerGrid } from './hooks/use-planner-grid';
import { usePlannerHistory } from './hooks/use-planner-history';
import { createPlannerHandlers } from './hooks/use-planner-handlers';

export const PlannerPage: React.FC = () => {
    const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
    const [selectedTool, setSelectedTool] = useState<'erase' | 'goal' | 'duplicate' | 'drag' | null>(null);
    const [copiedTask, setCopiedTask] = useState<any>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');

    // Dialog states
    const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
    const [selectedLibraryTask, setSelectedLibraryTask] = useState<CustomTask | null>(null);
    const [isGoalToolDialogOpen, setIsGoalToolDialogOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
    const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);
    const [idToDeleteFromLibrary, setIdToDeleteFromLibrary] = useState<string | null>(null);

    // Edit states
    const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
    const [editingTaskData, setEditingTaskData] = useState<any>(null);
    const [editingTaskCell, setEditingTaskCell] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
    const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

    // Data queries
    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: goals } = useGetGoals();
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
                            });
                            newState.reminders = reminders;
                        } else {
                            newState[key] = {
                                ...newState[key],
                                type: data.type || newState[key]?.type || 'custom',
                                name: data.name,
                                description: data.description,
                                goalId: (data.type === 'goal' || newState[key]?.type === 'goal') ? data.goalId : undefined,
                            };
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
                                newState[key] = {
                                    type: 'custom',
                                    name: data.name,
                                    color: editingReminder.color || '#f59e0b',
                                    description: data.description,
                                };
                            } else {
                                reminders[idx] = {
                                    ...reminders[idx],
                                    name: data.name,
                                    description: data.description,
                                    time: data.time || '09:00',
                                };
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
