import { describe, it, expect } from 'vitest';
import { mergeGridState } from '../merge-grid-state';
import type { GridState, PlanSlot } from '../../types/planner';

const task = (name: string): PlanSlot => ({ type: 'custom', name });

describe('mergeGridState', () => {
  it('takes the remote value when local never touched a slot', () => {
    const base: GridState = { '0-10': task('Old') };
    const local: GridState = { '0-10': task('Old') }; // untouched offline
    const remote: GridState = { '0-10': task('New from web') };

    const { merged, conflictedDayIndexes } = mergeGridState(base, local, remote);
    expect(merged['0-10']).toEqual(task('New from web'));
    expect(conflictedDayIndexes).toEqual([]);
  });

  it('keeps the local value when remote never touched a slot', () => {
    const base: GridState = { '1-5': task('Old') };
    const local: GridState = { '1-5': task('Edited on phone') };
    const remote: GridState = { '1-5': task('Old') }; // untouched on web

    const { merged, conflictedDayIndexes } = mergeGridState(base, local, remote);
    expect(merged['1-5']).toEqual(task('Edited on phone'));
    expect(conflictedDayIndexes).toEqual([]);
  });

  it('prefers local and flags the day when both sides edit the same slot', () => {
    const base: GridState = { '2-8': task('Old') };
    const local: GridState = { '2-8': task('Phone edit') };
    const remote: GridState = { '2-8': task('Web edit') };

    const { merged, conflictedDayIndexes } = mergeGridState(base, local, remote);
    expect(merged['2-8']).toEqual(task('Phone edit'));
    expect(conflictedDayIndexes).toEqual([2]);
  });

  it('never lets an edit to one slot erase an edit to a different slot — the core guarantee', () => {
    const base: GridState = { '0-1': task('A'), '0-2': task('B') };
    // Phone edits slot 1 while offline.
    const local: GridState = { '0-1': task('A edited on phone'), '0-2': task('B') };
    // Web edits slot 2 in the meantime.
    const remote: GridState = { '0-1': task('A'), '0-2': task('B edited on web') };

    const { merged, conflictedDayIndexes } = mergeGridState(base, local, remote);
    expect(merged['0-1']).toEqual(task('A edited on phone'));
    expect(merged['0-2']).toEqual(task('B edited on web'));
    expect(conflictedDayIndexes).toEqual([]); // no slot was touched by both
  });

  it('a slot deleted locally and left alone remotely stays deleted', () => {
    const base: GridState = { '3-0': task('Gone soon') };
    const local: GridState = {}; // deleted offline
    const remote: GridState = { '3-0': task('Gone soon') };

    const { merged } = mergeGridState(base, local, remote);
    expect(merged['3-0']).toBeUndefined();
  });

  it('a slot added remotely while absent locally and in base is kept', () => {
    const base: GridState = {};
    const local: GridState = {};
    const remote: GridState = { '4-4': task('Added on web while phone was offline') };

    const { merged } = mergeGridState(base, local, remote);
    expect(merged['4-4']).toEqual(task('Added on web while phone was offline'));
  });

  it('merges reminders by id, union of both sides, local wins on conflict', () => {
    const base = { reminders: [{ id: 'r1', name: 'Old', time: '09:00', dayIdx: 0 }] } as GridState;
    const local = {
      reminders: [
        { id: 'r1', name: 'Old', time: '09:00', dayIdx: 0 }, // untouched
        { id: 'r2', name: 'Added on phone', time: '10:00', dayIdx: 1 },
      ],
    } as GridState;
    const remote = {
      reminders: [
        { id: 'r1', name: 'Renamed on web', time: '09:00', dayIdx: 0 },
        { id: 'r3', name: 'Added on web', time: '11:00', dayIdx: 2 },
      ],
    } as GridState;

    const { merged } = mergeGridState(base, local, remote);
    const byId = Object.fromEntries((merged.reminders || []).map(r => [r.id, r]));
    expect(byId.r1.name).toBe('Renamed on web'); // remote-only change wins cleanly
    expect(byId.r2.name).toBe('Added on phone'); // local-only addition kept
    expect(byId.r3.name).toBe('Added on web'); // remote-only addition kept
  });
});
