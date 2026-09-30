// Reset: "when reality changes, fix my plan without making me rebuild everything."
//
// Deterministic and pure. It reads the same week grid the Week Planner uses (30-minute slots,
// key "<dayIdx>-<slotIdx>"), decides KEEP / MOVE / REDUCE / REMOVE for the work that is still
// ahead, and returns a PROPOSAL. Nothing here touches a database; the caller applies a proposal
// only after the user accepts it.
import type { Goal, Habit } from '../types/domain';
import type { GridState, PlanSlot } from '../types/planner';
import { SLOTS_PER_DAY } from '../constants/scheduling';
import { WeekUtils } from './week';

export const RESET_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const RESET_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WAKE_SLOT = 12; // 06:00: nothing is ever moved earlier than this
const SLOT_MIN = 30;
const PRIORITY_BONUS = [60, 45, 30];

export type ResetReason = 'unexpected' | 'less_time' | 'low_energy' | 'priority_changed' | 'took_longer' | 'other';
export type ResetAction = 'keep' | 'move' | 'reduce' | 'remove';

export interface ResetPriority {
    text: string;
    goalId?: string;
    name?: string;
}

export interface ResetInput {
    grid: GridState;
    weekStr: string;
    now: Date;
    habits: Habit[];
    goals: Goal[];
    /** dayIdx (0 = Monday) -> ids of tasks completed that day (the same ids the Today page stores). */
    completedByDay: Record<number, string[]>;
    priorities: ResetPriority[];
    sleepStart: string;
    sleepDuration: number;
    planDay: string;
    planHours: number;
    /** Hours per day the user set aside for goal work. */
    weekdayHours: number;
    weekendHours: number;
    reasons?: ResetReason[];
    /** Goal whose work must be kept before anything else. */
    protectGoalId?: string | null;
}

export interface ResetBlock {
    id: string; // same id the Today page uses: "<type>-<name>-<startSlot>"
    name: string;
    type: PlanSlot['type'];
    goalId?: string;
    dayIdx: number;
    startSlot: number;
    endSlot: number;
    minutes: number;
    overdue: boolean;
    score: number;
    priorityRank: number; // 0-2 when it serves a weekly priority, otherwise -1
    deadline: boolean;
}

export interface ResetPlace { dayIdx: number; startSlot: number; endSlot: number }

export interface ResetItem {
    id: string;
    name: string;
    type: PlanSlot['type'];
    goalId?: string;
    from: ResetPlace;
    minutes: number;
    overdue: boolean;
    action: ResetAction;
    /** Where it ends up (present for keep, move and reduce). */
    to?: ResetPlace;
    newMinutes?: number;
    reason: string;
}

export interface ResetContext {
    input: ResetInput;
    todayIdx: number; // -1 when the week is not the current one
    nowSlot: number;
    dayEnd: number;
    budgets: number[]; // minutes per day
    fixedOccupied: Set<string>;
    blocks: ResetBlock[];
    weekEndISO: string;
    goalById: Map<string, Goal>;
}

export interface ResetHealth {
    plannedMin: number;
    availableMin: number;
    overloadMin: number;
    bufferMin: number;
    overloadedDays: number[];
    prioritiesAtRisk: string[];
    hasWork: boolean;
    needsReset: boolean;
}

export interface ResetSummary {
    beforeMin: number;
    afterMin: number;
    availableMin: number;
    beforeOverloadMin: number;
    afterBufferMin: number;
    counts: Record<ResetAction, number>;
    overlaps: string[];
}

export interface ResetGoalImpact {
    goalId?: string;
    name: string;
    status: 'on_track' | 'at_risk';
    protectedNames: string[];
    trimmedNames: string[];
    isPriority: boolean;
}

export interface ResetHabitNote {
    name: string;
    target: number;
    completed: number;
    remaining: number;
    realistic: number;
}

const slotOf = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 2 + (m >= 30 ? 1 : 0);
};

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const formatMinutes = (min: number) => {
    const m = Math.max(0, Math.round(min));
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 0) return `${r}m`;
    return r === 0 ? `${h}h` : `${h}h ${r}m`;
};

