import React from 'react';
import { Milestone } from '@/types/global-types';
import { cn } from '@/lib/utils';
import { Target, Check } from 'lucide-react';

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
        <div className="mt-2 sm:mt-3 mb-1 space-y-2 sm:space-y-3 select-none animate-in fade-in duration-500">
            {/* Timeline View - Horizontal scrolling on small screens */}
            <div className="relative w-full overflow-x-auto custom-scrollbar pb-1">
                <div className="flex items-center min-w-max gap-1 px-1">
                    {milestones.map((m, idx) => {
                        const milestonePos = ((idx + 1) / totalMilestones) * 100;
                        const isCompleted = m.completed || progressPercentage >= milestonePos;
                        const isCurrent = idx === (activeIdx === -1 ? totalMilestones - 1 : activeIdx);

                        return (
                            <React.Fragment key={m.id}>
                                <div
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 transition-all",
                                        isCurrent ? "scale-105 z-10" : "opacity-80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 sm:w-9 sm:h-9 rounded-full border-[1.5px] flex items-center justify-center transition-all shadow-sm",
                                        isCompleted 
                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                                            : isCurrent 
                                                ? "bg-primary border-primary text-primary-foreground" 
                                                : "bg-muted/20 border-border/40 text-muted-foreground/40"
                                    )}>
                                        {isCompleted ? <Check size={10} strokeWidth={3} /> : <span className="text-[9px] font-black">P{idx + 1}</span>}
                                    </div>
                                    <div className="flex flex-col items-center max-w-[80px] text-center">
                                        <span className={cn(
                                            "text-[9px] font-bold truncate w-full",
                                            isCurrent ? "text-foreground" : "text-muted-foreground/60"
                                        )}>{m.title}</span>
                                        <span className="text-[7px] font-medium opacity-50 uppercase tracking-tighter">{m.targetDate.split('-').slice(1).join('/')}</span>
                                    </div>
                                </div>
                                {idx < milestones.length - 1 && (
                                    <div className={cn(
                                        "h-[2px] w-6 sm:w-10 -mt-8 flex-shrink-0 transition-all",
                                        isCompleted ? "bg-emerald-500" : "bg-border/30"
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Thinner Stats Bar */}
            <div className="flex items-center justify-between gap-4 bg-muted/10 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Status</p>
                        <h4 className="text-xs sm:text-sm font-black flex items-center gap-2">
                            {Math.round(progressPercentage)}% 
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest hidden sm:inline">Constructed</span>
                        </h4>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Executed</p>
                        <h4 className="text-xs sm:text-sm font-black">
                            {milestones.filter((m, idx) => m.completed || progressPercentage >= ((idx + 1) / totalMilestones) * 100).length}
                            <span className="text-muted-foreground/30 font-medium text-[10px] ml-1">/ {totalMilestones}</span>
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
};
