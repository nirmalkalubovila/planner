import React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const DisciplineBattery: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isOverdrive = progress >= 100;

    return (
        <div className={cn("flex flex-col items-center justify-center py-10 transition-colors duration-1000 relative", isOverdrive && "py-12")}>
            {isOverdrive && <div className="absolute inset-0 bg-yellow-500/10 blur-[40px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn(
                "relative w-24 h-48 border-4 border-slate-700 rounded-2xl p-1 overflow-visible bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-700 z-10",
                isOverdrive && "border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,1)] scale-110"
            )}>
                <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 rounded-t-sm transition-colors duration-700", isOverdrive ? "bg-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,1)]" : "bg-slate-700")}></div>
                {isOverdrive && (
                    <>
                        <Zap className="absolute -left-12 top-1/4 w-10 h-10 text-yellow-400 animate-ping -rotate-45 opacity-70" />
                        <Zap className="absolute -right-12 bottom-1/4 w-10 h-10 text-yellow-400 animate-ping rotate-45 opacity-70" style={{ animationDelay: '0.5s' }} />
                    </>
                )}
                <div className="absolute inset-1 bottom-1 flex flex-col justify-end overflow-hidden rounded-sm">
                    <div
                        className={cn("w-full transition-all duration-1000 bg-gradient-to-t",
                            isOverdrive ? "from-yellow-500 to-yellow-100 animate-[pulse_0.5s_infinite] shadow-[0_0_30px_rgba(250,204,21,1)]" : "from-emerald-600 to-emerald-400"
                        )}
                        style={{ height: `${progress}%` }}
                    >
                        {progress > 0 && <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>}
                    </div>
                </div>
                {progress > 0 && <Zap className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 transition-all duration-500", isOverdrive ? "text-slate-900 w-16 h-16 animate-pulse" : "text-white/50")} />}
            </div>
            <div className="mt-8 text-center z-10">
                <div className={cn("text-2xl font-black tracking-[0.2em] uppercase transition-all duration-500", isOverdrive ? "text-yellow-400 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,1)] text-3xl" : "text-emerald-500")}>
                    {isOverdrive ? "OVERDRIVE MODE" : "Charging..."}
                </div>
                {!isOverdrive && <div className="text-sm font-medium text-muted-foreground mt-1">{progress.toFixed(0)}% Power</div>}
            </div>
            <style>{`@keyframes slide { from { background-position: 0 0; } to { background-position: 20px 20px; } }`}</style>
        </div>
    );
};
