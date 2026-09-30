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
            <ResetCard className="items-center text-center">
                <ResetLabel text="This week" className="mb-4" />
                <p className="text-sm font-bold tracking-tight">Nothing left to reset this week.</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">No planned work is waiting. Plan the next stretch in the Planner.</p>
                <Button variant="outline" onClick={onOpenPlanner} className={cn(primaryButton, 'mt-6')}>Open Planner</Button>
            </ResetCard>
        );
    }

    const over = health.overloadMin > 0;
    const atRisk = health.prioritiesAtRisk.length;
    const needsAttention = over || atRisk > 0;

    return (
        <ResetCard className="items-center text-center">
            <ResetLabel text="This week" className="mb-4" />
            <p className="text-sm font-bold tracking-tight">{needsAttention ? 'Your plan needs attention.' : "You're on track."}</p>

            <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black tabular-nums">{formatMinutes(health.plannedMin)}</span>
                    <span className={captionClass}>Planned</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black tabular-nums">{formatMinutes(health.availableMin)}</span>
                    <span className={captionClass}>Available</span>
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-0.5">
                {over ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">{formatMinutes(health.overloadMin)} over capacity</span>
                ) : (
                    <span className={captionClass}>{formatMinutes(health.bufferMin)} buffer remaining</span>
                )}
                {atRisk > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground/80 mt-0.5">
                        {atRisk} {atRisk === 1 ? 'priority' : 'priorities'} at risk
                    </span>
                )}
                {!needsAttention && <span className="text-[10px] font-bold text-muted-foreground/80 mt-0.5">No reset needed</span>}
            </div>

            {needsAttention ? (
                <Button onClick={onStart} className={cn(primaryButton, 'mt-6 w-full sm:w-auto sm:px-10')}>Make This Realistic</Button>
            ) : (
                <Button variant="outline" onClick={onStart} className={cn(primaryButton, 'mt-6 w-full sm:w-auto sm:px-10')}>Review Anyway</Button>
            )}
        </ResetCard>
    );
};
