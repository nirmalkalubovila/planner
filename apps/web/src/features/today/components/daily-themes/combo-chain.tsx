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
            {isPerfect && <div className="absolute inset-0 bg-[#D2A226]/20 blur-[50px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn(
                "relative transition-all duration-300 ease-in-out z-10",
                shake && !isPerfect && "scale-110 translate-x-2 -translate-y-1",
                isPerfect && "scale-125 animate-[bounce_2s_infinite]"
            )}>
                <div className={cn(
                    "text-[6rem] font-black italic leading-none transition-colors duration-700",
                    isPerfect ? "text-[#e9c468] drop-shadow-[0_0_40px_rgba(210,162,38,1)]" : "text-[#D2A226] drop-shadow-[0_0_20px_rgba(210,162,38,0.8)]"
                )}>
                    {completedTasksCount} <span className={cn("text-4xl", isPerfect ? "text-[#f9e6a8]" : "text-[#f3d98a]")}>HITS</span>
                </div>
                {isPerfect && (
                    <div className="absolute -inset-4 bg-[#e9c468]/40 blur-2xl rounded-full scale-150 animate-ping -z-10"></div>
                )}
            </div>
            <div className="mt-8 text-center z-10">
                {isPerfect ? (
                    <div className="text-2xl font-black text-[#e9c468] animate-pulse uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(210,162,38,0.8)]">
                        Perfect Combo!
                    </div>
                ) : completedTasksCount > 0 ? (
                    <div className="text-sm font-bold text-[#e9c468]/80 animate-pulse tracking-widest uppercase">
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
