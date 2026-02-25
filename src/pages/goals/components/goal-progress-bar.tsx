import React from 'react';
import { Milestone } from '@/types/global-types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface GoalProgressBarProps {
    milestones: Milestone[];
    progressPercentage: number;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ milestones, progressPercentage }) => {
    if (!milestones || milestones.length === 0) return null;

    const totalMilestones = milestones.length;

    return (
        <div className="mt-8 mb-6 relative h-2 flex items-center w-full">
            {/* Background Line */}
            <div className="absolute left-0 right-0 h-1.5 bg-muted/60 rounded-full" />

            {/* Progress Line - Vibrant Emerald/Green */}
            <div
                className="absolute left-0 h-1.5 bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${progressPercentage}%` }}
            />

            {/* Milestone Dots & Gaps */}
            <div className="relative w-full flex justify-between h-0 items-center">
                {milestones.map((m, idx) => {
                    const position = ((idx + 1) / totalMilestones) * 100;
                    const isReached = progressPercentage >= position || m.completed;

                    return (
                        <div key={m.id} className="absolute flex flex-col items-center group/dot" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                            <div
                                className={cn(
                                    "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-500 z-10 flex items-center justify-center bg-background",
                                    isReached
                                        ? "border-emerald-500 border-[5px] scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)] fill-emerald-500"
                                        : "border-muted-foreground/30 border-[3px]"
                                )}
                            />

                            {/* Floating Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover/dot:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/dot:translate-y-0 pointer-events-none z-30">
                                <div className="bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 flex flex-col items-center rounded shadow-xl border border-border/50 whitespace-nowrap backdrop-blur-sm">
                                    <span>{m.title}</span>
                                    <span className="text-muted-foreground text-[8px] font-normal">{m.targetDate}</span>
                                </div>
                                <div className="w-2 h-2 bg-popover border-b border-r transform rotate-45 mx-auto -mt-1 shadow-sm"></div>
                            </div>

                            {/* Label Below */}
                            <div className="absolute top-6 flex flex-col items-center">
                                <span className={cn(
                                    "text-[8px] md:text-[9px] font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap px-1 py-0.5 rounded",
                                    isReached
                                        ? "text-emerald-600 bg-emerald-500/10"
                                        : "text-muted-foreground/60"
                                )}>
                                    {m.title}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
