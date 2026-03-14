import React from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { DailyThemeProps } from './types';

export const XpBurst: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
    const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
    const isRelentless = progress >= 100;

    let levelIdentity = "Unstable";
    let levelColor = "text-slate-400";
    let levelNum = 1;

    if (isRelentless) { levelIdentity = "Relentless"; levelColor = "text-purple-300"; levelNum = 10; }
    else if (progress >= 80) { levelIdentity = "Disciplined"; levelColor = "text-blue-400"; levelNum = 8; }
    else if (progress >= 50) { levelIdentity = "Consistent"; levelColor = "text-green-400"; levelNum = 5; }
    else if (progress >= 20) { levelIdentity = "Awakening"; levelColor = "text-yellow-400"; levelNum = 2; }

    return (
        <div className="flex flex-col items-center justify-center py-10 w-full max-w-sm mx-auto relative">
            {isRelentless && <div className="absolute inset-0 bg-purple-500/20 blur-[60px] animate-pulse rounded-full pointer-events-none"></div>}
            <div className="flex items-end justify-between w-full mb-4 px-1 z-10">
                <div className="flex flex-col">
                    {!isRelentless && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</span>}
                    <span className={cn(
                        "text-2xl font-black uppercase tracking-widest transition-all duration-700",
                        levelColor,
                        isRelentless && "text-5xl drop-shadow-[0_0_30px_rgba(192,132,252,1)]"
                    )}>
                        {levelIdentity}
                    </span>
                </div>
                {!isRelentless && (
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase">Level {levelNum}</span>
                    </div>
                )}
            </div>
            <div className={cn(
                "w-full bg-slate-900 border-2 rounded-lg overflow-hidden relative shadow-inner skew-x-[-10deg] transition-all duration-1000 z-10",
                isRelentless ? "h-8 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.8)] scale-105" : "h-6 border-slate-700"
            )}>
                <div
                    className={cn(
                        "h-full bg-gradient-to-r transition-all duration-1000",
                        isRelentless ? "from-purple-600 via-pink-500 to-purple-600 animate-[pulse_1s_infinite]" : "from-blue-600 to-cyan-400"
                    )}
                    style={{ width: `${progress}%` }}
                >
                    <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                    {isRelentless && <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>}
                </div>
            </div>
            <div className="mt-4 z-10">
                {isRelentless ? (
                    <div className="flex gap-1 animate-bounce">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    </div>
                ) : (
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {completedPoints.toFixed(0)} / {totalPoints.toFixed(0)} XP
                    </div>
                )}
            </div>
        </div>
    );
};
