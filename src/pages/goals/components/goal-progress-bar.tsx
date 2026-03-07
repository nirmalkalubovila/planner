import React from 'react';
import { Milestone } from '@/types/global-types';
import { cn } from '@/lib/utils';
import { Calendar, Target, Check } from 'lucide-react';

interface GoalProgressBarProps {
    milestones: Milestone[];
    progressPercentage: number;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ milestones, progressPercentage }) => {
    if (!milestones || milestones.length === 0) return null;

    const totalMilestones = milestones.length;

    // Find active phase index
    const activeIdx = milestones.findIndex((_, idx) => {
        const position = ((idx + 1) / totalMilestones) * 100;
        return progressPercentage < position;
    });

    return (
        <div className="mt-4 sm:mt-8 mb-4 sm:mb-6 space-y-4 sm:space-y-6 select-none animate-in fade-in duration-500">
            {/* Minimalist Grid - Never overlaps, fast to render */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {milestones.map((m, idx) => {
                    const milestonePos = ((idx + 1) / totalMilestones) * 100;
                    const isCompleted = m.completed || progressPercentage >= milestonePos;
                    const isCurrent = idx === (activeIdx === -1 ? totalMilestones - 1 : activeIdx);

                    return (
                        <div
                            key={m.id}
                            className={cn(
                                "relative p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all h-full",
                                isCompleted
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
                                    : isCurrent
                                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "bg-muted/30 border-border/50 text-muted-foreground/60"
                            )}
                        >
                            <div className="flex flex-col h-full justify-between gap-1.5 sm:gap-2">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-[8px] sm:text-[9px] font-black tracking-widest uppercase",
                                        isCurrent ? "text-primary-foreground/80" : "text-muted-foreground/50"
                                    )}>P {idx + 1}</span>
                                    {isCompleted && <Check size={10} className="stroke-[3] sm:w-3 sm:h-3" />}
                                </div>

                                <span className="text-[10px] sm:text-[11px] font-bold leading-tight break-words">
                                    {m.title}
                                </span>

                                <div className={cn(
                                    "flex items-center gap-1",
                                    isCurrent ? "text-primary-foreground/70" : "text-muted-foreground/40"
                                )}>
                                    <Calendar size={9} className="sm:w-2.5 sm:h-2.5" />
                                    <span className="text-[8px] sm:text-[9px] font-medium">{m.targetDate}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance-Friendly Stats Bar */}
            <div className="flex items-center justify-between gap-3 bg-accent/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 transition-all">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Progress</p>
                        <h4 className="text-xl sm:text-2xl font-black tracking-tight">{Math.round(progressPercentage)}%</h4>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8">
                    <div className="text-right">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Done</p>
                        <h4 className="text-lg sm:text-xl font-black">
                            {milestones.filter((m, idx) => m.completed || progressPercentage >= ((idx + 1) / totalMilestones) * 100).length}
                            <span className="text-muted-foreground font-medium text-xs sm:text-sm ml-1">/ {totalMilestones}</span>
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
};
