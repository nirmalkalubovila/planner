import React from 'react';
import { cn } from '@/lib/utils';
import { Map, Trophy } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const TerritoryExpansion: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
    const gridRows = 3;
    const gridCols = Math.max(4, Math.ceil(totalTasksCount / 3));
    const totalCells = gridRows * gridCols;
    const progressFill = Math.floor((completedTasksCount / Math.max(totalTasksCount, 1)) * totalCells);
    const isDomination = completedTasksCount > 0 && completedTasksCount === totalTasksCount;

    return (
        <div className="flex flex-col items-center justify-center py-8 relative">
            {isDomination && <div className="absolute inset-0 bg-blue-500/20 blur-[50px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn(
                "grid gap-2 p-3 bg-slate-900 border-2 rounded-xl shadow-xl z-10 transition-all duration-1000",
                isDomination ? "border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.8)] scale-110 bg-blue-900/40" : "border-slate-700"
            )} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                {Array.from({ length: totalCells }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-8 h-8 rounded transition-all",
                            isDomination
                                ? "bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] animate-[pulse_1s_infinite]"
                                : i < progressFill
                                    ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] scale-105 duration-700"
                                    : "bg-slate-800/50 duration-700"
                        )}
                        style={isDomination ? { animationDelay: `${i * 0.1}s` } : undefined}
                    ></div>
                ))}
            </div>
            <div className="mt-8 text-center z-10">
                <div className={cn(
                    "text-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500",
                    isDomination ? "text-blue-300 text-3xl drop-shadow-[0_0_15px_rgba(96,165,250,1)]" : "text-blue-500"
                )}>
                    {isDomination ? <Trophy className="animate-bounce" /> : <Map size={20} />}
                    {isDomination ? "Total Domination" : "Territory"}
                </div>
                {!isDomination && <div className="text-sm font-medium text-slate-400 mt-2">{progressFill} / {totalCells} Zones Conquered</div>}
            </div>
        </div>
    );
};
