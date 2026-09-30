import React, { useState } from 'react';
import { Brain, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
    EXECUTION_PROFILE_VERSION, DEEP_WORK_LABELS, SWITCH_LABELS, FREE_TIME_LABELS,
    type ExecutionProfile, type DeepWorkBand, type SwitchRecoveryBand, type RiskPattern,
} from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { StandardDialog } from '@/components/common/standard-dialog';
import { OptionChips } from '@/components/common/option-chips';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';

const TEXTAREA_CLASS = 'flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none';

const RISK_OPTIONS: { value: RiskPattern; label: string }[] = [
    { value: 'procrastination', label: 'Procrastination' },
    { value: 'distraction', label: 'Distraction' },
    { value: 'perfectionism', label: 'Perfectionism' },
    { value: 'too_many_things', label: 'Starting too many things' },
    { value: 'motivation', label: 'Losing motivation' },
    { value: 'forgetting', label: 'Forgetting' },
    { value: 'time_estimation', label: 'Poor time estimates' },
    { value: 'task_switching', label: 'Task switching' },
    { value: 'fear_of_failure', label: 'Fear of failure' },
    { value: 'accountability', label: 'No accountability' },
    { value: 'burnout', label: 'Burnout' },
    { value: 'sleep', label: 'Inconsistent sleep' },
    { value: 'unrealistic_planning', label: 'Unrealistic planning' },
];

const deepWorkToFocus = (b?: DeepWorkBand) => (b === 'lt20' ? 'Low' : b === '90plus' ? 'High' : b ? 'Normal' : undefined);
const switchToShifting = (b?: SwitchRecoveryBand) => (b === 'immediate' ? 'Fast' : b === '15to30' || b === '30plus' ? 'Slow' : b ? 'Normal' : undefined);

const STEP_TITLES = ['How you focus', 'Your week & energy', 'What stops you'];

interface ExecutionProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Quick (~2 min) behavioural assessment. Answers are saved at the end of every step so partial
 * progress is kept, and the legacy focusAbility / taskShiftingAbility columns are derived from
 * them so existing planner features keep working.
 */
