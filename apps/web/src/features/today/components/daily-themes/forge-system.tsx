import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Hammer } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const ForgeSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const [strike, setStrike] = useState(false);
    const prev = useRef(completedPoints);
    const isMasterpiece = progress >= 100;

    useEffect(() => {
        if (completedPoints > prev.current) {
            setStrike(true);
            setTimeout(() => setStrike(false), 300);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    return (
        <div className="flex flex-col items-center justify-center py-10 relative">
            {isMasterpiece && <div className="absolute inset-0 bg-[#D2A226]/20 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn("relative z-10 transition-all duration-1000", isMasterpiece && "scale-125")}>
                <Hammer className={cn(
                    "w-20 h-20 transition-all duration-500 origin-bottom-right drop-shadow-lg",
                    strike && !isMasterpiece && "rotate-[-45deg] scale-110 text-[#f3d98a] drop-shadow-[0_0_15px_rgba(210,162,38,1)]",
                    isMasterpiece ? "text-[#e9c468] drop-shadow-[0_0_30px_rgba(210,162,38,1)]" : "text-slate-400"
                )} />
                {strike && !isMasterpiece && <div className="absolute top-0 right-0 w-full h-full bg-[#D2A226]/50 rounded-full blur-xl animate-ping"></div>}
                {isMasterpiece && <div className="absolute inset-0 bg-[#e9c468]/60 rounded-full blur-2xl animate-[spin_3s_linear_infinite]"></div>}
            </div>
            <div className={cn(
                "w-48 h-4 bg-slate-800 rounded-full mt-10 overflow-visible relative shadow-inner z-10 transition-all duration-1000",
                isMasterpiece && "h-6 shadow-[0_0_20px_rgba(210,162,38,1)]"
            )}>
                <div
                    className={cn(
                        "h-full bg-gradient-to-r transition-all duration-1000 rounded-full",
                        isMasterpiece ? "from-[#D2A226] via-white to-[#D2A226] animate-[pulse_1s_infinite] shadow-[0_0_20px_rgba(255,255,255,0.8)]" : "from-[#b8891c] via-[#D2A226] to-[#e9c468]"
                    )}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-6 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest transition-all duration-500",
                    isMasterpiece ? "text-[#e9c468] text-3xl drop-shadow-[0_0_15px_rgba(210,162,38,1)]" : "text-[#D2A226]"
                )}>
                    {isMasterpiece ? "Masterpiece Forged" : "Forging Identity"}
                </div>
                {!isMasterpiece && <div className="text-xs text-muted-foreground mt-1">Heat level: {progress.toFixed(0)}°C</div>}
            </div>
        </div>
    );
};
