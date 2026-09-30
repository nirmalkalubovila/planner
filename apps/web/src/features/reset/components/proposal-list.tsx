import React, { useState } from 'react';
import {
    formatMinutes, getMoveOptions, itemKey, overrideItem, slotLabel,
    type ResetAction, type ResetContext, type ResetItem,
} from '@llb/core';
import { OptionChips } from '@/components/common/option-chips';
import { cn } from '@/lib/utils';
import { ACTION_LABEL, decodeEntities, itemDetail, shortDayLabel } from '../lib/labels';
import { ResetCard, ResetLabel, captionClass } from './reset-ui';

const GROUPS: ResetAction[] = ['keep', 'move', 'reduce', 'remove'];

interface ProposalListProps {
    ctx: ResetContext;
    items: ResetItem[];
    adjusting: boolean;
    onChange: (items: ResetItem[]) => void;
}

export const ProposalList: React.FC<ProposalListProps> = ({ ctx, items, adjusting, onChange }) => {
    const [openKey, setOpenKey] = useState<string | null>(null);

    return (
        <section className="space-y-3" aria-labelledby="reset-recommended">
            <ResetLabel id="reset-recommended" text="Recommended reset" />
            <div className="space-y-4">
                {GROUPS.map((action) => {
                    const list = items.filter((i) => i.action === action);
                    if (list.length === 0) return null;
                    return (
                        <ResetCard key={action} className="gap-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{ACTION_LABEL[action]}</h4>
                                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">{list.length}</span>
                            </div>
                            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {list.map((item) => {
                                    const key = itemKey(item);
                                    const open = adjusting && openKey === key;
                                    return (
                                        <li key={key} className={cn('space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3', open && 'md:col-span-2 xl:col-span-3')}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm tracking-tight leading-snug break-words line-clamp-2" title={decodeEntities(item.name)}>{decodeEntities(item.name)}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{itemDetail(item, ctx.todayIdx)}</p>
                                                </div>
                                                {adjusting && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenKey(open ? null : key)}
                                                        aria-expanded={open}
                                                        className="shrink-0 min-h-8 px-1 text-[10px] font-black uppercase tracking-widest text-primary opacity-80 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                                                    >
                                                        {open ? 'Close' : 'Edit'}
                                                    </button>
                                                )}
                                            </div>
                                            {!adjusting && item.action !== 'keep' && <p className="text-[10px] font-bold text-muted-foreground/80 leading-snug">{item.reason}</p>}
                                            {open && <ItemEditor ctx={ctx} items={items} item={item} onChange={onChange} />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </ResetCard>
                    );
                })}
            </div>
        </section>
    );
};

const ItemEditor: React.FC<{ ctx: ResetContext; items: ResetItem[]; item: ResetItem; onChange: (items: ResetItem[]) => void }> = ({ ctx, items, item, onChange }) => {
    const key = itemKey(item);
    const options = getMoveOptions(ctx, items, item);
    const reduceOptions: number[] = [];
    for (let m = 30; m < item.minutes; m += 30) reduceOptions.push(m);
    const canReduce = (item.type === 'goal' || item.type === 'custom') && reduceOptions.length > 0;

    const setAction = (action: ResetAction) => {
        if (action === 'move') {
            const pick = options.find((o) => o.dayIdx !== item.from.dayIdx) ?? options[0];
            if (pick) onChange(overrideItem(ctx, items, key, { action: 'move', to: pick }));
        } else if (action === 'reduce') {
            const half = reduceOptions[Math.floor((reduceOptions.length - 1) / 2)] ?? 30;
            onChange(overrideItem(ctx, items, key, { action: 'reduce', newMinutes: half, to: item.to ?? item.from }));
        } else {
            onChange(overrideItem(ctx, items, key, { action }));
        }
    };

    const actionOptions = (['keep', 'move', 'reduce', 'remove'] as ResetAction[])
        .filter((a) => (a === 'reduce' ? canReduce : a === 'move' ? options.length > 0 : true))
        .map((a) => ({ value: a, label: ACTION_LABEL[a] }));

    return (
        <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-3">
            <OptionChips className="grid-cols-2 sm:grid-cols-4" options={actionOptions} value={item.action} onChange={setAction} />

            {item.action === 'move' && options.length > 0 && (
                <div className="space-y-2">
                    <p className={captionClass}>Move to</p>
                    <OptionChips
                        className="grid-cols-2 sm:grid-cols-3"
                        value={item.to ? `${item.to.dayIdx}` : undefined}
                        onChange={(v) => {
                            const pick = options.find((o) => `${o.dayIdx}` === v);
                            if (pick) onChange(overrideItem(ctx, items, key, { action: 'move', to: pick }));
                        }}
                        options={options.map((o) => ({ value: `${o.dayIdx}`, label: shortDayLabel(o.dayIdx, ctx.todayIdx), hint: slotLabel(o.startSlot) }))}
                    />
                </div>
            )}

            {item.action === 'reduce' && canReduce && (
                <div className="space-y-2">
                    <p className={captionClass}>New length</p>
                    <OptionChips
                        className="grid-cols-3 sm:grid-cols-4"
                        value={`${item.newMinutes ?? item.minutes}`}
                        onChange={(v) => onChange(overrideItem(ctx, items, key, { action: 'reduce', newMinutes: Number(v), to: item.to ?? item.from }))}
                        options={reduceOptions.map((m) => ({ value: `${m}`, label: formatMinutes(m) }))}
                    />
                </div>
            )}
        </div>
    );
};
