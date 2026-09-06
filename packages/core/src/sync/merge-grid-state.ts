import type { GridState, PlanSlot, ReminderItem } from '../types/planner';

/**
 * Three-way merge for a week's planner grid — the piece that makes offline
 * editing safe rather than merely convenient.
 *
 * `useSaveWeekPlan` replaces the ENTIRE week in one upsert. Online, the
 * race window between two writers is seconds. Offline, it's days: edit
 * week 47 on the phone in airplane mode Friday through Sunday, edit the
 * same week on web Saturday, reconnect Sunday — a naive replay of the
 * phone's stale blob would silently erase every web edit. This function
 * is what stops that.
 *
 * `base` is the state last seen by this device before it went offline;
 * `local` is what the offline session produced; `remote` is whatever the
 * server holds now (which may itself have moved if another device wrote
 * to it while this one was offline). Per slot key:
 *   - unchanged locally             → take remote (someone else's edit wins cleanly)
 *   - unchanged remotely            → take local (nothing to lose by keeping it)
 *   - changed on both sides         → prefer local, and record the day so
 *                                      the caller can tell the user what
 *                                      was kept
 *
 * Deliberately out of scope (see the plan's own "explicitly out of scope"
 * list): this is not a CRDT and does not attempt to merge two edits to
 * the SAME slot into a combined value — one of them wins. What it
 * guarantees is that edits to DIFFERENT slots never destroy each other,
 * which is the actual failure mode a whole-week replace produces today.
 */
export interface GridMergeResult {
    merged: GridState;
    /** Day indices (0-6) where both sides touched a slot and local won. */
    conflictedDayIndexes: number[];
}

function slotsEqual(a: PlanSlot | undefined, b: PlanSlot | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

function dayIdxFromKey(key: string): number | null {
    const [d] = key.split('-');
    const n = Number(d);
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null;
}

function mergeReminders(base: ReminderItem[], local: ReminderItem[], remote: ReminderItem[]): ReminderItem[] {
    const baseById = new Map(base.map(r => [r.id, r]));
    const localById = new Map(local.map(r => [r.id, r]));
    const remoteById = new Map(remote.map(r => [r.id, r]));

    const allIds = new Set([...baseById.keys(), ...localById.keys(), ...remoteById.keys()]);
    const result: ReminderItem[] = [];

    for (const id of allIds) {
        const b = baseById.get(id);
        const l = localById.get(id);
        const r = remoteById.get(id);

        const localChanged = JSON.stringify(l) !== JSON.stringify(b);
        const remoteChanged = JSON.stringify(r) !== JSON.stringify(b);

        if (localChanged && !remoteChanged) {
            if (l) result.push(l); // includes local deletion (l undefined) being skipped
        } else if (remoteChanged && !localChanged) {
            if (r) result.push(r);
        } else if (localChanged && remoteChanged) {
            // Both touched the same reminder — local wins, same policy as slots.
            if (l) result.push(l);
        } else if (b) {
            result.push(b); // untouched on both sides
        }
    }

    return result;
}

export function mergeGridState(base: GridState, local: GridState, remote: GridState): GridMergeResult {
    const keys = new Set<string>();
    for (const source of [base, local, remote]) {
        for (const key of Object.keys(source)) {
            if (key !== 'reminders') keys.add(key);
        }
    }

    const merged: GridState = {};
    const conflictedDays = new Set<number>();

    for (const key of keys) {
        const b = base[key];
        const l = local[key];
        const r = remote[key];

        const localChanged = !slotsEqual(l, b);
        const remoteChanged = !slotsEqual(r, b);

        let winner: PlanSlot | undefined;
        if (localChanged && remoteChanged) {
            winner = l;
            if (!slotsEqual(l, r)) {
                const dayIdx = dayIdxFromKey(key);
                if (dayIdx !== null) conflictedDays.add(dayIdx);
            }
        } else if (localChanged) {
            winner = l;
        } else {
            winner = r;
        }

        if (winner) merged[key] = winner;
    }

    const mergedReminders = mergeReminders(base.reminders || [], local.reminders || [], remote.reminders || []);
    if (mergedReminders.length > 0) merged.reminders = mergedReminders;

    return { merged, conflictedDayIndexes: Array.from(conflictedDays).sort() };
}
