import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGetWeekPlan, usePrefetchAdjacentWeeks } from '@/api/services/planner-service';
import { useGetGoals } from '@/api/services/goal-service';
import { WeekUtils } from '@/utils/week-utils';
import { Goal, CustomTask } from '@/types/global-types';
import { useGetCustomTasks, useDeleteCustomTask } from '@/api/services/custom-task-service';
import { useGetMissedTasks, useDeleteMissedTask } from '@/api/services/missed-task-service';

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

    // Data queries
    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: goals } = useGetGoals();
    const { data: libraryTasks } = useGetCustomTasks();
    const { data: missedLibraryTasks } = useGetMissedTasks();
    const deleteLibraryTask = useDeleteCustomTask();
    const deleteMissedTask = useDeleteMissedTask();

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

    const handlers = createPlannerHandlers({
        localGridState, updateGridState,
        isSleepSlot, isHabitSlot, isPlanSlot,
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
            deleteLibraryTask.mutate(idToDeleteFromLibrary);
            deleteMissedTask.mutate(idToDeleteFromLibrary);
            setIdToDeleteFromLibrary(null);
            setShowLibraryDeleteConfirm(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-full w-full overflow-hidden relative",
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
                        isHabitSlot={isHabitSlot}
                        isPlanSlot={isPlanSlot}
                        getCellContent={getCellContent}
                        handleCellClick={handlers.handleCellClick}
                        selectedTool={selectedTool}
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
                onClose={() => setIsTaskEditDialogOpen(false)}
                onSave={(data: any) => {
                    handlers.handleTaskEditSave(editingTaskCell, data);
                    setIsTaskEditDialogOpen(false);
                }}
                onDelete={() => setShowTaskDeleteConfirm(true)}
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
                onConfirm={() => {
                    handlers.executeTaskDelete(editingTaskCell);
                    setIsTaskEditDialogOpen(false);
                    setShowTaskDeleteConfirm(false);
                }}
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
