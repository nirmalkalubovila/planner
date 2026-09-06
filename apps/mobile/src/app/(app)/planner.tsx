import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  useGetCustomTasks,
  useDeleteCustomTask,
  useDeleteMissedTask,
  useDeleteNote,
  useGetGoals,
  useGetHabits,
  useGetMissedTasks,
  useGetWeekBucketActions,
  useGetWeekPlan,
  useNotes,
  usePrefetchAdjacentWeeks,
} from '@llb/api';
import { CustomTask, Goal, Habit, LIFE_BUCKETS, LifeBucket, PlanSlot, ReminderItem, WeekUtils, toast } from '@llb/core';

import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Text } from '@/components/ui/typography';
import { PlannerGrid } from '@/features/planner/components/planner-grid';
import { PlannerToolbar } from '@/features/planner/components/planner-toolbar';
import { CustomTaskDialog } from '@/features/planner/forms/custom-task-dialog';
import { GoalToolDialog } from '@/features/planner/forms/goal-tool-dialog';
import { SundayFocusDialog } from '@/features/planner/forms/sunday-focus-dialog';
import { TaskEditDialog } from '@/features/planner/forms/task-edit-dialog';
import { createPlannerHandlers, type MovingBlock, type PlannerTool } from '@/features/planner/hooks/use-planner-handlers';
import { usePlannerGrid } from '@/features/planner/hooks/use-planner-grid';
import { usePlannerHistory } from '@/features/planner/hooks/use-planner-history';

/** Port of apps/web/src/features/planner/planner-page.tsx — same state
 * shape, handlers, dialogs and save/undo pipeline, so the resulting
 * `week_plans.state` blob stays cross-platform-compatible. The grid
 * (planner-grid.tsx) is the same 7-day × 48-slot week web renders, rebuilt
 * on flex + two-axis scrolling since Yoga has no CSS Grid. */
