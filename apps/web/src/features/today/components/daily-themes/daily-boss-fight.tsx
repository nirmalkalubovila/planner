import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Swords, Skull, Trophy } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const DailyBossFight: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const bossHp = 100 - progress;
    const isVictory = bossHp <= 0;

    const [hit, setHit] = useState(false);
    const prev = useRef(completedPoints);

    useEffect(() => {
        if (completedPoints > prev.current) {
            setHit(true);
            setTimeout(() => setHit(false), 400);
        }
        prev.current = completedPoints;
    }, [completedPoints]);

    return (
        <div className="flex flex-col items-center justify-center py-6 w-full max-w-sm mx-auto relative overflow-visible">
            {isVictory && <div className="absolute inset-0 bg-yellow-400/30 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className={cn(
                "font-black uppercase tracking-widest mb-6 flex items-center gap-3 transition-all duration-700 z-10",
                isVictory ? "text-yellow-400 text-4xl drop-shadow-[0_0_20px_rgba(250,204,21,1)]" : "text-red-500 text-xl"
            )}>
                {!isVictory && <Swords />}
                {isVictory ? "VICTORY" : "The Daily Grind"}
                {!isVictory && <Swords />}
            </div>
            <div className="relative mb-10 z-10">
                <div className={cn(
                    "transition-all",
                    isVictory ? "scale-125 drop-shadow-[0_0_40px_rgba(250,204,21,0.5)] duration-1000 translate-y-4" : hit ? "scale-90 translate-x-2 brightness-150 drop-shadow-[0_0_20px_rgba(239,68,68,1)] duration-75" : "drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] duration-500"
                )}>
                    {isVictory ? (
                        <div className="relative flex items-center justify-center">
                            <Skull size={120} className="text-slate-800 opacity-20" strokeWidth={1} />
                            <Trophy size={80} className="absolute text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,1)] animate-bounce" fill="currentColor" />
                        </div>
                    ) : (
                        <div className="relative">
                            <Skull size={100} className="text-slate-800" strokeWidth={1.5} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
                                <Skull size={100} className="text-red-500 opacity-50 blur-sm" />
                            </div>
                        </div>
                    )}
                </div>
                {hit && !isVictory && <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white italic drop-shadow-lg z-10 animate-bounce">CRITICAL!</div>}
                {!isVictory && bossHp > 0 && bossHp <= 15 && <div className="absolute -bottom-8 w-full text-center text-sm font-black text-red-500 animate-pulse uppercase tracking-widest drop-shadow-md">FINISH HIM!</div>}
            </div>
            {!isVictory && (
                <div className="w-full z-10">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2 px-1">
                        <span>Boss HP</span>
                        <span>{bossHp.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-5 bg-slate-900 border-2 border-slate-700 rounded-sm overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-red-600 transition-all duration-500 float-right shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                            style={{ width: `${bossHp}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};