export const slotLabel = (slot: number) => {
    const h = Math.floor(slot / 2) % 24;
    const m = slot % 2 === 0 ? '00' : '30';
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 === 0 ? 12 : h % 12}:${m} ${suffix}`;
};

const REASON_FACTOR: Record<ResetReason, number> = {
    unexpected: 0.85,
    less_time: 0.75,
    low_energy: 0.85,
    priority_changed: 1,
    took_longer: 1,
    other: 1,
};

// ─────────────────────────────── context ───────────────────────────────

export function createResetContext(input: ResetInput): ResetContext {
    const days = WeekUtils.getDaysForWeek(input.weekStr);
    const todayISO = isoDate(input.now);
    const todayIdx = days.findIndex((d) => isoDate(d) === todayISO);
    const nowSlot = Math.floor((input.now.getHours() * 60 + input.now.getMinutes()) / SLOT_MIN);
    const nowSlotCeil = Math.min(SLOTS_PER_DAY, nowSlot + 1);

    const sleepStartSlot = slotOf(input.sleepStart || '22:00');
    const dayEnd = sleepStartSlot >= WAKE_SLOT + 4 ? sleepStartSlot : SLOTS_PER_DAY;
    const sleepSlots = Math.round((input.sleepDuration || 8) * 2);

    // Fixed commitments: habits, sleep, weekly planning, anything the user placed that is not movable work
    const fixedOccupied = new Set<string>();
    const planDayIdx = Math.max(0, RESET_DAY_NAMES.indexOf(input.planDay));
    const planSlots = Math.round((input.planHours || 1) * 2);
    for (let d = 0; d < 7; d++) {
        for (let s = 0; s < SLOTS_PER_DAY; s++) {
            const rel = (s - sleepStartSlot + SLOTS_PER_DAY) % SLOTS_PER_DAY;
            if (rel < sleepSlots) fixedOccupied.add(`${d}-${s}`);
            if (d === planDayIdx && s >= 44 - planSlots && s < 44) fixedOccupied.add(`${d}-${s}`);
        }
        (input.habits || []).forEach((h) => {
            if (!h.startTime || !h.endTime) return;
            if (h.daysOfWeek && h.daysOfWeek.length > 0 && !h.daysOfWeek.includes(RESET_DAY_NAMES[d])) return;
            for (let s = slotOf(h.startTime); s < slotOf(h.endTime); s++) fixedOccupied.add(`${d}-${s}`);
        });
    }

    // Per-day budget of flexible work, in minutes. The days before today are closed.
    const factor = Math.max(0.5, (input.reasons ?? []).reduce((f, r) => f * (REASON_FACTOR[r] ?? 1), 1));
    const budgets = new Array(7).fill(0) as number[];
    for (let d = 0; d < 7; d++) {
        if (todayIdx !== -1 && d < todayIdx) continue;
        const hours = d >= 5 ? input.weekendHours : input.weekdayHours;
        budgets[d] = Math.round(hours * 60 * factor);
    }

    const goalById = new Map<string, Goal>();
    (input.goals || []).forEach((g) => goalById.set(String(g.id), g));

    const weekEndISO = isoDate(days[6]);
    const blocks = extractBlocks(input, todayIdx, nowSlot, weekEndISO, goalById);

    // Today: subtract what is already done, and cap by the waking hours left
    if (todayIdx !== -1) {
        const doneToday = doneMinutes(input, todayIdx);
        const leftToday = Math.max(0, (dayEnd - Math.max(nowSlotCeil, WAKE_SLOT)) * SLOT_MIN);
        budgets[todayIdx] = Math.max(0, Math.min(budgets[todayIdx] - doneToday, leftToday));
    }

    return { input, todayIdx, nowSlot: nowSlotCeil, dayEnd, budgets, fixedOccupied, blocks, weekEndISO, goalById };
}

function runsForDay(grid: GridState, d: number) {
    const runs: { slot: PlanSlot; start: number; end: number }[] = [];
    let cur: { slot: PlanSlot; start: number; end: number } | null = null;
    for (let s = 0; s < SLOTS_PER_DAY; s++) {
        const slot = grid[`${d}-${s}`] as PlanSlot | undefined;
        const ok = slot && typeof slot === 'object' && slot.name && slot.type !== 'cleared' && slot.type !== 'sleep' && slot.type !== 'plan' && slot.type !== 'habit' && !slot.isReminder;
        if (ok) {
            if (cur && cur.slot.name === slot!.name && cur.slot.type === slot!.type) cur.end = s + 1;
            else {
                if (cur) runs.push(cur);
                cur = { slot: slot!, start: s, end: s + 1 };
            }
        } else if (cur) {
            runs.push(cur);
            cur = null;
        }
    }
    if (cur) runs.push(cur);
    return runs;
}

function doneMinutes(input: ResetInput, d: number) {
    const done = new Set(input.completedByDay[d] || []);
    return runsForDay(input.grid, d)
        .filter((r) => done.has(`${r.slot.type}-${r.slot.name}-${r.start}`))
        .reduce((sum, r) => sum + (r.end - r.start) * SLOT_MIN, 0);
}

function extractBlocks(input: ResetInput, todayIdx: number, nowSlot: number, weekEndISO: string, goalById: Map<string, Goal>): ResetBlock[] {
    const blocks: ResetBlock[] = [];
    const first = todayIdx === -1 ? 0 : todayIdx;
    for (let d = first; d < 7; d++) {
        const done = new Set(input.completedByDay[d] || []);
        for (const run of runsForDay(input.grid, d)) {
            const id = `${run.slot.type}-${run.slot.name}-${run.start}`;
            if (done.has(id)) continue;
            const goal = run.slot.goalId ? goalById.get(String(run.slot.goalId)) : undefined;
            const rank = input.priorities.findIndex(
                (p) =>
                    (p.goalId && run.slot.goalId && String(p.goalId) === String(run.slot.goalId)) ||
                    (p.name && p.name.trim().toLowerCase() === run.slot.name.trim().toLowerCase()),
            );
            const deadline = !!goal?.endDate && goal.endDate <= weekEndISO;
            let score = 0;
            if (rank >= 0) score += PRIORITY_BONUS[Math.min(rank, 2)];
            if (deadline) score += 40;
            if (run.slot.type === 'goal') score += 10;
            if (goal) score += 5;
            if (input.protectGoalId && run.slot.goalId && String(run.slot.goalId) === String(input.protectGoalId)) score += 200;
            blocks.push({
                id,
                name: run.slot.name,
                type: run.slot.type,
                goalId: run.slot.goalId,
                dayIdx: d,
                startSlot: run.start,
                endSlot: run.end,
                minutes: (run.end - run.start) * SLOT_MIN,
                overdue: d === todayIdx && run.start < nowSlot - 1,
                score,
                priorityRank: rank,
                deadline,
            });
        }
    }
    return blocks;
}

// ─────────────────────────────── health ───────────────────────────────

export function analyzeHealth(ctx: ResetContext): ResetHealth {
    const planned = ctx.blocks.reduce((s, b) => s + b.minutes, 0);
    const available = ctx.budgets.reduce((s, b) => s + b, 0);
    const overload = Math.max(0, planned - available);

    const perDay = new Array(7).fill(0) as number[];
    ctx.blocks.forEach((b) => { perDay[b.dayIdx] += b.minutes; });
    const overloadedDays = perDay.map((m, d) => (m > ctx.budgets[d] ? d : -1)).filter((d) => d !== -1);

    const atRisk: string[] = [];
    ctx.input.priorities.forEach((p, i) => {
        const related = ctx.blocks.filter((b) => b.priorityRank === i);
        if (related.length === 0) return;
        const exposed = related.some((b) => b.overdue || overloadedDays.includes(b.dayIdx));
        if (exposed) atRisk.push(p.text);
    });

    return {
        plannedMin: planned,
        availableMin: available,
        overloadMin: overload,
        bufferMin: Math.max(0, available - planned),
        overloadedDays,
        prioritiesAtRisk: atRisk,
        hasWork: ctx.blocks.length > 0,
        needsReset: overload > 0 || atRisk.length > 0,
    };
}

// ─────────────────────────────── proposal ───────────────────────────────

type Occupancy = Set<string>;

const claim = (occ: Occupancy, p: ResetPlace) => { for (let s = p.startSlot; s < p.endSlot; s++) occ.add(`${p.dayIdx}-${s}`); };
const release = (occ: Occupancy, p: ResetPlace) => { for (let s = p.startSlot; s < p.endSlot; s++) occ.delete(`${p.dayIdx}-${s}`); };

function findSlot(ctx: ResetContext, occ: Occupancy, dayIdx: number, minutes: number, prefer: number): number | null {
    const need = Math.max(1, Math.round(minutes / SLOT_MIN));
    const from = dayIdx === ctx.todayIdx ? Math.max(WAKE_SLOT, ctx.nowSlot) : WAKE_SLOT;
    let best: number | null = null;
    for (let start = from; start + need <= ctx.dayEnd; start++) {
        let free = true;
        for (let s = start; s < start + need; s++) {
            if (occ.has(`${dayIdx}-${s}`)) { free = false; break; }
        }
        if (free && (best === null || Math.abs(start - prefer) < Math.abs(best - prefer))) best = start;
    }
    return best;
}

function dayOrder(ctx: ResetContext, origin: number): number[] {
    const first = ctx.todayIdx === -1 ? 0 : ctx.todayIdx;
    const days: number[] = [];
    for (let d = first; d < 7; d++) days.push(d);
    return days.sort((a, b) => Math.abs(a - origin) - Math.abs(b - origin) || b - a);
}

function initialOccupancy(ctx: ResetContext): Occupancy {
    const occ: Occupancy = new Set(ctx.fixedOccupied);
    ctx.blocks.forEach((b) => claim(occ, { dayIdx: b.dayIdx, startSlot: b.startSlot, endSlot: b.endSlot }));
    return occ;
}

function reasonFor(b: ResetBlock, action: ResetAction): string {
    if (action === 'keep') {
        if (b.priorityRank >= 0) return 'Protects your weekly priority.';
        if (b.deadline) return 'Its goal has a deadline this week.';
        return 'Fits your capacity.';
    }
    if (action === 'move') {
        if (b.overdue) return 'Its time has passed today.';
        return `${RESET_DAY_NAMES[b.dayIdx]} is over capacity.`;
    }
    if (action === 'reduce') return 'A smaller version keeps it alive.';
    return 'Lower impact than your protected priorities. It moves to your Missed Library, not deleted.';
}

export function buildProposal(ctx: ResetContext): ResetItem[] {
    const occ = initialOccupancy(ctx);
    const left = [...ctx.budgets];
    const items = new Map<string, ResetItem>();

    const ordered = [...ctx.blocks].sort((a, b) => b.score - a.score || a.dayIdx - b.dayIdx || a.startSlot - b.startSlot);

    for (const b of ordered) {
        const from: ResetPlace = { dayIdx: b.dayIdx, startSlot: b.startSlot, endSlot: b.endSlot };
        const base = { id: b.id, name: b.name, type: b.type, goalId: b.goalId, from, minutes: b.minutes, overdue: b.overdue };
        const order = dayOrder(ctx, b.dayIdx);

        const tryPlace = (minutes: number): ResetPlace | null => {
            release(occ, from);
            for (const d of order) {
                if (left[d] < minutes) continue;
                // Staying exactly where it is (only possible while its time has not passed)
                if (d === b.dayIdx && !b.overdue) {
                    const end = b.startSlot + Math.round(minutes / SLOT_MIN);
                    let free = true;
                    for (let s = b.startSlot; s < end; s++) if (occ.has(`${d}-${s}`)) { free = false; break; }
                    if (free) return { dayIdx: d, startSlot: b.startSlot, endSlot: end };
                }
                const start = findSlot(ctx, occ, d, minutes, b.startSlot);
                if (start !== null) return { dayIdx: d, startSlot: start, endSlot: start + Math.round(minutes / SLOT_MIN) };
            }
            return null;
        };

        let place = tryPlace(b.minutes);
        if (place) {
            claim(occ, place);
            left[place.dayIdx] -= b.minutes;
            const same = place.dayIdx === from.dayIdx && place.startSlot === from.startSlot;
            items.set(b.id + b.startSlot + b.dayIdx, { ...base, action: same ? 'keep' : 'move', to: place, reason: reasonFor(b, same ? 'keep' : 'move') });
            continue;
        }

        if ((b.type === 'goal' || b.type === 'custom') && b.minutes > SLOT_MIN) {
            const reduced = Math.max(SLOT_MIN, Math.ceil(b.minutes / 2 / SLOT_MIN) * SLOT_MIN);
            place = tryPlace(reduced);
            if (place) {
                claim(occ, place);
                left[place.dayIdx] -= reduced;
                items.set(b.id + b.startSlot + b.dayIdx, { ...base, action: 'reduce', to: place, newMinutes: reduced, reason: reasonFor(b, 'reduce') });
                continue;
            }
        }

        items.set(b.id + b.startSlot + b.dayIdx, { ...base, action: 'remove', reason: reasonFor(b, 'remove') });
    }

    // Stable, readable order: by original day then time
    return [...items.values()].sort((a, b) => a.from.dayIdx - b.from.dayIdx || a.from.startSlot - b.from.startSlot);
}

export const itemKey = (i: ResetItem) => `${i.id}@${i.from.dayIdx}`;

// ─────────────────────────────── summary & validation ───────────────────────────────

const finalMinutes = (i: ResetItem) => (i.action === 'remove' ? 0 : i.newMinutes ?? i.minutes);

export function summarizeProposal(ctx: ResetContext, items: ResetItem[]): ResetSummary {
    const before = items.reduce((s, i) => s + i.minutes, 0);
    const after = items.reduce((s, i) => s + finalMinutes(i), 0);
    const available = ctx.budgets.reduce((s, b) => s + b, 0);
    const counts: Record<ResetAction, number> = { keep: 0, move: 0, reduce: 0, remove: 0 };
    items.forEach((i) => { counts[i.action] += 1; });
    return {
        beforeMin: before,
        afterMin: after,
        availableMin: available,
        beforeOverloadMin: Math.max(0, before - available),
        afterBufferMin: Math.max(0, available - after),
        counts,
        overlaps: findOverlaps(ctx, items),
    };
}

/** Anything placed on top of a fixed commitment or another task after the proposal is applied. */
export function findOverlaps(ctx: ResetContext, items: ResetItem[]): string[] {
    const seen = new Map<string, string>();
    const problems: string[] = [];
    for (const i of items) {
        if (i.action === 'remove' || !i.to) continue;
        for (let s = i.to.startSlot; s < i.to.endSlot; s++) {
            const key = `${i.to.dayIdx}-${s}`;
            if (ctx.fixedOccupied.has(key)) { problems.push(`${i.name} overlaps a fixed commitment`); break; }
            const other = seen.get(key);
            if (other) { problems.push(`${i.name} overlaps ${other}`); break; }
            seen.set(key, i.name);
        }
    }
    return problems;
}

/** Free places for an item, one per day (best slot), for the "move to..." picker. */
export function getMoveOptions(ctx: ResetContext, items: ResetItem[], target: ResetItem, minutes?: number): ResetPlace[] {
    const occ: Occupancy = new Set(ctx.fixedOccupied);
    for (const i of items) {
        if (i === target || i.action === 'remove' || !i.to) continue;
        claim(occ, i.to);
    }
    // Work that is not part of the proposal yet still sits in the grid; it is already an item, so nothing else to add
    const mins = minutes ?? finalMinutes(target) ?? target.minutes;
    const out: ResetPlace[] = [];
    const first = ctx.todayIdx === -1 ? 0 : ctx.todayIdx;
    for (let d = first; d < 7; d++) {
        const start = findSlot(ctx, occ, d, mins, target.from.startSlot);
        if (start !== null) out.push({ dayIdx: d, startSlot: start, endSlot: start + Math.round(mins / SLOT_MIN) });
    }
    return out;
}

/** Edits one item (a user override) and returns a new list. Invalid edits leave the list unchanged. */
export function overrideItem(
    ctx: ResetContext,
    items: ResetItem[],
    key: string,
    patch: { action: ResetAction; to?: ResetPlace; newMinutes?: number },
): ResetItem[] {
    const target = items.find((i) => itemKey(i) === key);
    if (!target) return items;
    const next: ResetItem = { ...target, action: patch.action };

    if (patch.action === 'remove') {
        next.to = undefined;
        next.newMinutes = undefined;
        next.reason = 'You chose to take it out of this week. It moves to your Missed Library.';
    } else if (patch.action === 'keep') {
        // Keep means where it is now, or the option the caller picked
        const place = patch.to ?? (target.overdue ? getMoveOptions(ctx, items, target, target.minutes)[0] : target.from);
        if (!place) return items;
        next.to = place;
        next.newMinutes = undefined;
        const sameSpot = place.dayIdx === target.from.dayIdx && place.startSlot === target.from.startSlot;
        next.action = sameSpot ? 'keep' : 'move';
        next.reason = sameSpot ? 'You chose to keep it.' : 'You chose where it goes.';
    } else if (patch.action === 'move') {
        if (!patch.to) return items;
        next.to = patch.to;
        next.newMinutes = undefined;
        next.reason = 'You chose where it goes.';
    } else if (patch.action === 'reduce') {
        const mins = Math.max(SLOT_MIN, Math.min(patch.newMinutes ?? target.minutes, target.minutes - SLOT_MIN));
        const place = patch.to ?? (target.to ?? target.from);
        next.newMinutes = mins;
        next.to = { dayIdx: place.dayIdx, startSlot: place.startSlot, endSlot: place.startSlot + Math.round(mins / SLOT_MIN) };
        next.reason = 'You chose a shorter block.';
    }

    const list = items.map((i) => (itemKey(i) === key ? next : i));
    return findOverlaps(ctx, list).length > 0 ? items : list;
}

// ─────────────────────────────── goals & habits ───────────────────────────────

export function goalImpact(ctx: ResetContext, items: ResetItem[]): ResetGoalImpact[] {
    const byGoal = new Map<string, ResetItem[]>();
    items.forEach((i) => {
        if (!i.goalId) return;
        byGoal.set(String(i.goalId), [...(byGoal.get(String(i.goalId)) ?? []), i]);
    });
    const priorityGoalIds = new Set(ctx.input.priorities.map((p) => (p.goalId ? String(p.goalId) : '')).filter(Boolean));

    const out: ResetGoalImpact[] = [];
    byGoal.forEach((list, goalId) => {
        const goal = ctx.goalById.get(goalId);
        const trimmed = list.filter((i) => i.action === 'remove' || i.action === 'reduce');
        const protectedList = list.filter((i) => i.action === 'keep' || i.action === 'move');
        out.push({
            goalId,
            name: goal?.name || goal?.title || list[0].name,
            status: trimmed.length > 0 ? 'at_risk' : 'on_track',
            protectedNames: protectedList.map((i) => i.name).slice(0, 3),
            trimmedNames: trimmed.map((i) => i.name).slice(0, 3),
            isPriority: priorityGoalIds.has(goalId),
        });
    });
    // Goals at risk first, then the ones tied to weekly priorities
    return out.sort((a, b) => Number(b.status === 'at_risk') - Number(a.status === 'at_risk') || Number(b.isPriority) - Number(a.isPriority));
}

export function habitNotes(ctx: ResetContext): ResetHabitNote[] {
    const notes: ResetHabitNote[] = [];
    const first = ctx.todayIdx === -1 ? 0 : ctx.todayIdx;
    (ctx.input.habits || []).forEach((h) => {
        if (!h.startTime) return;
        const days = [0, 1, 2, 3, 4, 5, 6].filter((d) => !h.daysOfWeek || h.daysOfWeek.length === 0 || h.daysOfWeek.includes(RESET_DAY_NAMES[d]));
        const target = days.length;
        if (target === 0) return;
        const id = `habit-${h.name}-${slotOf(h.startTime)}`;
        let completed = 0;
        let remaining = 0;
        days.forEach((d) => {
            if ((ctx.input.completedByDay[d] || []).includes(id)) completed += 1;
            else if (d > first || (d === first && slotOf(h.startTime) >= ctx.nowSlot)) remaining += 1;
        });
        if (completed + remaining < target) {
            notes.push({ name: h.name, target, completed, remaining, realistic: completed + remaining });
        }
    });
    return notes;
}

// ─────────────────────────────── applying ───────────────────────────────

export interface ResetApplyResult {
    state: GridState;
    deferred: ResetItem[];
}

/** Builds the new week grid. Removed work leaves the grid and is handed back so the caller can keep it in the Missed Library. */
export function applyProposalToGrid(grid: GridState, items: ResetItem[]): ResetApplyResult {
    const next: GridState = { ...grid };
    const slotFor = (i: ResetItem): PlanSlot => ({
        ...(grid[`${i.from.dayIdx}-${i.from.startSlot}`] as PlanSlot),
    });

    // Clear everything the proposal touches first, then write the final positions
    const changed = items.filter((i) => i.action !== 'keep' || i.to?.startSlot !== i.from.startSlot || i.to?.dayIdx !== i.from.dayIdx);
    const originals = new Map<string, PlanSlot>();
    changed.forEach((i) => {
        originals.set(itemKey(i), slotFor(i));
        for (let s = i.from.startSlot; s < i.from.endSlot; s++) delete (next as Record<string, unknown>)[`${i.from.dayIdx}-${s}`];
    });
    changed.forEach((i) => {
        if (i.action === 'remove' || !i.to) return;
        const slot = originals.get(itemKey(i));
        if (!slot) return;
        for (let s = i.to.startSlot; s < i.to.endSlot; s++) (next as Record<string, unknown>)[`${i.to.dayIdx}-${s}`] = { ...slot };
    });

    return { state: next, deferred: items.filter((i) => i.action === 'remove') };
}