export const ExecutionProfileDialog: React.FC<ExecutionProfileDialogProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { profile, saveProfile } = useUserProfile(user);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<ExecutionProfile>({ version: EXECUTION_PROFILE_VERSION });
    const [loaded, setLoaded] = useState(false);

    // Seed once from any saved answers (retake / partial progress).
    if (isOpen && !loaded) {
        setLoaded(true);
        setDraft({ ...profile?.executionProfile, version: EXECUTION_PROFILE_VERSION });
    }

    const patch = <K extends 'situation' | 'capacity' | 'style' | 'risks'>(key: K, value: Partial<NonNullable<ExecutionProfile[K]>>) =>
        setDraft((d) => ({ ...d, [key]: { ...d[key], ...value } }));

    const persist = async (final: boolean) => {
        setSaving(true);
        try {
            const next: ExecutionProfile = { ...draft, version: EXECUTION_PROFILE_VERSION, ...(final ? { completedAt: new Date().toISOString() } : {}) };
            const focus = deepWorkToFocus(next.capacity?.deepWorkMin);
            const shifting = switchToShifting(next.capacity?.switchRecovery);
            await saveProfile({
                executionProfile: next,
                ...(focus ? { focusAbility: focus } : {}),
                ...(shifting ? { taskShiftingAbility: shifting } : {}),
            });
            setDraft(next);
            return true;
        } catch {
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        const isLast = step === STEP_TITLES.length - 1;
        if (await persist(isLast)) setStep((s) => s + 1);
    };

    const handleClose = () => {
        setLoaded(false);
        setStep(0);
        onClose();
    };

    const done = step >= STEP_TITLES.length;
    const cap = draft.capacity ?? {};
    const toggleRisk = (r: RiskPattern) => {
        const cur = draft.risks?.patterns ?? [];
        patch('risks', { patterns: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] });
    };

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Your Execution Profile"
            subtitle={done ? 'All set' : `Step ${step + 1} of ${STEP_TITLES.length} - ${STEP_TITLES[step]}`}
            icon={Brain}
            maxWidth="xl"
            closeOnBackdrop={false}
        >
            <div className="p-4 sm:p-5 space-y-5">
                {!done && (
                    <div className="flex gap-1.5" aria-hidden>
                        {STEP_TITLES.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                    </div>
                )}

                {step === 0 && (
                    <div className="space-y-4">
                        <Text variant="small" className="text-muted-foreground">
                            Answer based on what usually happens, not what you wish happened. The AI uses this to shape your plans.
                        </Text>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">How long can you usually work deeply before losing focus?</label>
                            <OptionChips
                                value={cap.deepWorkMin}
                                onChange={(v) => patch('capacity', { deepWorkMin: v })}
                                options={(Object.keys(DEEP_WORK_LABELS) as DeepWorkBand[]).map((k) => ({ value: k, label: DEEP_WORK_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">When you switch to a different type of work, how long until you are fully focused again?</label>
                            <OptionChips
                                value={cap.switchRecovery}
                                onChange={(v) => patch('capacity', { switchRecovery: v })}
                                options={(Object.keys(SWITCH_LABELS) as SwitchRecoveryBand[]).map((k) => ({ value: k, label: SWITCH_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Which feels easier?</label>
                            <OptionChips
                                className="grid-cols-1 sm:grid-cols-2"
                                value={cap.sessionStyle}
                                onChange={(v) => patch('capacity', { sessionStyle: v })}
                                options={[
                                    { value: 'one_long', label: 'A - One 2-hour session', hint: 'Deep, uninterrupted block' },
                                    { value: 'several_short', label: 'B - Four 30-minute sessions', hint: 'Short bursts through the day' },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">How do you handle several projects?</label>
                            <OptionChips
                                className="grid-cols-1 sm:grid-cols-2"
                                value={draft.style?.projectMode}
                                onChange={(v) => patch('style', { projectMode: v })}
                                options={[
                                    { value: 'single', label: 'One major thing at a time' },
                                    { value: 'multi', label: 'Comfortable juggling a few' },
                                ]}
                            />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your current situation</label>
                            <OptionChips
                                value={draft.situation?.status}
                                onChange={(v) => patch('situation', { status: v })}
                                options={[
                                    { value: 'student', label: 'Student' },
                                    { value: 'employed', label: 'Employed' },
                                    { value: 'self_employed', label: 'Self-employed' },
                                    { value: 'unemployed', label: 'Between jobs' },
                                    { value: 'other', label: 'Other' },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time you can realistically control on a weekday</label>
                            <OptionChips
                                value={draft.situation?.weekdayFree}
                                onChange={(v) => patch('situation', { weekdayFree: v })}
                                options={(Object.keys(FREE_TIME_LABELS) as (keyof typeof FREE_TIME_LABELS)[]).map((k) => ({ value: k, label: FREE_TIME_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">...and on a weekend day</label>
                            <OptionChips
                                value={draft.situation?.weekendFree}
                                onChange={(v) => patch('situation', { weekendFree: v })}
                                options={(Object.keys(FREE_TIME_LABELS) as (keyof typeof FREE_TIME_LABELS)[]).map((k) => ({ value: k, label: FREE_TIME_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">When is your energy lowest?</label>
                            <OptionChips
                                value={cap.lowEnergyPeriod}
                                onChange={(v) => patch('capacity', { lowEnergyPeriod: v })}
                                options={[
                                    { value: 'Morning', label: 'Morning' },
                                    { value: 'Afternoon', label: 'Afternoon' },
                                    { value: 'Evening', label: 'Evening' },
                                    { value: 'Night', label: 'Night' },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">How much can you handle on a normal day?</label>
                            <OptionChips
                                className="grid-cols-1 sm:grid-cols-3"
                                value={cap.maxDailyLoad}
                                onChange={(v) => patch('capacity', { maxDailyLoad: v })}
                                options={[
                                    { value: 'light', label: 'Light', hint: 'One demanding task' },
                                    { value: 'moderate', label: 'Moderate', hint: 'A couple of tasks' },
                                    { value: 'heavy', label: 'Heavy', hint: 'A full workload' },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Do you prefer a fixed or flexible schedule?</label>
                            <OptionChips
                                className="grid-cols-1 sm:grid-cols-2"
                                value={draft.style?.structure}
                                onChange={(v) => patch('style', { structure: v })}
                                options={[
                                    { value: 'structured', label: 'Structured', hint: 'Set times for everything' },
                                    { value: 'flexible', label: 'Flexible', hint: 'Fit tasks around the day' },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">What gets you moving?</label>
                            <OptionChips
                                className="grid-cols-1 sm:grid-cols-2"
                                value={draft.style?.deadlineResponse}
                                onChange={(v) => patch('style', { deadlineResponse: v })}
                                options={[
                                    { value: 'deadline_driven', label: 'Deadlines', hint: 'I work best under a clock' },
                                    { value: 'self_driven', label: 'Self-motivation', hint: 'I keep going on my own' },
                                ]}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex flex-col">
                                <span>What usually derails your goals?</span>
                                <span className="text-muted-foreground font-normal text-[11px]">Pick all that apply</span>
                            </label>
                            <OptionChips
                                className="grid-cols-2 sm:grid-cols-3"
                                value={draft.risks?.patterns ?? []}
                                onChange={toggleRisk}
                                options={RISK_OPTIONS}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex flex-col">
                                <span>What normally happens when you stop following a goal?</span>
                                <span className="text-muted-foreground font-normal text-[11px]">Be honest, e.g. &quot;I miss two days and abandon the whole plan&quot;</span>
                            </label>
                            <textarea
                                value={draft.risks?.stopBehavior ?? ''}
                                onChange={(e) => patch('risks', { stopBehavior: e.target.value })}
                                maxLength={300}
                                className={TEXTAREA_CLASS}
                            />
                        </div>
                    </div>
                )}

                {done && (
                    <div className="space-y-4 text-center py-2">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                        <div>
                            <p className="text-base font-bold">We&apos;ve built your Execution Profile</p>
                            <Text variant="small" className="text-muted-foreground">
                                Your AI plans will now use it to pace tasks, block sizes and recovery rules. You can retake it anytime from Profile settings.
                            </Text>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            {[
                                ['Deep work', cap.deepWorkMin ? DEEP_WORK_LABELS[cap.deepWorkMin] : '-'],
                                ['Switch recovery', cap.switchRecovery ? SWITCH_LABELS[cap.switchRecovery] : '-'],
                                ['Weekday free time', draft.situation?.weekdayFree ? FREE_TIME_LABELS[draft.situation.weekdayFree] : '-'],
                                ['Schedule style', draft.style?.structure ?? '-'],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl border border-border bg-card/60 p-2.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{k}</p>
                                    <p className="text-sm font-medium capitalize">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                    {done ? (
                        <Button type="button" className="w-full h-9 text-sm font-semibold" onClick={handleClose}>Done</Button>
                    ) : (
                        <>
                            <Button type="button" variant="ghost" className="h-9 text-xs" onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)} disabled={saving}>
                                {step === 0 ? 'Maybe later' : <><ChevronLeft className="mr-1 h-4 w-4" /> Back</>}
                            </Button>
                            <Button type="button" className="h-9 text-xs font-semibold" onClick={handleNext} disabled={saving}>
                                {saving ? 'Saving...' : step === STEP_TITLES.length - 1 ? 'Build my profile' : <>Next <ChevronRight className="ml-1 h-4 w-4" /></>}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </StandardDialog>
    );
};
