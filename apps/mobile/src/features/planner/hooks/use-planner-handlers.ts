import { toast , GridState, Goal , DAYS_OF_WEEK, SLOTS_PER_DAY } from '@llb/core';
import { haptics } from '@/lib/haptics';

/** Web also has a 'drag' tool, whose only job is to arm HTML5 `draggable`
 * on cells. Here moving a block is a long-press, so the tool would be a
 * button that does nothing — it isn't part of the mobile set. */
export type PlannerTool = 'erase' | 'goal' | 'duplicate' | null;

interface HandlerDeps {
    localGridState: GridState;
    updateGridState: (state: GridState) => void;
    isSleepSlot: (slotIdx: number) => boolean;
    isHabitSlot: (dayIdx: number, slotIdx: number) => boolean;
    isPlanSlot: (dayIdx: number, slotIdx: number) => boolean;
    getCellContent: (dayIdx: number, slotIdx: number) => any;
    activeGoalsForWeek: Goal[];
    selectedTool: PlannerTool;
    selectedGoalId: string;
    copiedTask: any;
    setCopiedTask: (task: any) => void;
    setEditingTaskData: (data: any) => void;
    setEditingTaskCell: (cell: { dayIdx: number; slotIdx: number } | null) => void;
    setIsTaskEditDialogOpen: (open: boolean) => void;
    setIsGoalToolDialogOpen: (open: boolean) => void;
    movingBlock: MovingBlock | null;
    setMovingBlock: (block: MovingBlock | null) => void;
}

/** A whole scheduled block that has been picked up, not a single slot.
 * `span` is its length in 30-minute slots (1 = 30min, 2 = 1h, 3 = 1.5h…)
 * and `grabOffset` is which slot within it the finger grabbed, so the
 * block keeps its position relative to the finger while moving. */
export interface MovingBlock {
    dayIdx: number;
    startSlot: number;
    span: number;
    grabOffset: number;
    name: string;
}

/** Walks outward from a slot to find the contiguous run sharing its type
 * and name — the same rule web uses to merge a block visually, and to
 * find the block to delete in TaskEditDialog. Only entries that really
 * exist in the grid state count, so derived sleep/plan/habit bands are
 * never treated as movable blocks. */
export function getBlockExtent(gridState: GridState, dayIdx: number, slotIdx: number) {
    const target = gridState[`${dayIdx}-${slotIdx}`];
    if (!target) return null;
    let start = slotIdx;
    let end = slotIdx;
    while (start > 0) {
        const prev = gridState[`${dayIdx}-${start - 1}`];
        if (prev && prev.type === target.type && prev.name === target.name) start--;
        else break;
    }
    while (end < SLOTS_PER_DAY - 1) {
        const next = gridState[`${dayIdx}-${end + 1}`];
        if (next && next.type === target.type && next.name === target.name) end++;
        else break;
    }
    return { startSlot: start, span: end - start + 1, name: target.name };
}

/** Port of apps/web/src/features/planner/hooks/use-planner-handlers.ts —
 * pure grid-mutation logic, no DOM dependency.
 *
 * One deliberate divergence: web's drag moves a SINGLE cell
 * (`newState[target] = newState[source]; delete newState[source]`), so
 * dragging a 2-hour block on web relocates just the half hour you grabbed
 * and tears the block apart. Here a drag carries the whole block and
 * refuses to land on occupied space. The stored shape is unchanged — still
 * one PlanSlot per slot key — so the blob stays readable by web. */
