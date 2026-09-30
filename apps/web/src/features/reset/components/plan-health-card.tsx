import React from 'react';
import { formatMinutes, type ResetHealth } from '@llb/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResetCard, ResetLabel, captionClass, primaryButton } from './reset-ui';

interface PlanHealthCardProps {
    health: ResetHealth;
    onStart: () => void;
    onOpenPlanner: () => void;
}

export const PlanHealthCard: React.FC<PlanHealthCardProps> = ({ health, onStart, onOpenPlanner }) => {
    if (!health.hasWork) {
        return (
            <ResetCard className="gap-1.5">
                <ResetLabel text="This week" className="mb-2" />
                <p className="font-bold text-[15px] leading-snug tracking-tight">Nothing left to reset this week.</p>
                <p className="text-xs text-muted-foreground">No planned work is waiting. Plan the next stretch in the Planner.</p>
                <Button variant="outline" onClick={onOpenPlanner} className={cn(primaryButton, 'mt-4 w-full sm:w-auto sm:self-start')}>Open Planner</Button>
            </ResetCard>
        );
    }

    const over = health.overloadMin > 0;
    const atRisk = health.prioritiesAtRisk.length;
    const needsAttention = over || atRisk > 0;

    return (
        <ResetCard>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                <div className="flex flex-col gap-1.5">
                    <ResetLabel text="This week" />
                    <p className="font-bold text-[15px] leading-snug tracking-tight">{needsAttention ? 'Your plan needs attention.' : "You're on track."}</p>
                    {over ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">{formatMinutes(health.overloadMin)} over capacity</span>
                    ) : (
                        <span className={captionClass}>{formatMinutes(health.bufferMin)} buffer remaining</span>
                    )}
                    {atRisk > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground/80">
                            {atRisk} {atRisk === 1 ? 'priority' : 'priorities'} at risk
                        </span>
                    )}
                    {!needsAttention && <span className="text-[10px] font-bold text-muted-foreground/80">No reset needed</span>}
                </div>

                <div className="grid grid-cols-2 gap-6 lg:gap-12">
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-black tabular-nums">{formatMinutes(health.plannedMin)}</span>
                        <span className={captionClass}>Planned</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-black tabular-nums">{formatMinutes(health.availableMin)}</span>
                        <span className={captionClass}>Available</span>
                    </div>
                </div>

                <Button
                    variant={needsAttention ? 'default' : 'outline'}
                    onClick={onStart}
                    className={cn(primaryButton, 'w-full lg:w-auto lg:px-10')}
                >
                    {needsAttention ? 'Make This Realistic' : 'Review Anyway'}
                </Button>
            </div>
        </ResetCard>
    );
};
