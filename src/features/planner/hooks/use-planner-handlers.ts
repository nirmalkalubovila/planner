import { toast } from 'sonner';
import { GridState, Goal } from '@/types/global-types';
import { DAYS_OF_WEEK, SLOTS_PER_DAY } from '@/constants/scheduling';

interface HandlerDeps {
    localGridState: GridState;
    updateGridState: (state: GridState) => void;
    isSleepSlot: (slotIdx: number) => boolean;
    isHabitSlot: (dayIdx: number, slotIdx: number) => boolean;
    isPlanSlot: (dayIdx: number, slotIdx: number) => boolean;
    activeGoalsForWeek: Goal[];
    selectedTool: 'erase' | 'goal' | 'duplicate' | null;
    selectedGoalId: string;
    copiedTask: any;
    setCopiedTask: (task: any) => void;
    setEditingTaskData: (data: any) => void;
    setEditingTaskCell: (cell: { dayIdx: number; slotIdx: number } | null) => void;
    setIsTaskEditDialogOpen: (open: boolean) => void;
    setIsGoalToolDialogOpen: (open: boolean) => void;
}

export function createPlannerHandlers(deps: HandlerDeps) {
    const {
        localGridState, updateGridState,
        isSleepSlot, isHabitSlot, isPlanSlot,
        activeGoalsForWeek, selectedTool, selectedGoalId,
        copiedTask, setCopiedTask,
        setEditingTaskData, setEditingTaskCell, setIsTaskEditDialogOpen,
        setIsGoalToolDialogOpen,
    } = deps;

    const handleAllocateGoalTime = (goalId: string, hours: number) => {
        const requiredSlots = Math.round(hours * 2);
        const targetGoal = activeGoalsForWeek.find(g => g.id === goalId);
        if (!targetGoal) return;

        const emptySlotsGroupedByDay: { dayIdx: number; slotIdx: number }[][] = [[], [], [], [], [], [], []];
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
            toast.error(`Cannot allocate ${hours}h. Need ${requiredSlots} blocks, but only ${totalEmptySlots} empty.`);
            return;
        }

        const newState = { ...localGridState };
        let slotsToAllocate = requiredSlots;
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
                const dayIdx = DAYS_OF_WEEK.indexOf(dayName);
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
                const dayIdx = DAYS_OF_WEEK.indexOf(dayName);
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

    const handleTaskEditSave = (editingTaskCell: { dayIdx: number; slotIdx: number } | null, data: any) => {
        if (!editingTaskCell) return;
        const key = `${editingTaskCell.dayIdx}-${editingTaskCell.slotIdx}`;
        const newState = { ...localGridState };
        newState[key] = { ...newState[key], ...data };
        updateGridState(newState);
    };

    const executeTaskDelete = (editingTaskCell: { dayIdx: number; slotIdx: number } | null) => {
        if (!editingTaskCell) return;
        const key = `${editingTaskCell.dayIdx}-${editingTaskCell.slotIdx}`;
        const newState = { ...localGridState };
        delete newState[key];
        updateGridState(newState);
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
                setCopiedTask({ ...existing });
            } else if (copiedTask) {
                newState[key] = { ...copiedTask };
            }
        }
        updateGridState(newState);
    };

    return {
        handleAllocateGoalTime,
        handleCustomTaskConfirm,
        handleTaskEditSave,
        executeTaskDelete,
        handleCellClick,
    };
}
