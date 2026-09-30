import React, { useState } from 'react';
import { Brain, Edit2, Check } from 'lucide-react';
import { DEEP_WORK_LABELS, SWITCH_LABELS, FREE_TIME_LABELS } from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExecutionProfileDialog } from './execution-profile-dialog';

const labelClass = 'text-xs font-semibold text-muted-foreground ml-0.5';
const readLabel = 'text-[10px] uppercase tracking-wider text-muted-foreground font-bold';

/**
 * Profile settings card: shows the AI Execution Profile, lets the user (re)take the assessment and
 * edit the two planning fields (free hours, biggest challenge) that previously had no settings UI.
 */
export const ExecutionProfileSection: React.FC = () => {
    const { user } = useAuth();
    const { profile, saveProfile, isSaving } = useUserProfile(user);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [freeHours, setFreeHours] = useState('');
    const [challenge, setChallenge] = useState('');

    const ep = profile?.executionProfile;
    const taken = !!ep?.completedAt;

    const startEditing = () => {
        setFreeHours(profile?.dailyFreeHours || '');
        setChallenge(profile?.biggestChallenge || '');
        setEditing(true);
    };

    const save = async () => {
        await saveProfile({ dailyFreeHours: freeHours, biggestChallenge: challenge.trim() });
        setEditing(false);
    };

    const rows: [string, string][] = [
        ['Deep work', ep?.capacity?.deepWorkMin ? DEEP_WORK_LABELS[ep.capacity.deepWorkMin] : '-'],
        ['Switch recovery', ep?.capacity?.switchRecovery ? SWITCH_LABELS[ep.capacity.switchRecovery] : '-'],
        ['Weekday free time', ep?.situation?.weekdayFree ? FREE_TIME_LABELS[ep.situation.weekdayFree] : '-'],
        ['Weekend free time', ep?.situation?.weekendFree ? FREE_TIME_LABELS[ep.situation.weekendFree] : '-'],
        ['Schedule style', ep?.style?.structure ?? '-'],
        ['Failure patterns', ep?.risks?.patterns?.length ? ep.risks.patterns.map((p) => p.replace(/_/g, ' ')).join(', ') : '-'],
    ];

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Execution Profile</h3>
                <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)} className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-primary">
                    {taken ? 'Retake' : 'Take assessment'}
                </Button>
            </div>

            <p className="text-xs text-muted-foreground">
                {taken
                    ? 'Your AI plans use these answers to pace tasks, size work blocks and add recovery rules.'
                    : 'Two minutes of questions about how you actually work helps the AI build plans that fit you.'}
            </p>

            {taken && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {rows.map(([k, v]) => (
                        <div key={k} className="space-y-0.5">
                            <p className={readLabel}>{k}</p>
                            <p className="text-sm font-medium capitalize">{v}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">Planning details</h4>
                    {!editing && (
                        <Button variant="ghost" size="sm" onClick={startEditing} className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-primary">
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                    )}
                </div>

                {editing ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Free hours per day for goals</label>
                                <Input type="number" min="0.5" max="16" step="0.5" value={freeHours} onChange={(e) => setFreeHours(e.target.value)} className="h-10 rounded-xl bg-muted border-border" />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Biggest challenge reaching your goals</label>
                                <Input value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g., procrastination, low energy" className="h-10 rounded-xl bg-muted border-border" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={isSaving} className="h-9 text-xs">Cancel</Button>
                            <Button size="sm" onClick={save} disabled={isSaving} className="h-9 text-xs font-semibold">
                                <Check className="h-3.5 w-3.5 mr-1.5" /> {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                            <p className={readLabel}>Free hours per day</p>
                            <p className="text-sm font-medium">{profile?.dailyFreeHours || 'Not set'}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className={readLabel}>Biggest challenge</p>
                            <p className="text-sm font-medium">{profile?.biggestChallenge || 'Not set'}</p>
                        </div>
                    </div>
                )}
            </div>

            <ExecutionProfileDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
};
