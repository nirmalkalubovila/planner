import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DailyThemeProps } from './types';

export const EngineDashboard: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const [rpm, setRpm] = useState(0);
    const [isShifting, setIsShifting] = useState(false);
    const prevPointsRef = useRef(completedPoints);

    const progressPercentage = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isMaxGear = progressPercentage >= 100;
    const gear = isMaxGear ? "MAX" : Math.min(Math.floor(progressPercentage / 20) + 1, 6);

    useEffect(() => {
        if (isMaxGear) {
            const interval = setInterval(() => {
                setRpm(8500 + Math.random() * 500);
            }, 100);
            return () => clearInterval(interval);
        }

        if (completedPoints > prevPointsRef.current) {
            setRpm(8500);
            setIsShifting(true);
            const shiftTimeout = setTimeout(() => {
                setRpm(1500 + (typeof gear === 'number' ? gear : 6) * 500);
                setIsShifting(false);
            }, 600);
            prevPointsRef.current = completedPoints;
            return () => clearTimeout(shiftTimeout);
        } else if (completedPoints < prevPointsRef.current) {
            prevPointsRef.current = completedPoints;
            setRpm(1000);
            setTimeout(() => setRpm(1500), 400);
        } else {
            setRpm(completedPoints > 0 ? 1500 + (typeof gear === 'number' ? gear : 6) * 400 + Math.random() * 200 - 100 : 0);
        }
    }, [completedPoints, gear, isMaxGear]);

    const calculateRotation = (currentRpm: number) => {
        const minRotation = -120;
        const rpmRatio = Math.min(Math.max(currentRpm / 9000, 0), 1);
        return minRotation + (rpmRatio * 240);
    };

    const needleRotation = calculateRotation(rpm);

    return (
        <div className="w-full max-w-md mx-auto space-y-6 my-6 relative">
            {isMaxGear && <div className="absolute inset-0 bg-red-500/10 blur-[40px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className="relative flex justify-center items-center z-10">
                <div className={cn(
                    "relative w-48 h-48 rounded-full bg-slate-900 border-4 border-slate-800 shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300",
                    isMaxGear ? "shadow-[0_0_60px_rgba(239,68,68,0.8)] border-red-500 animate-pulse" : (isShifting && "shadow-[0_0_40px_rgba(239,68,68,0.5)] border-red-500/50")
                )}>
                    <div className="absolute inset-2 rounded-full border border-slate-700/50"></div>
                    <div className={cn("absolute inset-0 p-4 text-xs font-bold transition-colors", isMaxGear ? "text-red-400" : "text-slate-400")}>
                        <div className="absolute bottom-6 left-6">0</div>
                        <div className="absolute top-12 left-4">3</div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">5</div>
                        <div className="absolute top-12 right-4 text-red-500 font-black scale-125">7</div>
                        <div className="absolute bottom-6 right-6 text-red-500 font-black scale-150">9</div>
                    </div>
                    <div
                        className="absolute w-2 h-24 bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom transition-transform z-10"
                        style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)`, transitionDuration: (isShifting || isMaxGear) ? "100ms" : "800ms" }}
                    >
                        <div className={cn(
                            "w-1 h-20 bg-red-500 mx-auto rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]",
                            (isShifting || isMaxGear) && "bg-white shadow-[0_0_20px_rgba(255,255,255,1)] w-1.5"
                        )}></div>
                    </div>
                    <div className="absolute w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600 z-20 flex items-center justify-center shadow-inner"></div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className={cn("font-mono font-bold tracking-tight drop-shadow-md", isMaxGear ? "text-red-500 text-3xl animate-bounce" : "text-white text-xl")}>
                            {isMaxGear ? "MAX" : Math.floor(rpm / 100) * 100}
                        </span>
                        {!isMaxGear && <span className="text-[9px] uppercase tracking-widest text-slate-500">RPM</span>}
                    </div>
                </div>
            </div>
            <div className={cn(
                "bg-card border rounded-xl p-4 space-y-3 z-10 relative transition-all duration-1000",
                isMaxGear ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "shadow-sm"
            )}>
                <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gear</span>
                        <span className={cn("font-bold leading-none transition-all", isMaxGear ? "text-3xl text-red-500 animate-pulse italic" : "text-xl text-primary")}>
                            GEAR {gear}
                        </span>
                    </div>
                    {!isMaxGear && <div className="text-right text-sm font-mono font-bold">{progressPercentage.toFixed(1)}%</div>}
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full transition-all duration-1000 ease-out",
                            isMaxGear ? "bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.8),rgba(0,0,0,0.8)_10px,white_10px,white_20px)] animate-[slide_0.5s_linear_infinite]" : "bg-gradient-to-r from-blue-500 to-red-500"
                        )}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
