import React from 'react';
import {
    formatMinutes, type ResetGoalImpact, type ResetHabitNote, type ResetSummary,
} from '@llb/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const eyebrow = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground';

export const BeforeAfter: React.FC<{ summary: ResetSummary }> = ({ summary }) => {
    const { counts } = summary;
    return (
        <section className="space-y-3" aria-labelledby="reset-before-after">
            <h3 id="reset-before-after" className={eyebrow}>Before and after</h3>
            <Card className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <p className={eyebrow}>Before</p>
                        <p className="text-2xl font-bold tabular-nums mt-1">{formatMinutes(summary.beforeMin)} <span className="text-sm font-medium text-muted-foreground">planned</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {summary.beforeOverloadMin > 0 ? `+${formatMinutes(summary.beforeOverloadMin)} overloaded` : 'Within capacity'}
                        </p>
                    </div>
                    <div>
                        <p className={eyebrow}>After</p>
                        <p className="text-2xl font-bold tabular-nums mt-1">{formatMinutes(summary.afterMin)} <span className="text-sm font-medium text-muted-foreground">planned</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatMinutes(summary.afterBufferMin)} buffer</p>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                    {counts.keep} protected · {counts.move} moved · {counts.reduce} reduced · {counts.remove} removed from this week's plan
                </p>
            </Card>
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
            <h3 id="reset-goal-impact" className={eyebrow}>Goal impact</h3>
            <div className="space-y-3">
                {shown.map((g) => (
                    <Card key={g.goalId ?? g.name} className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-snug break-words min-w-0">{g.name}</p>
                            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {g.status === 'on_track' ? 'Still on track' : 'Goal at risk'}
                            </span>
                        </div>
                        {g.protectedNames.length > 0 && (
                            <div className="space-y-1">
                                <p className={eyebrow}>Protected</p>
                                <p className="text-sm text-muted-foreground leading-snug">{g.protectedNames.join(', ')}</p>
                            </div>
                        )}
                        {g.status === 'at_risk' && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground leading-snug">
                                    Trimmed to fit: {g.trimmedNames.join(', ')}.
                                </p>
                                {g.goalId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={protectedGoalId === g.goalId}
                                        onClick={() => onProtect(g.goalId!)}
                                    >
                                        {protectedGoalId === g.goalId ? 'Protecting this goal' : 'Protect This Goal'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </section>
    );
};

export const HabitNotes: React.FC<{ notes: ResetHabitNote[] }> = ({ notes }) => {
    if (notes.length === 0) return null;
    return (
        <section className="space-y-3" aria-labelledby="reset-habits">
            <h3 id="reset-habits" className={eyebrow}>Habits</h3>
            <Card className="p-4 sm:p-5 space-y-4">
                {notes.map((h) => (
                    <div key={h.name} className="space-y-1">
                        <p className="text-sm font-semibold">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Target {h.target}× · Done {h.completed}× · Realistic this week {h.realistic}×
                        </p>
                    </div>
                ))}
                <p className="text-xs text-muted-foreground border-t border-border pt-3">Your habit schedule stays as it is. This is only what fits this week.</p>
            </Card>
        </section>
    );
};
