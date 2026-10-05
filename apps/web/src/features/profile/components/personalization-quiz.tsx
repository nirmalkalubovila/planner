import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    EXECUTION_PROFILE_VERSION, DEEP_WORK_LABELS, SWITCH_LABELS, FREE_TIME_LABELS,
    getSituationStatuses, situationSummary,
    type ExecutionProfile, type DeepWorkBand, type SwitchRecoveryBand, type RiskPattern, type SituationStatus, type EnergyPeriod,
} from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { StandardDialog } from '@/components/common/standard-dialog';
import { OptionChips } from '@/components/common/option-chips';
import { SituationPicker } from '@/components/common/situation-picker';
import { FormField } from '@/components/ui/form-components';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { PLACEHOLDER_DOB, freeTimeBandFor } from '../lib/personalization';

const TEXTAREA_CLASS = 'flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PERIODS: EnergyPeriod[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

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

const STEP_TITLES = ['About you', 'Your time and energy', 'Your week', 'How you focus', 'What stops you'];

interface PersonalizationQuizProps {
    isOpen: boolean;
    onClose: () => void;
    /** Hide the close button until the essentials (step 1) are saved. */
    required?: boolean;
}

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
    <label className="text-sm font-medium flex flex-col">
        <span>{children}</span>
        {hint && <span className="text-muted-foreground font-normal text-[11px]">{hint}</span>}
    </label>
);

/**
 * The one place every personal answer is collected: who you are, your time, your week, how you focus and what
 * gets in the way. New users take it first, and anyone can retake it from Preferences as life changes. Answers are
 * saved at the end of each step, so partial progress is kept.
 */
