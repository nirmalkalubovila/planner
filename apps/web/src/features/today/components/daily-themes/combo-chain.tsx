import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DailyThemeProps } from './types';

export const ComboChain: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
    const [shake, setShake] = useState(false);
    const prev = useRef(completedTasksCount);
    const isPerfect = completedTasksCount > 0 && completedTasksCount === totalTasksCount;

    useEffect(() => {
        if (completedTasksCount > prev.current) {
            setShake(true);
            setTimeout(() => setShake(false), 400);
        }
        prev.current = completedTasksCount;
    }, [completedTasksCount]);

    return (
        <div className="flex flex-col items-center justify-center py-12 relative">
            {isPerfect && <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn(
                "relative transition-all duration-300 ease-in-out z-10",
                shake && !isPerfect && "scale-110 translate-x-2 -translate-y-1",
                isPerfect && "scale-125 animate-[bounce_2s_infinite]"
            )}>
                <div className={cn(
                    "text-[6rem] font-black italic leading-none transition-colors duration-700",
                    isPerfect ? "text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)]" : "text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]"
                )}>
                    {completedTasksCount} <span className={cn("text-4xl", isPerfect ? "text-yellow-200" : "text-orange-300")}>HITS</span>
                </div>
                {isPerfect && (
                    <div className="absolute -inset-4 bg-yellow-400/40 blur-2xl rounded-full scale-150 animate-ping -z-10"></div>
                )}
            </div>
            <div className="mt-8 text-center z-10">
                {isPerfect ? (
                    <div className="text-2xl font-black text-yellow-400 animate-pulse uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                        Perfect Combo!
                    </div>
                ) : completedTasksCount > 0 ? (
                    <div className="text-sm font-bold text-orange-400/80 animate-pulse tracking-widest uppercase">
                        Keep the streak alive
                    </div>
                ) : (
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Start the combo
                    </div>
                )}
            </div>
        </div>
    );
};
