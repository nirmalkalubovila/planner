import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    analyzeHealth, applyProposalToGrid, buildProposal, createResetContext, findOverlaps, goalImpact, habitNotes,
    slotToTime, summarizeProposal, toast, type ResetAction, type ResetItem, type ResetReason,
} from '@llb/core';
import { useDeferToMissedLibrary, useRestoreFromMissedLibrary, useSaveWeekPlan } from '@llb/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useResetData } from './hooks/use-reset-data';
import { PlanHealthCard } from './components/plan-health-card';
import { WhatChanged } from './components/what-changed';
import { ProposalList } from './components/proposal-list';
import { BeforeAfter, GoalImpact, HabitNotes } from './components/impact-sections';
import { ResetCard, ResetLabel, buttonText, primaryButton } from './components/reset-ui';

type Phase = 'health' | 'proposal' | 'complete';

export const ResetPage: React.FC = () => {
    const navigate = useNavigate();
    const data = useResetData();
    const savePlan = useSaveWeekPlan();
    const defer = useDeferToMissedLibrary();
    const restore = useRestoreFromMissedLibrary();

    const [phase, setPhase] = useState<Phase>('health');
    const [now, setNow] = useState(() => new Date());
    const [reasons, setReasons] = useState<ResetReason[]>([]);
    const [otherText, setOtherText] = useState('');
    const [protectGoalId, setProtectGoalId] = useState<string | null>(null);
    const [items, setItems] = useState<ResetItem[]>([]);
    const [adjusting, setAdjusting] = useState(false);
    const [applying, setApplying] = useState(false);
    const [doneCounts, setDoneCounts] = useState<Record<ResetAction, number> | null>(null);
    const baseline = useRef<{ updatedAt: string | null; completed: string } | null>(null);

    // Plan health: the week as it is right now
    const healthCtx = useMemo(() => createResetContext(data.buildInput(now)), [data.buildInput, now]);
    const health = useMemo(() => analyzeHealth(healthCtx), [healthCtx]);

    // The proposal context adds what the user told us changed, and any goal they chose to protect
    const ctx = useMemo(
        () => (phase === 'proposal' ? createResetContext(data.buildInput(now, { reasons, protectGoalId })) : healthCtx),
        [phase, data.buildInput, now, reasons, protectGoalId, healthCtx],
    );

    // Recompute only when the inputs that define a proposal change, so manual edits are not thrown away by a refetch
    useEffect(() => {
        if (phase === 'proposal') setItems(buildProposal(ctx));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, reasons, protectGoalId]);

    const summary = useMemo(() => summarizeProposal(ctx, items), [ctx, items]);
    const impacts = useMemo(() => goalImpact(ctx, items), [ctx, items]);
    const habits = useMemo(() => habitNotes(ctx), [ctx]);

    const hasPlan = Object.keys(data.grid).some((k) => /^\d+-\d+$/.test(k));
    const nothingToChange = summary.counts.move + summary.counts.reduce + summary.counts.remove === 0;

    const start = () => {
        setNow(new Date());
        setReasons([]);
        setOtherText('');
        setProtectGoalId(null);
        setAdjusting(false);
        baseline.current = { updatedAt: data.updatedAt, completed: JSON.stringify(data.completedByDay) };
        setPhase('proposal');
    };

    const toggleReason = (reason: ResetReason) =>
        setReasons((cur) => (cur.includes(reason) ? cur.filter((r) => r !== reason) : [...cur, reason]));

    const cancel = () => {
        setPhase('health');
        setAdjusting(false);
        setItems([]);
    };

    const apply = async () => {
        if (applying) return;
        setApplying(true);
        try {
            // Revalidate against the latest data before touching anything
            const fresh = await data.refetchAll();
            const changed =
                fresh.updatedAt !== baseline.current?.updatedAt ||
                JSON.stringify(fresh.completedByDay) !== baseline.current?.completed;
            if (changed) {
                const refreshedNow = new Date();
                const freshCtx = createResetContext(data.buildInput(refreshedNow, { reasons, protectGoalId }, fresh.grid, fresh.completedByDay));
                setNow(refreshedNow);
                setItems(buildProposal(freshCtx));
                baseline.current = { updatedAt: fresh.updatedAt, completed: JSON.stringify(fresh.completedByDay) };
                toast.info('Your plan changed while you were reviewing. The proposal is refreshed.');
                return;
            }

            const problems = findOverlaps(ctx, items);
            if (problems.length > 0) {
                toast.error('Some changes overlap. Adjust them and try again.');
                return;
            }

            const previous = fresh.grid;
            const { state, deferred } = applyProposalToGrid(previous, items);

            // Deferred work is kept, never deleted: it goes to the Missed Library
            const deferredIds = await defer.mutateAsync(
                deferred.map((d) => ({
                    name: d.name,
                    startTime: slotToTime(d.from.startSlot),
                    endTime: slotToTime(Math.min(47, d.from.endSlot)),
                })),
            );

            const saved = await savePlan.mutateAsync({
                week: data.week,
                state,
                baseState: previous,
                lastSeenUpdatedAt: fresh.updatedAt,
            });

            const counts = summarizeProposal(ctx, items).counts;
            setDoneCounts(counts);
            setPhase('complete');
            setAdjusting(false);

            toast.success('Your week is realistic again.', {
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        try {
                            await restore.mutateAsync(deferredIds);
                            await savePlan.mutateAsync({ week: data.week, state: previous, baseState: saved.state, lastSeenUpdatedAt: saved.updatedAt });
                            setPhase('health');
                            setNow(new Date());
                            toast.success('Reset undone.');
                        } catch (err) {
                            toast.error('Could not undo the reset.');
                            console.error(err);
                        }
                    },
                },
            });
        } catch (err) {
            console.error(err);
            toast.error('Could not apply the reset. Your plan was not changed.');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">
            <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">Reset</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Get your week back under control</span>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-6">
                <p className="text-sm text-muted-foreground">When reality changes, fix the plan without rebuilding everything.</p>

                {data.isLoading ? (
                    <ResetCard className="items-center gap-4" aria-busy="true">
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                        <div className="grid w-full max-w-xs grid-cols-2 gap-6">
                            <div className="h-12 rounded-xl bg-muted animate-pulse" />
                            <div className="h-12 rounded-xl bg-muted animate-pulse" />
                        </div>
                    </ResetCard>
                ) : data.isError ? (
                    <ResetCard className="items-center text-center">
                        <ResetLabel text="This week" className="mb-4" />
                        <p className="text-sm font-bold tracking-tight">Could not load your week.</p>
                        <p className="text-xs text-muted-foreground mt-1.5">Check your connection and try again.</p>
                        <Button variant="outline" onClick={data.retry} className={cn(primaryButton, 'mt-6')}>Try again</Button>
                    </ResetCard>
                ) : !hasPlan ? (
                    <ResetCard className="items-center text-center">
                        <ResetLabel text="This week" className="mb-4" />
                        <p className="text-sm font-bold tracking-tight">There is no plan to reset yet.</p>
                        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">Build your week in the Planner first. Reset steps in when it changes.</p>
                        <Button variant="outline" onClick={() => navigate('/planner')} className={cn(primaryButton, 'mt-6')}>Open Planner</Button>
                    </ResetCard>
                ) : phase === 'health' ? (
                    <PlanHealthCard health={health} onStart={start} onOpenPlanner={() => navigate('/planner')} />
                ) : phase === 'proposal' ? (
                    <div className="space-y-6">
                        <WhatChanged value={reasons} onToggle={toggleReason} onSkip={() => { setReasons([]); setOtherText(''); }} otherText={otherText} onOtherText={setOtherText} />
                        <ProposalList ctx={ctx} items={items} adjusting={adjusting} onChange={setItems} />
                        <BeforeAfter summary={summary} />
                        <GoalImpact impacts={impacts} protectedGoalId={protectGoalId} onProtect={setProtectGoalId} />
                        <HabitNotes notes={habits} />

                        {nothingToChange && (
                            <p className="text-[10px] font-bold text-muted-foreground/80">Your week already fits. There is nothing to change.</p>
                        )}
                        {summary.overlaps.length > 0 && (
                            <p role="alert" className="text-xs font-bold text-destructive">{summary.overlaps[0]}. Adjust it to continue.</p>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
                            <Button variant="ghost" onClick={cancel} disabled={applying} className={cn('h-11 rounded-2xl px-6', buttonText)}>Cancel</Button>
                            <Button variant="outline" onClick={() => setAdjusting((v) => !v)} disabled={applying} className={primaryButton}>
                                {adjusting ? 'Done Adjusting' : 'Adjust Changes'}
                            </Button>
                            <Button
                                className={cn(primaryButton, 'sm:ml-auto w-full sm:w-auto sm:px-10')}
                                onClick={apply}
                                disabled={applying || nothingToChange || summary.overlaps.length > 0}
                            >
                                {applying ? 'Applying...' : 'Apply Reset'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <ResetCard className="items-center text-center">
                        <ResetLabel text="Reset complete" className="mb-4" />
                        <p className="text-sm font-bold tracking-tight">Your week is realistic again.</p>
                        {doneCounts && (
                            <p className="text-[10px] font-bold text-muted-foreground/80 mt-3">
                                {doneCounts.keep} protected · {doneCounts.move} moved · {doneCounts.reduce} reduced · {doneCounts.remove} deferred
                            </p>
                        )}
                        <Button onClick={() => navigate('/today')} className={cn(primaryButton, 'mt-6 w-full sm:w-auto sm:px-10')}>Back to Today</Button>
                    </ResetCard>
                )}
            </div>
        </div>
    );
};
