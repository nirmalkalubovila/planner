import React from 'react';
import { cn } from '@/lib/utils';

// The same card, label and button treatment the Performance and Today pages use,
// so Reset reads as part of the same product.

export const ResetCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div
        className={cn(
            'relative flex flex-col overflow-hidden rounded-3xl p-4 sm:p-6',
            'bg-card/80 backdrop-blur-md border border-border animate-in fade-in duration-500',
            className,
        )}
    >
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