export function createPlannerHandlers(deps: HandlerDeps) {
    const {
        localGridState, updateGridState,
        isSleepSlot, isHabitSlot, isPlanSlot, getCellContent,
        activeGoalsForWeek, selectedTool, selectedGoalId,
        copiedTask, setCopiedTask,
        setEditingTaskData, setEditingTaskCell, setIsTaskEditDialogOpen,
        setIsGoalToolDialogOpen,
        movingBlock, setMovingBlock,
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
                    goalId: targetGoal.id,
                    bucket: targetGoal.bucket,
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

        if (data.isReminder) {
            const reminders = [...(newState.reminders || [])];
            if (data.daysOfWeek && data.daysOfWeek.length > 0) {
                data.daysOfWeek.forEach((dayName: string) => {
                    const dayIdx = DAYS_OF_WEEK.indexOf(dayName as any);
                    if (dayIdx !== -1) {
                        reminders.push({
                            id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: data.name,
                            description: data.description,
                            time: data.startTime,
                            dayIdx,
                            color: '#f43f5e',
                            isReminder: true,
                            bucket: data.bucket,
                        });
                    }
                });
            }
            newState.reminders = reminders;
            updateGridState(newState);
            return;
        }

        const [sH, sM] = data.startTime.split(':').map(Number);
        const [eH, eM] = data.endTime.split(':').map(Number);
        const startSlot = sH * 2 + (sM >= 30 ? 1 : 0);
        const endSlot = eH * 2 + (eM >= 30 ? 1 : 0);

        let canAdd = true;
        const conflictDetails: string[] = [];
        if (data.daysOfWeek && data.daysOfWeek.length > 0) {
            data.daysOfWeek.forEach((dayName: string) => {
                const dayIdx = DAYS_OF_WEEK.indexOf(dayName as any);
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
                const dayIdx = DAYS_OF_WEEK.indexOf(dayName as any);
                if (dayIdx !== -1) {
                    for (let i = startSlot; i < endSlot; i++) {
                        if (i >= SLOTS_PER_DAY) continue;
                        newState[`${dayIdx}-${i}`] = {
                            type: 'custom',
                            name: data.name,
                            color: data.color,
                            description: data.description,
                            bucket: data.bucket,
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

    /** Lifts the WHOLE block containing this slot — a 1.5h task travels as
     * 1.5h, not as the single half hour the finger happened to land on. */
    const beginMove = (dayIdx: number, slotIdx: number, silent = false) => {
        if (isSleepSlot(slotIdx) || isPlanSlot(dayIdx, slotIdx)) return;
        // Only blocks that really live in the grid state can move; sleep,
        // planning and untouched habit bands are derived, so there is no
        // entry to relocate.
        const extent = getBlockExtent(localGridState, dayIdx, slotIdx);
        if (!extent) return;
        setMovingBlock({
            dayIdx,
            startSlot: extent.startSlot,
            span: extent.span,
            grabOffset: slotIdx - extent.startSlot,
            name: extent.name,
        });
        // Silent when a drag ghost is already following the finger — the
        // ghost IS the feedback, and a toast would just say "tap a slot"
        // to someone who is mid-drag.
        if (!silent) toast.info(`Moving "${extent.name}" — tap a slot to place it`);
    };

    const cancelMove = () => setMovingBlock(null);

    /** True when every slot the block would occupy is free. Anything the
     * grid already draws there — another task, a habit, the sleep or
     * planning band — counts as taken, so blocks can never overlap. The
     * block's own current slots don't block it, since it is vacating them. */
    const canPlaceBlock = (targetDay: number, targetStart: number, block: MovingBlock) => {
        if (targetStart < 0 || targetStart + block.span > SLOTS_PER_DAY) return false;
        for (let i = 0; i < block.span; i++) {
            const s = targetStart + i;
            const isOwnSlot =
                targetDay === block.dayIdx && s >= block.startSlot && s < block.startSlot + block.span;
            if (isOwnSlot) continue;
            if (getCellContent(targetDay, s)) return false;
        }
        return true;
    };

    /** Drops the held block so it STARTS at targetStart. Rejects the move
     * outright if it would overlap anything rather than overwriting it. */
    const dropMovingBlock = (targetDay: number, targetStart: number) => {
        if (!movingBlock) return;
        const { dayIdx: srcDay, startSlot: srcStart, span } = movingBlock;

        if (targetDay === srcDay && targetStart === srcStart) {
            setMovingBlock(null);
            return;
        }
        if (!canPlaceBlock(targetDay, targetStart, movingBlock)) {
            haptics.reject();
            toast.error(`"${movingBlock.name}" doesn't fit there — that space is taken.`);
            setMovingBlock(null);
            return;
        }

        const newState = { ...localGridState };
        // Lift every slot of the block, then re-lay it at the target. Each
        // slot still carries its own PlanSlot object exactly as web stores
        // it — only how many move at once differs.
        const lifted = [];
        for (let i = 0; i < span; i++) lifted.push(newState[`${srcDay}-${srcStart + i}`]);
        for (let i = 0; i < span; i++) delete newState[`${srcDay}-${srcStart + i}`];
        for (let i = 0; i < span; i++) {
            if (lifted[i]) newState[`${targetDay}-${targetStart + i}`] = lifted[i];
        }

        updateGridState(newState);
        setMovingBlock(null);
        haptics.drop();
        toast.success(`Moved "${movingBlock.name}"`);
    };

    const handleCellClick = (dayIdx: number, slotIdx: number) => {
        const key = `${dayIdx}-${slotIdx}`;

        // A block is in hand — this tap is the drop. Checked before the
        // sleep/plan guard so dropping onto a blocked band still reports
        // why, instead of silently doing nothing.
        if (movingBlock) {
            dropMovingBlock(dayIdx, slotIdx - movingBlock.grabOffset);
            return;
        }

        if (isSleepSlot(slotIdx) || isPlanSlot(dayIdx, slotIdx)) return;

        const newState = { ...localGridState };
        let existing = newState[key];

        // If it's a habit slot, always make sure the type is 'habit'
        if (isHabitSlot(dayIdx, slotIdx)) {
            if (!existing) {
                const cellContent = getCellContent(dayIdx, slotIdx);
                if (cellContent) {
                    existing = {
                        type: 'habit',
                        name: cellContent.name,
                        description: cellContent.description || '',
                        bucket: cellContent.bucket,
                    };
                }
            } else {
                existing = {
                    ...existing,
                    type: 'habit',
                };
            }
        }

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
            const targetGoal = activeGoalsForWeek.find(g => g.id === selectedGoalId);
            newState[key] = {
                type: 'goal',
                name: (existing && existing.name) ? existing.name : (targetGoal ? (targetGoal.title || targetGoal.name) : 'Goal Work'),
                goalId: selectedGoalId || (existing && (existing as any).goalId),
                bucket: targetGoal?.bucket || (existing && existing.bucket),
            };
        } else if (selectedTool === 'duplicate') {
            if (existing) {
                setCopiedTask({ ...existing });
                // Web signals "something is on the clipboard" by swapping the
                // CSS cursor to `alias`. There's no cursor on a phone, so the
                // copy step would otherwise give no feedback at all.
                toast.info(`Copied "${existing.name}" — tap a slot to paste`);
                return;
            }
            if (copiedTask) {
                newState[key] = { ...copiedTask };
            } else {
                toast.error('Tap a filled slot first to copy it.');
                return;
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
        beginMove,
        cancelMove,
        canPlaceBlock,
        dropMovingBlock,
    };
}
