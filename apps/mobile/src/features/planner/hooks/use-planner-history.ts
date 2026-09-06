import { useState, useEffect, useRef, useCallback } from 'react';
import { GridState } from '@llb/core';
import { useSaveWeekPlan, useGetWeekPlanUpdatedAt, type SaveWeekPlanResult } from '@llb/api';

const MAX_HISTORY = 50;

/** Port of apps/web/src/features/planner/hooks/use-planner-history.ts —
 * including the offline conflict-merge tracking (baseStateRef/
 * updatedAtRef), which matters MORE here than on web: a phone can be
 * offline for days at a stretch in a way a browser tab rarely is. */
export function usePlannerHistory(currentWeek: string) {
    const [localGridState, setLocalGridState] = useState<GridState>({});
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastLoadedWeekRef = useRef<string>('');
    const savePlan = useSaveWeekPlan();
    const pendingSaveRef = useRef<{ week: string; state: GridState } | null>(null);

    // What this device last saw as the synced state and its version stamp
    // — the inputs useSaveWeekPlan needs to three-way-merge on conflict
    // instead of overwriting. See that hook's doc comment in @llb/api.
    const baseStateRef = useRef<GridState>({});
    const updatedAtRef = useRef<string | null>(null);
    const { data: remoteUpdatedAt } = useGetWeekPlanUpdatedAt(currentWeek);

    useEffect(() => {
        if (remoteUpdatedAt !== undefined) {
            updatedAtRef.current = remoteUpdatedAt;
        }
    }, [remoteUpdatedAt]);

    const flushPendingSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (pendingSaveRef.current) {
            const { week, state } = pendingSaveRef.current;
            pendingSaveRef.current = null;
            savePlan.mutate({ week, state, baseState: baseStateRef.current, lastSeenUpdatedAt: updatedAtRef.current });
        }
    }, [savePlan]);

    // `flushPendingSave` changes identity on every render, because
    // useSaveWeekPlan() returns a fresh mutation-result object each time.
    // Depending on it directly (as web does) makes this effect's CLEANUP run
    // on every single render — which cleared the pending 400ms timer and
    // re-fired the save with no onSuccess callback, so saveStatus never left
    // 'idle' and the toolbar was pinned to "PENDING" forever. Route the flush
    // through a ref so the effect can be a true unmount-only cleanup.
    const flushRef = useRef(flushPendingSave);
    // Kept fresh from an effect rather than assigned inline during render —
    // a render-phase ref write. The unmount cleanup below still sees the
    // latest flush, since this runs after every commit.
    useEffect(() => {
        flushRef.current = flushPendingSave;
    });
    useEffect(() => {
        return () => {
            flushRef.current();
        };
    }, []);

    const updateGridState = useCallback((newState: GridState, skipHistory = false) => {
        setLocalGridState(newState);
        if (!skipHistory) {
            setHistory(prev => {
                const trimmed = prev.slice(0, historyIndex + 1);
                trimmed.push(newState);
                if (trimmed.length > MAX_HISTORY) trimmed.shift();
                return trimmed;
            });
            setHistoryIndex(prev => {
                const next = prev + 1;
                return next >= MAX_HISTORY ? MAX_HISTORY - 1 : next;
            });
        }

        pendingSaveRef.current = { week: currentWeek, state: newState };
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            setSaveStatus('saving');
            const baseState = baseStateRef.current;
            const lastSeenUpdatedAt = updatedAtRef.current;
            savePlan.mutate({ week: currentWeek, state: newState, baseState, lastSeenUpdatedAt }, {
                onSuccess: (result: SaveWeekPlanResult) => {
                    setSaveStatus('saved');
                    pendingSaveRef.current = null;
                    updatedAtRef.current = result.updatedAt;
                    if (result.conflicted) {
                        // The server merged in edits made elsewhere (e.g. on
                        // web) while this device was offline — sync local
                        // state to that truth, or the next autosave would
                        // resubmit our un-merged view and undo the merge.
                        setLocalGridState(result.state);
                        baseStateRef.current = result.state;
                    } else {
                        baseStateRef.current = newState;
                    }
                },
                onError: () => setSaveStatus('idle'),
            });
        }, 400);
    }, [currentWeek, historyIndex, savePlan]);

    const loadWeekPlan = useCallback((weekPlan: Record<string, any> | undefined) => {
        if (!weekPlan) return;
        const normalized: GridState = {};
        Object.entries(weekPlan).forEach(([key, val]) => {
            normalized[key.replace(/\s/g, '')] = val as any;
        });
        setLocalGridState(normalized);
        if (lastLoadedWeekRef.current !== currentWeek) {
            lastLoadedWeekRef.current = currentWeek;
            setHistory([normalized]);
            setHistoryIndex(0);
            // A fresh week just loaded from the server (or from the offline
            // cache) — this IS the synced baseline until edited again.
            baseStateRef.current = normalized;
        }
    }, [currentWeek]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setLocalGridState(history[prevIndex]);
            setHistoryIndex(prevIndex);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setLocalGridState(history[nextIndex]);
            setHistoryIndex(nextIndex);
        }
    }, [history, historyIndex]);

    return {
        localGridState,
        updateGridState,
        loadWeekPlan,
        handleUndo,
        handleRedo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        saveStatus,
    };
}
