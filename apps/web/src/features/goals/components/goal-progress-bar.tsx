import React from 'react';
import { Milestone } from '@/types/global-types';
import { cn } from '@/lib/utils';
import { Target, Check, Play } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface GoalProgressBarProps {
    milestones: Milestone[];
    progressPercentage: number;
    startDate?: string;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ milestones, progressPercentage, startDate }) => {
    if (!milestones || milestones.length === 0) return null;

    const totalMilestones = milestones.length;

    const activeIdx = milestones.findIndex((_, idx) => {
        const position = ((idx + 1) / totalMilestones) * 100;
        return progressPercentage < position;
    });

    const completedCount = milestones.filter((m, idx) =>
        m.completed || progressPercentage >= ((idx + 1) / totalMilestones) * 100
    ).length;

    const startLabel = startDate ? formatShort(startDate) : 'Start';

    return (
        <div className="mt-1 space-y-2 select-none">
            {/* Progress bar with percentage */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                    <Target size={12} className="text-primary/60" />
                    <span className="text-xs font-bold text-foreground font-mono">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest shrink-0">
                    {completedCount}/{totalMilestones}
                </span>
            </div>

            {/* Timeline dots: Start → P1 → P2 → ... → PN */}
            <div className="relative w-full overflow-x-auto pb-1">
                <div className="flex items-center min-w-max gap-0.5 px-0.5">
                    {/* Starting point */}
                    <div className="flex flex-col items-center gap-1 min-w-[48px]">
                        <div className="w-6 h-6 rounded-full border-[1.5px] border-intent-goal bg-intent-goal-muted flex items-center justify-center shadow-[0_0_8px_hsl(var(--intent-goal)/0.25)]">
                            <Play size={9} className="text-intent-goal ml-0.5" />
                        </div>
                        <span className="text-[8px] font-bold text-intent-goal">Start</span>
                        <span className="text-[7px] text-muted-foreground">{startLabel}</span>
                    </div>

                    {milestones.map((m, idx) => {
                        const milestonePos = ((idx + 1) / totalMilestones) * 100;
                        const isCompleted = m.completed || progressPercentage >= milestonePos;
                        const isCurrent = idx === (activeIdx === -1 ? totalMilestones - 1 : activeIdx);

                        return (
                            <React.Fragment key={m.id}>
                                {/* Connector line */}
                                <div className={cn(
                                    "h-[2px] flex-1 min-w-[20px] sm:min-w-[32px]",
                                    isCompleted ? "bg-intent-goal/60" : "bg-muted"
                                )} />

                                {/* Milestone node */}
                                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all",
                                        isCompleted
                                            ? "bg-intent-goal-muted border-intent-goal text-intent-goal"
                                            : "bg-muted border-border text-muted-foreground"
                                    )}>
                                        {isCompleted
                                            ? <Check size={10} strokeWidth={3} />
                                            : <span className="text-[8px] font-black">P{idx + 1}</span>
                                        }
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-bold truncate max-w-[64px] text-center leading-tight",
                                        isCompleted ? "text-intent-goal" : "text-muted-foreground"
                                    )}>
                                        {m.title}
                                    </span>
                                    <span className="text-[7px] text-muted-foreground/70">
                                        {formatShort(m.targetDate)}
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

function formatShort(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'MM/dd');
    } catch {
        return dateStr;
    }
}
