import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Goal } from '@llb/core';
import { Button } from '@/components/ui/button';

interface GoalArchiveProps {
    goals: Goal[];
    onDelete: (id: string) => void;
}

const shortDate = (d?: string) => {
    try {
        return d ? format(parseISO(d), 'MMM d, yyyy') : '';
    } catch {
        return d ?? '';
    }
};

/** Completed goals are kept out of the main list: a collapsed Archive with one quiet line per goal. */
export const GoalArchive: React.FC<GoalArchiveProps> = ({ goals, onDelete }) => {
    const [open, setOpen] = useState(false);
    if (goals.length === 0) return null;

    return (
        <section className="pt-2" aria-label="Archived goals">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left hover:border-primary/30 transition-colors cursor-pointer"
            >
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Archive
                    <span className="text-primary">{goals.length}</span>
                </span>
                <span className="text-xs font-semibold text-primary">{open ? 'Hide' : 'Show'}</span>
            </button>

            {open && (
                <ul className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {goals.map((goal) => (
                        <li key={goal.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5">
                            <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary">
                                Done
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-foreground">{goal.title || goal.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {goal.goalType} goal{goal.endDate ? ` · ended ${shortDate(goal.endDate)}` : ''}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 shrink-0 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-accent"
                                onClick={() => onDelete(goal.id!)}
                                aria-label="Delete goal"
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};
