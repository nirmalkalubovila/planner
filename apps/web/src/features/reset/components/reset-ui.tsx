import React from 'react';
import { cn } from '@/lib/utils';

// The same card the Goals and Today pages use: solid card surface, hairline border, rounded-2xl and
// the gold accent bar down the left edge. Reset must read as part of those pages, not a new kind of screen.

export const ResetCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div
        className={cn(
            'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card',
            'p-4 pl-5 sm:p-5 sm:pl-6 transition-[border-color] duration-150 hover:border-primary/40',
            className,
        )}
    >
        <div aria-hidden className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-primary/70" />
        {children}
    </div>
);

/** Section label: identical to the Performance page's <Label>. */
export const ResetLabel: React.FC<{ text: string; id?: string; className?: string }> = ({ text, id, className }) => (
    <p id={id} className={cn('text-xs uppercase tracking-widest font-bold text-muted-foreground', className)}>{text}</p>
);

/** Small caption: the 10px black uppercase style used under numbers across the app. */
export const captionClass = 'text-[10px] font-black uppercase tracking-wider text-muted-foreground';

/** Button text treatment used by the app's gold and outline buttons (see the milestone and feedback dialogs). */
export const buttonText = 'font-black uppercase tracking-wider text-xs';
export const primaryButton = cn('h-11 rounded-2xl px-6', buttonText);