export default function PlannerScreen() {
  const params = useLocalSearchParams<{ openOutcomes?: string }>();
  const [currentWeek, setCurrentWeek] = useState(WeekUtils.getCurrentWeek());
  const [selectedTool, setSelectedTool] = useState<PlannerTool>(null);
  const [copiedTask, setCopiedTask] = useState<any>(null);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  /** The block currently picked up — whole block, not a single slot — with
   * its span and grab offset, awaiting a drop or a destination tap. */
  const [movingBlock, setMovingBlock] = useState<MovingBlock | null>(null);

  const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
  const [selectedLibraryTask, setSelectedLibraryTask] = useState<CustomTask | null>(null);
  const [isGoalToolDialogOpen, setIsGoalToolDialogOpen] = useState(false);
  // Seeded from the deep-link param so arriving at ?openOutcomes=true opens
  // the dialog on the very first render; the block further down covers the
  // param changing while this screen is already mounted.
  const [isSundayFocusDialogOpen, setIsSundayFocusDialogOpen] = useState(
    params.openOutcomes === 'true'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);
  const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);
  const [idToDeleteFromLibrary, setIdToDeleteFromLibrary] = useState<string | null>(null);

  const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<any>(null);
  const [editingTaskCell, setEditingTaskCell] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  // Deep links (and the Today screen's outcome banner) can arrive with
  // ?openOutcomes=true to land straight in the weekly-outcomes dialog.
  // Tracked against the previous param value and adjusted during render
  // rather than in an effect, so the dialog is already open on the first
  // committed frame instead of appearing one frame later.
  const [prevOpenOutcomes, setPrevOpenOutcomes] = useState(params.openOutcomes);
  if (params.openOutcomes !== prevOpenOutcomes) {
    setPrevOpenOutcomes(params.openOutcomes);
    if (params.openOutcomes === 'true') setIsSundayFocusDialogOpen(true);
  }

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

  const { localGridState, updateGridState, loadWeekPlan, handleUndo, handleRedo, canUndo, canRedo, saveStatus } = usePlannerHistory(currentWeek);
  const { isSleepSlot, isHabitSlot, isPlanSlot, getCellContent } = usePlannerGrid(currentWeek, localGridState);

  const activeGoalsForWeek = useMemo(() => {
    return (goals || []).filter((g: Goal) => {
      const startWk = WeekUtils.getWeekFromDate(g.startDate);
      const endWk = WeekUtils.getWeekFromDate(g.endDate);
      return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
    });
  }, [goals, currentWeek]);

  const activeHabitsForWeek = useMemo(() => {
    return (habits || []).filter((h: Habit) => {
      if (!h.startDate) return true;
      const startWk = WeekUtils.getWeekFromDate(h.startDate);
      const endWk = h.endDate ? WeekUtils.getWeekFromDate(h.endDate) : '9999-52';
      return WeekUtils.compareWeeks(startWk, currentWeek) <= 0 && WeekUtils.compareWeeks(endWk, currentWeek) >= 0;
    });
  }, [habits, currentWeek]);

  const combinedBacklog = useMemo<CustomTask[]>(() => {
    const missed = missedLibraryTasks || [];
    const notesAsTasks: CustomTask[] = (notes || [])
      .filter(n => n.category === 'nextweek')
      .map(n => ({
        id: `note-${n.id}`,
        name: n.title || 'Untitled Note',
        description: n.content,
        startTime: '09:00',
        endTime: '10:00',
        daysOfWeek: [] as string[],
      }));
    return [...missed, ...notesAsTasks];
  }, [missedLibraryTasks, notes]);

  const allCustomTasks = useMemo(() => {
    const tasksMap = new Map<string, CustomTask>();
    Object.entries(localGridState || {}).forEach(([slotKey, rawCell]) => {
      if (slotKey === 'reminders' || !rawCell || typeof rawCell !== 'object' || Array.isArray(rawCell)) return;
      const cell = rawCell as PlanSlot;
      if (cell.name && cell.type === 'custom') {
        const key = cell.name.trim().toLowerCase();
        if (!tasksMap.has(key)) {
          tasksMap.set(key, { id: `task-${key}`, name: cell.name.trim(), description: cell.description || '', startTime: '09:00', endTime: '10:00', daysOfWeek: [], bucket: cell.bucket });
        }
      }
    });
    (localGridState?.reminders || []).forEach((r: ReminderItem) => {
      if (r.name) {
        const key = r.name.trim().toLowerCase();
        if (!tasksMap.has(key)) {
          tasksMap.set(key, { id: r.id || `reminder-${key}`, name: r.name.trim(), description: r.description || '', startTime: r.time || '09:00', endTime: '09:30', daysOfWeek: [], isReminder: true, bucket: r.bucket });
        }
      }
    });
    return Array.from(tasksMap.values());
  }, [localGridState]);

  // Weekly outcomes are stored as p1/p2/p3 (see SundayFocusDialog). Web
  // still counts the legacy per-life-bucket keys here, which is why its
  // badge reads 0 for anyone whose outcomes are in the current shape.
  const sundayFocusCount = useMemo(() => {
    const raw = (bucketActions || {}) as any;
    const byOutcomeKey = ['p1', 'p2', 'p3'].filter(k => !!raw[k]?.text?.trim()).length;
    if (byOutcomeKey > 0) return byOutcomeKey;
    return (LIFE_BUCKETS || []).filter(b => !!raw[b]?.text?.trim()).length;
  }, [bucketActions]);

  const handlers = createPlannerHandlers({
    localGridState,
    updateGridState,
    isSleepSlot,
    isHabitSlot,
    isPlanSlot,
    getCellContent,
    activeGoalsForWeek,
    selectedTool,
    selectedGoalId,
    copiedTask,
    setCopiedTask,
    setEditingTaskData,
    setEditingTaskCell,
    setIsTaskEditDialogOpen,
    setIsGoalToolDialogOpen,
    movingBlock,
    setMovingBlock,
  });

  useEffect(() => {
    loadWeekPlan(weekPlan);
  }, [weekPlan, loadWeekPlan]);

  const handleDeleteLibraryTask = (id: string) => {
    setIdToDeleteFromLibrary(id);
    setShowLibraryDeleteConfirm(true);
  };

  const executeLibraryDelete = () => {
    if (idToDeleteFromLibrary) {
      if (idToDeleteFromLibrary.startsWith('note-')) {
        deleteNote.mutate(idToDeleteFromLibrary.replace('note-', ''));
      } else {
        deleteLibraryTask.mutate(idToDeleteFromLibrary);
        deleteMissedTask.mutate(idToDeleteFromLibrary);
      }
      setIdToDeleteFromLibrary(null);
      setShowLibraryDeleteConfirm(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      {/* `relative` so the toolbar can float over the grid, the way web's
          mobile toolbar overlays its own grid. */}
      <View className="flex-1 relative">
        <PlannerGrid
          currentWeek={currentWeek}
          setCurrentWeek={setCurrentWeek}
          localGridState={localGridState}
          isSleepSlot={isSleepSlot}
          getCellContent={getCellContent}
          handleCellClick={handlers.handleCellClick}
          onCellLongPress={handlers.beginMove}
          movingBlock={movingBlock}
          canPlaceBlock={handlers.canPlaceBlock}
          onDropBlock={handlers.dropMovingBlock}
          onCancelMove={handlers.cancelMove}
          onEditReminder={reminder => {
            setEditingReminder(reminder);
            setEditingTaskData({ ...reminder, type: 'custom', isReminder: true });
            setEditingTaskCell(null);
            setIsTaskEditDialogOpen(true);
          }}
        />

        {/* A block is in hand — tell the user what to do with it and give
            them a way out, since there's no "drop it back" gesture. */}
        {!!movingBlock && (
          <View
            style={{ position: 'absolute', top: 8, left: 8, right: 8 }}
            className="flex-row items-center justify-between rounded-xl bg-emerald-950 border border-emerald-500/40 px-3 py-2 z-40"
          >
            <Text variant="tiny" className="text-emerald-300 font-bold flex-1 mr-2" numberOfLines={1}>
              Moving “{movingBlock.name}” ({movingBlock.span * 30}min) — drag or tap a free slot
            </Text>
            <Pressable onPress={handlers.cancelMove} className="px-2 py-1 rounded-lg bg-emerald-500/15">
              <Text variant="tiny" className="text-emerald-300 font-black uppercase">
                Cancel
              </Text>
            </Pressable>
          </View>
        )}

        <PlannerToolbar
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          onClear={() => setShowClearConfirm(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          saveStatus={saveStatus}
          onCreateCustomTask={task => {
            setSelectedLibraryTask(task || null);
            setIsCustomTaskDialogOpen(true);
          }}
          libraryTasks={libraryTasks || []}
          missedTasks={combinedBacklog}
          onGoalToolClick={() => setIsGoalToolDialogOpen(true)}
          onOpenSundayFocus={() => setIsSundayFocusDialogOpen(true)}
          sundayFocusCount={sundayFocusCount}
        />
      </View>

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
        onConfirm={data => {
          handlers.handleCustomTaskConfirm(data);
          toast.success(data.isReminder ? 'Reminder added' : 'Task added to your planner');
        }}
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
                  if (prev && (prev.name === target.name || (target.goalId && prev.goalId === target.goalId))) start--;
                  else break;
                }
                while (end < 47) {
                  const nextKey = `${editingTaskCell.dayIdx}-${end + 1}`;
                  const next = newState[nextKey];
                  if (next && (next.name === target.name || (target.goalId && next.goalId === target.goalId))) end++;
                  else break;
                }
              }

              for (let s = start; s <= end; s++) {
                const slotKey = `${editingTaskCell.dayIdx}-${s}`;
                const updatedSlot: any = {
                  ...newState[slotKey],
                  type: data.type || newState[slotKey]?.type || target?.type || 'custom',
                  name: data.name,
                  description: data.description,
                  goalId: data.type === 'goal' || target?.type === 'goal' ? data.goalId : undefined,
                };
                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) updatedSlot.bucket = data.bucket;
                else delete updatedSlot.bucket;
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
                const slotObj: any = { type: 'custom', name: data.name, color: editingReminder.color || '#f59e0b', description: data.description };
                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) slotObj.bucket = data.bucket;
                newState[key] = slotObj;
              } else {
                const remObj: any = { ...reminders[idx], name: data.name, description: data.description, time: data.time || '09:00' };
                if (data.bucket && LIFE_BUCKETS.includes(data.bucket as LifeBucket)) remObj.bucket = data.bucket;
                else delete remObj.bucket;
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
              let start = slotIdx;
              while (start > 0) {
                const prevKey = `${dayIdx}-${start - 1}`;
                const prev = newState[prevKey];
                if (prev && prev.type === target.type && prev.name === target.name) start--;
                else break;
              }
              let end = slotIdx;
              while (end < 47) {
                const nextKey = `${dayIdx}-${end + 1}`;
                const next = newState[nextKey];
                if (next && next.type === target.type && next.name === target.name) end++;
                else break;
              }
              for (let s = start; s <= end; s++) delete newState[`${dayIdx}-${s}`];
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
        title={editingReminder ? 'Delete Reminder?' : editingTaskData?.type === 'habit' ? 'Reset Habit Slot?' : 'Delete Task Block?'}
        description={
          editingReminder
            ? 'Are you sure you want to delete this specific time reminder? This cannot be undone.'
            : editingTaskData?.type === 'habit'
              ? 'Are you sure you want to reset this habit slot? This will clear the daily override and description.'
              : 'Are you sure you want to delete this task? This will remove the entire scheduled block from this day.'
        }
        confirmText={editingReminder ? 'Delete Reminder' : editingTaskData?.type === 'habit' ? 'Reset Slot' : 'Delete Block'}
        variant="destructive"
      />

      <ConfirmationDialog
        isOpen={showLibraryDeleteConfirm}
        onClose={() => setShowLibraryDeleteConfirm(false)}
        onConfirm={executeLibraryDelete}
        title={idToDeleteFromLibrary?.startsWith('note-') ? 'Delete Note?' : 'Remove from Library?'}
        description={
          idToDeleteFromLibrary?.startsWith('note-')
            ? 'Are you sure you want to delete this note from the vault? This cannot be undone.'
            : "Are you sure you want to remove this task from your library? This will not remove existing tasks from your planner grid, but you won't be able to quickly schedule it again."
        }
        confirmText={idToDeleteFromLibrary?.startsWith('note-') ? 'Delete Note' : 'Remove Task'}
        variant="destructive"
      />
    </SafeAreaView>
  );
}
