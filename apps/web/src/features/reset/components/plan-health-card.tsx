import React from 'react';
import { formatMinutes, type ResetHealth } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PlanHealthCardProps {
    health: ResetHealth;
    onStart: () => void;
    onOpenPlanner: () => void;
}

const eyebrow = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground';

export const PlanHealthCard: React.FC<PlanHealthCardProps> = ({ health, onStart, onOpenPlanner }) => {
    if (!health.hasWork) {
        return (
            <Card className="p-5 sm:p-6 space-y-4">
                <p className={eyebrow}>This week</p>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-tight">Nothing left to reset this week.</h3>
                    <p className="text-sm text-muted-foreground">No planned work is waiting. Plan the next stretch in the Planner.</p>
                </div>
                <Button variant="outline" onClick={onOpenPlanner}>Open Planner</Button>
            </Card>
        );
    }

    const over = health.overloadMin > 0;
    const atRisk = health.prioritiesAtRisk.length;

    return (
        <Card className="p-5 sm:p-6 space-y-5">
            <p className={eyebrow}>This week</p>
            <h3 className="text-lg font-bold tracking-tight">{over || atRisk > 0 ? 'Your plan needs attention.' : "You're on track."}</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatMinutes(health.plannedMin)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Planned</p>
                </div>
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatMinutes(health.availableMin)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Available</p>
                </div>
            </div>

            <div className="space-y-1 border-t border-border pt-4">
                {over ? (
                    <p className="text-sm font-semibold text-primary">{formatMinutes(health.overloadMin)} over capacity</p>
                ) : (
                    <p className="text-sm font-semibold">{formatMinutes(health.bufferMin)} buffer remaining</p>
                )}
                {atRisk > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {atRisk} {atRisk === 1 ? 'priority' : 'priorities'} at risk
                    </p>
                )}
                {!over && atRisk === 0 && <p className="text-sm text-muted-foreground">No reset needed.</p>}
            </div>

            {over || atRisk > 0 ? (
                <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>Make This Realistic</Button>
            ) : (
                <Button variant="outline" onClick={onStart}>Review Anyway</Button>
            )}
        </Card>
    );
};
