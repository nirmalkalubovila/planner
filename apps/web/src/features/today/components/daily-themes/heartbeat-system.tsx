import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Heart, HeartPulse } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const HeartbeatSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const [pulse, setPulse] = useState(false);
    const prev = useRef(completedPoints);
    const isFullVitality = progress >= 100;

    useEffect(() => {
        if (completedPoints > prev.current) {
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    const beatDuration = isFullVitality ? '0.6s' : progress > 50 ? '1.2s' : '2s';

    return (
        <div className="flex flex-col items-center justify-center py-12 relative overflow-visible">
            {pulse && !isFullVitality && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/30 blur-3xl rounded-full scale-150 animate-ping pointer-events-none"></div>}
            {isFullVitality && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/20 blur-[60px] rounded-full animate-pulse pointer-events-none"></div>}
            <div
                className={cn(
                    "relative z-10 transition-all duration-500",
                    pulse && !isFullVitality && "scale-125 drop-shadow-[0_0_30px_rgba(239,68,68,1)]",
                    isFullVitality && "scale-150 drop-shadow-[0_0_50px_rgba(239,68,68,1)] text-white"
                )}
                style={{ animation: `heartbeat ${beatDuration} ease-in-out infinite` }}
            >
                <Heart size={isFullVitality ? 100 : 80} fill={isFullVitality ? "#ef4444" : "currentColor"} className={isFullVitality ? "text-red-400" : "text-red-600"} />
                {isFullVitality && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HeartPulse className="text-white w-12 h-12 mix-blend-overlay animate-pulse" />
                    </div>
                )}
            </div>
            <div className="mt-12 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-500",
                    isFullVitality ? "text-red-400 text-3xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" : "text-red-500"
                )}>
                    {!isFullVitality && <HeartPulse size={20} />}
                    {isFullVitality ? "Full Vitality" : "Signs of Life"}
                </div>
                {!isFullVitality && <div className="text-sm font-medium text-red-500/70 mt-1">{progress.toFixed(0)} BPM</div>}
            </div>
            <style>{`
                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    15% { transform: scale(1.15); }
                    30% { transform: scale(1); }
                    45% { transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
};
