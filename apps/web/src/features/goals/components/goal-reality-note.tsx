import React from 'react';
import type { RealismNote } from '@llb/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GoalRealityNoteProps {
    note: RealismNote | null;
    /** Applies the suggested length to the form. */
    onUseSuggestion: (months: number) => void;
}

const LEVEL_LABEL: Record<RealismNote['level'], string> = {
    ok: 'Reality check',
    stretch: 'Reality check: a stretch',
    unrealistic: 'Reality check: unlikely in this time',
};

/**
 * A short, honest note under the duration field. The AI plans exactly what it is given, so a goal that cannot be
 * reached in the chosen time is flagged here, with a timeline that can work, before anything is generated.
 */
export const GoalRealityNote: React.FC<GoalRealityNoteProps> = ({ note, onUseSuggestion }) => {
    if (!note) return null;
    const warn = note.level !== 'ok';
    const years = note.suggestedMonths ? Math.ceil(note.suggestedMonths / 12) : 0;
    const suggestion = note.suggestedMonths
        ? note.suggestedMonths > 12 ? `${years} ${years === 1 ? 'year' : 'years'}` : `${note.suggestedMonths} months`
        : '';

    return (
        <div
            role="status"
            className={cn(
                'md:col-span-2 space-y-2 rounded-xl border p-4',
                warn ? 'border-primary/30 bg-primary/[0.05]' : 'border-border bg-muted/20',
            )}
        >
            <p className={cn('text-[10px] font-black uppercase tracking-widest', warn ? 'text-primary' : 'text-muted-foreground')}>
                {LEVEL_LABEL[note.level]}
            </p>
            <p className="text-sm leading-snug text-foreground">{note.detail}</p>
            {warn && note.suggestedMonths && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUseSuggestion(note.suggestedMonths!)}
                    className="h-9 rounded-xl px-4 font-black uppercase tracking-wider text-xs"
                >
                    Use {suggestion}
                </Button>
            )}
        </div>
    );
};
