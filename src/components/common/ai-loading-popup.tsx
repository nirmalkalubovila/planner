import React, { useState, useEffect, useRef } from 'react';
import { StandardDialog } from './standard-dialog';

const STATUS_MESSAGES = [
    "Reading your goal parameters...",
    "Analyzing your career profile...",
    "Mapping peak energy hours...",
    "Cross-referencing existing habits...",
    "Calculating optimal task splits...",
    "Building milestone sequences...",
    "Optimizing for your focus patterns...",
    "Finalizing your action roadmap...",
];

const STORAGE_KEY = 'legacy_ai_gen_times';

function getAvgTime(): number | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const times: number[] = JSON.parse(raw);
        if (!times.length) return null;
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    } catch { return null; }
}

export function recordGenTime(ms: number) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const times: number[] = raw ? JSON.parse(raw) : [];
        times.push(ms);
        if (times.length > 20) times.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
    } catch { /* */ }
}

interface AILoadingPopupProps {
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    message?: string;
    onClose?: () => void;
}

export const AILoadingPopup: React.FC<AILoadingPopupProps> = ({
    isOpen,
    onClose
}) => {
    const [msgIdx, setMsgIdx] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [slow, setSlow] = useState(false);
    const startRef = useRef(0);
    const avgTime = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            startRef.current = Date.now();
            avgTime.current = getAvgTime();
            setMsgIdx(0);
            setElapsed(0);
            setSlow(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const msgInterval = setInterval(() => {
            setMsgIdx(prev => (prev + 1) % STATUS_MESSAGES.length);
        }, 2200);
        const tickInterval = setInterval(() => {
            const secs = Math.floor((Date.now() - startRef.current) / 1000);
            setElapsed(secs);
            const avg = avgTime.current;
            const threshold = avg ? Math.round(avg / 1000) + 10 : 45;
            if (secs > threshold) setSlow(true);
        }, 1000);
        return () => { clearInterval(msgInterval); clearInterval(tickInterval); };
    }, [isOpen]);

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose || (() => {})}
            title="Legacy Planner"
            hideClose={!onClose}
            closeOnBackdrop={false}
            maxWidth="sm"
        >
            <div className="px-6 py-8 flex flex-col items-center justify-center space-y-5">
                <img
                    src="/ai-animation-white.gif"
                    alt="Legacy Planner"
                    className="w-20 h-20 object-contain"
                />

                <div className="text-center space-y-1.5">
                    <p className="text-sm font-semibold text-muted-foreground transition-all duration-300 min-h-[20px]">
                        {slow ? 'Taking longer than expected...' : STATUS_MESSAGES[msgIdx]}
                    </p>
                    {slow && (
                        <p className="text-[11px] text-amber-400/70">
                            Please check your internet connection
                        </p>
                    )}
                </div>

                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full animate-[loading_2.5s_ease-in-out_infinite]" />
                </div>
            </div>
        </StandardDialog>
    );
};
