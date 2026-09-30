import React from 'react';
import {
    formatMinutes, type ResetGoalImpact, type ResetHabitNote, type ResetSummary,
} from '@llb/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResetCard, ResetLabel, buttonText, captionClass } from './reset-ui';

export const BeforeAfter: React.FC<{ summary: ResetSummary }> = ({ summary }) => {
    const { counts } = summary;
    return (
        <section className="space-y-3" aria-labelledby="reset-before-after">
            <ResetLabel id="reset-before-after" text="Before and after" />
            <ResetCard>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div className="flex flex-col gap-1">
                        <span className={captionClass}>Before</span>
                        <span className="text-2xl font-black tabular-nums">{formatMinutes(summary.beforeMin)}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/80">
                            {summary.beforeOverloadMin > 0 ? `+${formatMinutes(summary.beforeOverloadMin)} overloaded` : 'Within capacity'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className={captionClass}>After</span>
                        <span className="text-2xl font-black tabular-nums text-primary">{formatMinutes(summary.afterMin)}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/80">{formatMinutes(summary.afterBufferMin)} buffer</span>
                    </div>
                </div>
                <p className="mt-5 border-t border-border pt-4 text-[10px] font-bold text-muted-foreground/80">
                    {counts.keep} protected · {counts.move} moved · {counts.reduce} reduced · {counts.remove} removed from this week's plan
                </p>
            </ResetCard>
        </section>
    );
};

interface GoalImpactProps {
    impacts: ResetGoalImpact[];
    protectedGoalId?: string | null;
    onProtect: (goalId: string) => void;
}

export const GoalImpact: React.FC<GoalImpactProps> = ({ impacts, protectedGoalId, onProtect }) => {
    // One or two goals only: the ones at risk first, then the goal behind a weekly priority
    const shown = impacts.slice(0, 2);
    if (shown.length === 0) return null;
    return (
        <section className="space-y-3" aria-labelledby="reset-goal-impact">
            <ResetLabel id="reset-goal-impact" text="Goal impact" />
            <div className="space-y-3">
                {shown.map((g) => (
                    <ResetCard key={g.goalId ?? g.name} className="gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-sm sm:text-base tracking-tight leading-tight break-words min-w-0">{g.name}</p>
                            <span className={cn('shrink-0 text-[10px] font-black uppercase tracking-wider', g.status === 'at_risk' ? 'text-primary' : 'text-muted-foreground')}>
                                {g.status === 'on_track' ? 'Still on track' : 'At risk'}
                            </span>
                        </div>
                        {g.protectedNames.length > 0 && (
                            <div className="space-y-1">
                                <span className={captionClass}>Protected</span>
                                <p className="text-xs text-muted-foreground leading-snug">{g.protectedNames.join(', ')}</p>
                            </div>
                        )}
                        {g.status === 'at_risk' && (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground leading-snug">Trimmed to fit: {g.trimmedNames.join(', ')}.</p>
                                {g.goalId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={protectedGoalId === g.goalId}
                                        onClick={() => onProtect(g.goalId!)}
                                        className={cn('h-9 rounded-xl px-4', buttonText)}
                                    >
                                        {protectedGoalId === g.goalId ? 'Protecting this goal' : 'Protect This Goal'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </ResetCard>
                ))}
            </div>
        </section>
    );
};

export const HabitNotes: React.FC<{ notes: ResetHabitNote[] }> = ({ notes }) => {
    if (notes.length === 0) return null;
    return (
        <section className="space-y-3" aria-labelledby="reset-habits">
            <ResetLabel id="reset-habits" text="Habits" />
            <ResetCard className="gap-4">
                {notes.map((h) => (
                    <div key={h.name} className="space-y-0.5">
                        <p className="font-bold text-sm sm:text-base tracking-tight leading-tight">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Target {h.target}× · Done {h.completed}× · Realistic this week {h.realistic}×
                        </p>
                    </div>
                ))}
                <p className="border-t border-border pt-4 text-[10px] font-bold text-muted-foreground/80">Your habit schedule stays as it is. This is only what fits this week.</p>
            </ResetCard>
        </section>
    );
};
