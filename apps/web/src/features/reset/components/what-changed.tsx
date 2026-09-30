import React from 'react';
import type { ResetReason } from '@llb/core';
import { OptionChips } from '@/components/common/option-chips';
import { Input } from '@/components/ui/input';
import { ResetLabel } from './reset-ui';

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
    otherText: string;
    onOtherText: (text: string) => void;
}

export const WhatChanged: React.FC<WhatChangedProps> = ({ value, onToggle, onSkip, otherText, onOtherText }) => (
    <section className="space-y-3" aria-labelledby="reset-what-changed">
        <div className="flex items-center justify-between gap-3">
            <ResetLabel id="reset-what-changed" text="What changed?" />
            <button
                type="button"
                onClick={onSkip}
                className="text-[10px] font-black uppercase tracking-widest text-primary opacity-80 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
                Skip
            </button>
        </div>
        <OptionChips className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" options={OPTIONS} value={value} onChange={onToggle} />
        {value.includes('other') && (
            <Input
                value={otherText}
                onChange={(e) => onOtherText(e.target.value)}
                maxLength={120}
                placeholder="What changed? A few words is enough."
                aria-label="What changed"
                autoFocus
                className="h-11 rounded-xl bg-card text-sm"
            />
        )}
    </section>
);
