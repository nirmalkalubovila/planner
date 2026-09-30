import React, { useState } from 'react';
import {
    formatMinutes, getMoveOptions, itemKey, overrideItem, slotLabel,
    type ResetAction, type ResetContext, type ResetItem,
} from '@llb/core';
import { Card } from '@/components/ui/card';
import { OptionChips } from '@/components/common/option-chips';
import { ACTION_LABEL, itemDetail, shortDayLabel } from '../lib/labels';

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
            <h3 id="reset-recommended" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recommended reset</h3>
            <Card className="divide-y divide-border">
                {GROUPS.map((action) => {
                    const list = items.filter((i) => i.action === action);
                    if (list.length === 0) return null;
                    return (
                        <div key={action} className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-baseline justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-widest">{ACTION_LABEL[action]}</h4>
                                <span className="text-xs font-bold tabular-nums text-muted-foreground">{list.length}</span>
                            </div>
                            <ul className="space-y-3">
                                {list.map((item) => {
                                    const key = itemKey(item);
                                    const open = adjusting && openKey === key;
                                    return (
                                        <li key={key} className="space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold leading-snug break-words">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{itemDetail(item, ctx.todayIdx)}</p>
                                                </div>
                                                {adjusting && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenKey(open ? null : key)}
                                                        aria-expanded={open}
                                                        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-8 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                                                    >
                                                        {open ? 'Close' : 'Edit'}
                                                    </button>
                                                )}
                                            </div>
                                            {!adjusting && <p className="text-[11px] text-muted-foreground/80 leading-snug">{item.reason}</p>}
                                            {open && <ItemEditor ctx={ctx} items={items} item={item} onChange={onChange} />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </Card>
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
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <OptionChips className="grid-cols-2 sm:grid-cols-4" options={actionOptions} value={item.action} onChange={setAction} />

            {item.action === 'move' && options.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Move to</p>
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New length</p>
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
