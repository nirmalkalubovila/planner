import React from 'react';
import type { ResetReason } from '@llb/core';
import { OptionChips } from '@/components/common/option-chips';

const OPTIONS: { value: ResetReason; label: string }[] = [
    { value: 'unexpected', label: 'Unexpected work' },
    { value: 'less_time', label: 'Less time' },
    { value: 'low_energy', label: 'Low energy' },
    { value: 'priority_changed', label: 'Priority changed' },
    { value: 'took_longer', label: 'Task took longer' },
    { value: 'other', label: 'Other' },
];

interface WhatChangedProps {
    value: ResetReason[];
    onToggle: (reason: ResetReason) => void;
    onSkip: () => void;
}

export const WhatChanged: React.FC<WhatChangedProps> = ({ value, onToggle, onSkip }) => (
    <section className="space-y-3" aria-labelledby="reset-what-changed">
        <div className="flex items-center justify-between gap-3">
            <h3 id="reset-what-changed" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">What changed?</h3>
            <button
                type="button"
                onClick={onSkip}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
                Skip, detect automatically
            </button>
        </div>
        <OptionChips className="grid-cols-2 sm:grid-cols-3" options={OPTIONS} value={value} onChange={onToggle} />
    </section>
);
