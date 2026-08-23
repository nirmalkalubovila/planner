import { useState, useEffect, useRef, useCallback } from 'react';
import { GridState } from '@llb/core';
import { useSaveWeekPlan } from '@/api/services/planner-service';

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

    const flushPendingSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (pendingSaveRef.current) {
            const { week, state } = pendingSaveRef.current;
            pendingSaveRef.current = null;
            savePlan.mutate({ week, state });
        }
    }, [savePlan]);

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
            savePlan.mutate({ week: currentWeek, state: newState }, {
                onSuccess: () => {
                    setSaveStatus('saved');
                    pendingSaveRef.current = null;
                },
                onError: () => setSaveStatus('idle'),
            });
        }, 400);
    }, [currentWeek, historyIndex, savePlan]);

    useEffect(() => {
        return () => {
            flushPendingSave();
        };
    }, [flushPendingSave]);

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
