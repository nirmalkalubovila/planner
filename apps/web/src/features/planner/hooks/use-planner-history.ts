import { useState, useEffect, useRef, useCallback } from 'react';
import { GridState } from '@llb/core';
import { useSaveWeekPlan, useGetWeekPlanUpdatedAt, type SaveWeekPlanResult } from '@llb/api';

const MAX_HISTORY = 50;

export function usePlannerHistory(currentWeek: string) {
    const [localGridState, setLocalGridState] = useState<GridState>({});
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastLoadedWeekRef = useRef<string>('');
    const savePlan = useSaveWeekPlan();
    const pendingSaveRef = useRef<{ week: string; state: GridState } | null>(null);

    // The offline conflict-merge inputs: what this device last saw as the
    // synced state (`baseStateRef`) and its version stamp
    // (`updatedAtRef`). See useSaveWeekPlan's doc comment in
    // packages/api for why both are needed to merge correctly rather than
    // just overwrite on conflict.
    const baseStateRef = useRef<GridState>({});
    const updatedAtRef = useRef<string | null>(null);
    const { data: remoteUpdatedAt } = useGetWeekPlanUpdatedAt(currentWeek);

    useEffect(() => {
        if (remoteUpdatedAt !== undefined) {
            updatedAtRef.current = remoteUpdatedAt;
        }
    }, [remoteUpdatedAt]);

    // `flushPendingSave`'s identity changes every render (useSaveWeekPlan()
    // returns a fresh mutation-result object each time), so depending on it
    // directly made this effect's cleanup run on every render instead of
    // only on unmount — clearing the pending debounce and re-firing the
    // save with no onSuccess callback attached. Routed through a ref so the
    // effect is a true unmount-only cleanup.
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
    const flushRef = useRef(flushPendingSave);
    flushRef.current = flushPendingSave;

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
                        // The server merged in edits from elsewhere — sync
                        // local state to that truth, or the NEXT autosave
                        // would resubmit our un-merged view and silently
                        // undo the merge.
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

    useEffect(() => {
        return () => {
            flushRef.current();
        };
    }, []);

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
            // A fresh week just loaded from the server — this IS the
            // synced baseline until the user edits it again.
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