export const PersonalizationQuiz: React.FC<PersonalizationQuizProps> = ({ isOpen, onClose, required = false }) => {
    const { user } = useAuth();
    const { profile, saveProfile } = useUserProfile(user);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [loaded, setLoaded] = useState(false);

    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    // Name and birth date are edited in the Profile tab, so the quiz only asks for one that is still missing
    const [askName, setAskName] = useState(false);
    const [askDob, setAskDob] = useState(false);
    const [statuses, setStatuses] = useState<SituationStatus[]>([]);
    const [focus, setFocus] = useState('');
    const [freeHours, setFreeHours] = useState('');
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepDuration, setSleepDuration] = useState('8');
    const [energyPeak, setEnergyPeak] = useState('Morning');
    const [weekStart, setWeekStart] = useState('Monday');
    const [planDay, setPlanDay] = useState('Sunday');
    const [planStart, setPlanStart] = useState('21:00');
    const [planEnd, setPlanEnd] = useState('22:00');
    const [challenge, setChallenge] = useState('');
    const [draft, setDraft] = useState<ExecutionProfile>({ version: EXECUTION_PROFILE_VERSION });

    const retake = !!profile?.executionProfile?.completedAt;

    // Seed once per opening from whatever is already known (a retake, partial progress, or a Google name)
    if (isOpen && !loaded && profile) {
        setLoaded(true);
        const meta = user?.user_metadata ?? {};
        const knownName = profile.fullName || meta.full_name || meta.name || '';
        const knownDob = profile.dob && profile.dob !== PLACEHOLDER_DOB ? new Date(profile.dob) : null;
        setFullName(knownName);
        setDob(knownDob);
        setAskName(!profile.fullName?.trim());
        setAskDob(!knownDob);
        setStatuses(getSituationStatuses(profile.executionProfile));
        setFocus(profile.primaryLifeFocus || '');
        setFreeHours(profile.dailyFreeHours || '');
        setSleepStart(profile.sleepStart || '22:00');
        setSleepDuration(profile.sleepDuration || '8');
        setEnergyPeak(profile.energyPeakTime || 'Morning');
        setWeekStart(profile.weekStart || 'Monday');
        setPlanDay(profile.planDay || 'Sunday');
        setPlanStart(profile.planStartTime || '21:00');
        setPlanEnd(profile.planEndTime || '22:00');
        setChallenge(profile.biggestChallenge || '');
        setDraft({ ...profile.executionProfile, version: EXECUTION_PROFILE_VERSION });
    }

    const patch = <K extends 'capacity' | 'style' | 'risks' | 'situation'>(key: K, value: Partial<NonNullable<ExecutionProfile[K]>>) =>
        setDraft((d) => ({ ...d, [key]: { ...d[key], ...value } }));
    const cap = draft.capacity ?? {};

    const toggleRisk = (r: RiskPattern) => {
        const cur = draft.risks?.patterns ?? [];
        patch('risks', { patterns: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] });
    };

    /** What must be answered before leaving each step. */
    const problem = (s: number): string => {
        if (s === 0) {
            if (askName && !fullName.trim()) return 'Please enter your name.';
            if (askDob && !dob) return 'Please enter your date of birth.';
            if (!statuses.length) return 'Please choose at least one situation.';
            if (!focus.trim()) return 'Please tell us your main focus right now.';
        }
        if (s === 1 && (!freeHours || Number(freeHours) <= 0)) return 'Please tell us how many free hours you have on a normal weekday.';
        return '';
    };

    const persist = async (final: boolean): Promise<boolean> => {
        setSaving(true);
        try {
            const hours = Number(freeHours);
            const next: ExecutionProfile = {
                ...draft,
                version: EXECUTION_PROFILE_VERSION,
                situation: {
                    ...draft.situation,
                    statuses,
                    status: undefined,
                    ...(hours > 0 ? { weekdayFree: freeTimeBandFor(hours) } : {}),
                },
                ...(final ? { completedAt: new Date().toISOString() } : {}),
            };
            const derivedFocus = deepWorkToFocus(next.capacity?.deepWorkMin);
            const derivedShifting = switchToShifting(next.capacity?.switchRecovery);
            await saveProfile({
                ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
                ...(dob ? { dob: format(dob, 'yyyy-MM-dd') } : {}),
                ...(statuses.length ? { currentProfession: situationSummary(statuses) } : {}),
                ...(focus.trim() ? { primaryLifeFocus: focus.trim() } : {}),
                ...(hours > 0 ? { dailyFreeHours: String(hours) } : {}),
                sleepStart,
                sleepDuration,
                energyPeakTime: energyPeak,
                weekStart,
                planDay,
                planStartTime: planStart,
                planEndTime: planEnd,
                biggestChallenge: challenge.trim(),
                ...(derivedFocus ? { focusAbility: derivedFocus } : {}),
                ...(derivedShifting ? { taskShiftingAbility: derivedShifting } : {}),
                isPersonalized: true,
                ...(user?.email ? { email: user.email } : {}),
                executionProfile: next,
            });
            setDraft(next);
            return true;
        } catch {
            setError('Could not save your answers. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        const issue = problem(step);
        if (issue) return setError(issue);
        setError('');
        const isLast = step === STEP_TITLES.length - 1;
        if (await persist(isLast)) setStep((s) => s + 1);
    };

    const handleClose = () => {
        setLoaded(false);
        setStep(0);
        setError('');
        onClose();
    };

    const done = step >= STEP_TITLES.length;
    // Until the essentials are saved the quiz cannot be closed
    const locked = required;

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Build your planner"
            subtitle={done ? 'All set' : `Step ${step + 1} of ${STEP_TITLES.length} - ${STEP_TITLES[step]}`}
            maxWidth="2xl"
            hideClose={locked}
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
                        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                            <p className="text-sm font-bold">{retake ? 'Life changes. Your planner should too.' : 'Make your planner fit your life.'}</p>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                {retake
                                    ? 'Update your answers and your plans, time blocks and targets adjust.'
                                    : 'A few honest answers shape every plan, time block and target. The more it knows, the more practical it becomes.'}
                            </p>
                        </div>
                        {(askName || askDob) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {askName && (
                                    <FormField label="Full name" required>
                                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-9 text-sm" />
                                    </FormField>
                                )}
                                {askDob && (
                                    <FormField label="Date of birth" required hint="Used to set realistic life-balance targets">
                                        <CustomDatePicker selected={dob} onChange={(d) => setDob(d)} placeholderText="Select" />
                                    </FormField>
                                )}
                            </div>
                        )}
                        <SituationPicker value={statuses} onChange={setStatuses} />
                        <FormField label="Your main focus right now" required>
                            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Become an entrepreneur" className="h-9 text-sm" />
                        </FormField>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Free hours on a normal weekday" required hint="Time you can really give to your goals">
                                <Input type="number" min="0.5" max="16" step="0.5" value={freeHours} onChange={(e) => setFreeHours(e.target.value)} placeholder="2" className="h-9 text-sm" />
                            </FormField>
                            <FormField label="Sleep start">
                                <SimpleTimePicker value={sleepStart} onChange={setSleepStart} />
                            </FormField>
                            <FormField label="Sleep duration (hours)">
                                <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className="h-9 text-sm" />
                            </FormField>
                        </div>
                        <div className="space-y-2">
                            <Label>Time you can control on a weekend day</Label>
                            <OptionChips
                                value={draft.situation?.weekendFree}
                                onChange={(v) => patch('situation', { weekendFree: v })}
                                options={(Object.keys(FREE_TIME_LABELS) as (keyof typeof FREE_TIME_LABELS)[]).map((k) => ({ value: k, label: FREE_TIME_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>When is your energy highest?</Label>
                            <OptionChips value={energyPeak} onChange={setEnergyPeak} options={PERIODS.map((p) => ({ value: p, label: p }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>...and when is it lowest?</Label>
                            <OptionChips value={cap.lowEnergyPeriod} onChange={(v) => patch('capacity', { lowEnergyPeriod: v })} options={PERIODS.map((p) => ({ value: p, label: p }))} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <Text variant="small" className="text-muted-foreground">
                            Pick a regular time to plan the week ahead. Everything else is built around it.
                        </Text>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Week starts on">
                                <Select value={weekStart} onValueChange={setWeekStart}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Planning day">
                                <Select value={planDay} onValueChange={setPlanDay}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Planning starts">
                                <SimpleTimePicker value={planStart} onChange={setPlanStart} />
                            </FormField>
                            <FormField label="Planning ends">
                                <SimpleTimePicker value={planEnd} onChange={setPlanEnd} />
                            </FormField>
                        </div>
                        <div className="space-y-2">
                            <Label>Do you prefer a fixed or flexible schedule?</Label>
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
                            <Label>How much can you handle on a normal day?</Label>
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
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Text variant="small" className="text-muted-foreground">
                            Answer based on what usually happens, not what you wish happened.
                        </Text>
                        <div className="space-y-2">
                            <Label>How long can you usually work deeply before losing focus?</Label>
                            <OptionChips
                                value={cap.deepWorkMin}
                                onChange={(v) => patch('capacity', { deepWorkMin: v })}
                                options={(Object.keys(DEEP_WORK_LABELS) as DeepWorkBand[]).map((k) => ({ value: k, label: DEEP_WORK_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>When you switch to a different type of work, how long until you are fully focused again?</Label>
                            <OptionChips
                                value={cap.switchRecovery}
                                onChange={(v) => patch('capacity', { switchRecovery: v })}
                                options={(Object.keys(SWITCH_LABELS) as SwitchRecoveryBand[]).map((k) => ({ value: k, label: SWITCH_LABELS[k] }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Which feels easier?</Label>
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
                            <Label>How do you handle several projects?</Label>
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
                        <div className="space-y-2">
                            <Label>What gets you moving?</Label>
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

                {step === 4 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label hint="Pick all that apply">What usually derails your goals?</Label>
                            <OptionChips className="grid-cols-2 sm:grid-cols-3" value={draft.risks?.patterns ?? []} onChange={toggleRisk} options={RISK_OPTIONS} />
                        </div>
                        <div className="space-y-2">
                            <Label hint='Be honest, e.g. "I miss two days and abandon the whole plan"'>What normally happens when you stop following a goal?</Label>
                            <textarea
                                value={draft.risks?.stopBehavior ?? ''}
                                onChange={(e) => patch('risks', { stopBehavior: e.target.value })}
                                maxLength={300}
                                className={TEXTAREA_CLASS}
                            />
                        </div>
                        <FormField label="Your biggest challenge reaching your goals">
                            <Input value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g. procrastination, low energy" className="h-9 text-sm" />
                        </FormField>
                    </div>
                )}

                {done && (
                    <div className="space-y-4 py-1">
                        <div className="text-center space-y-1">
                            <p className="text-base font-bold">Your planner is ready</p>
                            <Text variant="small" className="text-muted-foreground">
                                Plans, time blocks and balance targets now use your answers. Retake the quiz from Preferences whenever your life changes.
                            </Text>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-left">
                            {[
                                ['Situation', statuses.length ? situationSummary(statuses) : '-'],
                                ['Free hours', freeHours ? `${freeHours} a day` : '-'],
                                ['Energy peak', energyPeak],
                                ['Deep work', cap.deepWorkMin ? DEEP_WORK_LABELS[cap.deepWorkMin] : '-'],
                                ['Schedule style', draft.style?.structure ?? '-'],
                                ['Planning', `${planDay} ${planStart}`],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl border border-border bg-card/60 p-2.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{k}</p>
                                    <p className="text-sm font-medium capitalize">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}

                <div className="flex items-center justify-between gap-2 pt-1">
                    {done ? (
                        <Button type="button" className="w-full h-9 text-sm font-semibold" onClick={handleClose}>Done</Button>
                    ) : (
                        <>
                            {step === 0 ? (
                                locked ? <span /> : <Button type="button" variant="ghost" className="h-9 text-xs" onClick={handleClose} disabled={saving}>Maybe later</Button>
                            ) : (
                                <Button type="button" variant="ghost" className="h-9 text-xs" onClick={() => { setError(''); setStep((s) => s - 1); }} disabled={saving}>
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                </Button>
                            )}
                            <Button type="button" className="h-9 text-xs font-semibold" onClick={handleNext} disabled={saving}>
                                {saving ? 'Saving...' : step === STEP_TITLES.length - 1 ? 'Build my planner' : <>Next <ChevronRight className="ml-1 h-4 w-4" /></>}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </StandardDialog>
    );
};
