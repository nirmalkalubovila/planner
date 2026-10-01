import React, { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';

import { BucketSelector } from '@/components/common/bucket-selector';
import { LifeBucket, assessGoalRealism, goalDurationMonths, monthsToGoalDuration, type GoalContext } from '@llb/core';
import { GoalRealityNote } from '../components/goal-reality-note';

const TEXTAREA_CLASS = "flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none";

const hasText = (v?: string) => !!v && v.trim().length > 0;

/** Drops empty answers so goals without context never write a goalContext value. */
function cleanGoalContext(c: GoalContext): GoalContext | undefined {
    const out: GoalContext = {};
    if (hasText(c.why)) out.why = c.why!.trim();
    if (hasText(c.successMeasure)) out.successMeasure = c.successMeasure!.trim();
    if (c.deadlineFlex) out.deadlineFlex = c.deadlineFlex;
    if (hasText(c.weeklyHours)) out.weeklyHours = c.weeklyHours!.trim();
    const r = c.resources ?? {};
    const resources = {
        ...(r.budget ? { budget: r.budget } : {}),
        ...(hasText(r.skills) ? { skills: r.skills!.trim() } : {}),
        ...(hasText(r.tools) ? { tools: r.tools!.trim() } : {}),
        ...(hasText(r.network) ? { network: r.network!.trim() } : {}),
    };
    if (Object.keys(resources).length) out.resources = resources;
    if (c.priorAttempt?.attempted) {
        out.priorAttempt = {
            attempted: true,
            ...(hasText(c.priorAttempt.whatTried) ? { whatTried: c.priorAttempt.whatTried!.trim() } : {}),
            ...(hasText(c.priorAttempt.whyStopped) ? { whyStopped: c.priorAttempt.whyStopped!.trim() } : {}),
        };
    }
    return Object.keys(out).length ? out : undefined;
}

function parseLegacyName(text: string): { currentState: string; ultimateGoal: string } {
    if (!text) return { currentState: '', ultimateGoal: '' };
    const marker1 = 'Current State:\n';
    const marker2 = '\n\nUltimate Goal:\n';
    const h1 = text.indexOf(marker1);
    const h2 = text.indexOf(marker2);
    if (h1 !== -1 && h2 !== -1) {
        return {
            currentState: text.substring(h1 + marker1.length, h2).trim(),
            ultimateGoal: text.substring(h2 + marker2.length).trim(),
        };
    }
    return { currentState: text, ultimateGoal: '' };
}

function parseLegacyPurpose(text: string): string {
    if (!text) return '';
    const marker = 'Strict Constraints:\n';
    const defMarker = '\n\nDefinition of Success:\n';
    const h1 = text.indexOf(marker);
    const h2 = text.indexOf(defMarker);
    if (h1 !== -1) {
        const end = h2 !== -1 ? h2 : text.length;
        return text.substring(h1 + marker.length, end).trim();
    }
    return text;
}

const formSchema = z.object({
    title: z.string().min(1, "Give your goal a short name").max(60, "Title must be 60 characters or less"),
    currentState: z.string().min(1, "Describe where you are right now"),
    ultimateGoal: z.string().min(1, "Describe what you want to achieve"),
    constraints: z.string().min(1, "Mention your limits or constraints"),
    startDate: z.string().min(1, "Pick a start date"),
    goalType: z.enum(['Week', 'Month', 'Year']),
    durationValue: z.number().min(1, "Duration must be at least 1"),
}).superRefine((data, ctx) => {
    if (data.goalType === 'Week' && (data.durationValue < 1 || data.durationValue > 4)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Week Goal: 1-4 weeks", path: ["durationValue"] });
    }
    if (data.goalType === 'Month' && (data.durationValue < 2 || data.durationValue > 12)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Month Goal: 2-12 months", path: ["durationValue"] });
    }
    if (data.goalType === 'Year' && (data.durationValue < 2 || data.durationValue > 10)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Year Goal: 2-10 years", path: ["durationValue"] });
    }
});

type FormValues = z.infer<typeof formSchema>;

export interface GoalFormValues {
    title: string;
    name: string;
    purpose: string;
    startDate: string;
    goalType: 'Week' | 'Month' | 'Year';
    durationValue?: number;
    bucket?: LifeBucket;
    goalContext?: GoalContext;
}

interface GoalDefinitionFormProps {
    initialValues?: Partial<GoalFormValues>;
    onSubmit: (values: GoalFormValues, mode?: 'save' | 'replan') => void;
    isEditing?: boolean;
}

export const GoalDefinitionForm: React.FC<GoalDefinitionFormProps> = ({ initialValues, onSubmit, isEditing }) => {
    const [bucket, setBucket] = useState<LifeBucket | null>(initialValues?.bucket || null);
    const [bucketError, setBucketError] = useState(false);
    // The one extra question: why this goal matters. Other saved context values are preserved untouched.
    const [why, setWhy] = useState(initialValues?.goalContext?.why ?? '');
    const parsedName = parseLegacyName(initialValues?.name || '');
    const parsedConstraints = parseLegacyPurpose(initialValues?.purpose || '');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialValues?.title || '',
            currentState: parsedName.currentState,
            ultimateGoal: parsedName.ultimateGoal,
            constraints: parsedConstraints,
            startDate: initialValues?.startDate || '',
            goalType: initialValues?.goalType || 'Week',
            durationValue: initialValues?.durationValue || 1,
        },
    });

    const watchedGoalType = form.watch('goalType');
    const watchedDuration = form.watch('durationValue');
    const watchedTitle = form.watch('title');
    const watchedUltimate = form.watch('ultimateGoal');

    // Is the goal reachable in the chosen time? Checked as the person types, before any plan is generated
    const realism = useMemo(
        () => assessGoalRealism({
            text: `${watchedTitle ?? ''} ${watchedUltimate ?? ''}`,
            months: goalDurationMonths(watchedGoalType, Number(watchedDuration) || 1),
        }),
        [watchedTitle, watchedUltimate, watchedGoalType, watchedDuration],
    );

    const useSuggestedLength = (months: number) => {
        const next = monthsToGoalDuration(months);
        form.setValue('goalType', next.goalType, { shouldValidate: true });
        form.setValue('durationValue', next.durationValue, { shouldValidate: true });
    };

    // Every goal belongs to one life bucket, so submit is blocked until one is chosen
    const submitWith = (mode: 'save' | 'replan') => form.handleSubmit((v) => {
        if (!bucket) { setBucketError(true); return; }
        handleFormSubmit(v, mode);
    });

    const handleFormSubmit = (formValues: FormValues, mode: 'save' | 'replan' = 'replan') => {
        const name = `Current State:\n${formValues.currentState}\n\nUltimate Goal:\n${formValues.ultimateGoal}`;
        const purpose = `Strict Constraints:\n${formValues.constraints}`;
        const cleanedContext = cleanGoalContext({ ...initialValues?.goalContext, why });
        onSubmit({
            title: formValues.title,
            name,
            purpose,
            startDate: formValues.startDate,
            goalType: formValues.goalType,
            durationValue: formValues.durationValue,
            bucket: bucket || undefined,
            ...(cleanedContext ? { goalContext: cleanedContext } : {}),
        }, mode);
    };

    return (
        <form onSubmit={submitWith('replan')} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Why do you want this?</span>
                        <span className="text-muted-foreground font-normal text-[11px]">We remind you of this when it gets boring or hard, so you keep pushing.</span>
                    </label>
                    <textarea
                        value={why}
                        onChange={(e) => setWhy(e.target.value)}
                        maxLength={300}
                        placeholder="e.g., I want to give my family a better life and never depend on a single paycheck."
                        className={TEXTAREA_CLASS}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Goal Title <span className="text-muted-foreground font-normal text-xs">(short name)</span></label>
                    <Input {...form.register('title')} placeholder="e.g., Build a clothing brand" className="bg-muted/50" maxLength={60} />
                    {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Where You Are Now</span>
                        <span className="text-muted-foreground font-normal text-[11px]">Your current situation in a few words</span>
                    </label>
                    <textarea {...form.register('currentState')} placeholder="e.g., I'm a 22 year old university student with basic design skills and a small savings." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.currentState && <p className="text-xs text-destructive">{form.formState.errors.currentState.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>What You Want to Achieve</span>
                        <span className="text-muted-foreground font-normal text-[11px]">The end result you're working towards</span>
                    </label>
                    <textarea {...form.register('ultimateGoal')} placeholder="e.g., Launch my own clothing brand online, get first 50 orders, and build a social media following." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.ultimateGoal && <p className="text-xs text-destructive">{form.formState.errors.ultimateGoal.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Your Limits</span>
                        <span className="text-muted-foreground font-normal text-[11px]">Any time, money, or skill constraints to keep in mind</span>
                    </label>
                    <textarea {...form.register('constraints')} placeholder="e.g., I can only work on this 2 hours a day, my budget is around 15,000 LKR, and I have no marketing experience." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.constraints && <p className="text-xs text-destructive">{form.formState.errors.constraints.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <BucketSelector required value={bucket} onChange={(b) => { setBucket(b); if (b) setBucketError(false); }} error={bucketError ? 'Choose a life bucket for this goal.' : undefined} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Controller
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <CustomDatePicker
                                selected={field.value ? new Date(field.value) : null}
                                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                placeholderText="Select start date"
                            />
                        )}
                    />
                    {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Best to start on a Monday for clean weekly planning.
                    </p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Type</label>
                    <select {...form.register('goalType')} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-border transition-colors appearance-none cursor-pointer [&>option]:bg-background [&>option]:text-foreground" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                        <option value="Week">Week Goal (1-4 weeks)</option>
                        <option value="Month">Month Goal (2-12 months)</option>
                        <option value="Year">Year Goal (2-10 years)</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Duration ({watchedGoalType}s)</label>
                    <Input
                        type="number"
                        {...form.register('durationValue', { valueAsNumber: true })}
                        min={watchedGoalType === 'Week' ? 1 : 2}
                        max={watchedGoalType === 'Week' ? 4 : watchedGoalType === 'Month' ? 12 : 10}
                        className="bg-muted/50"
                    />
                    {form.formState.errors.durationValue && <p className="text-xs text-destructive">{form.formState.errors.durationValue.message}</p>}
                </div>

                <GoalRealityNote note={realism} onUseSuggestion={useSuggestedLength} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                {isEditing ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto font-bold h-9 text-xs"
                            onClick={submitWith('save')}
                        >
                            Save Goal
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            className="w-full sm:w-auto font-bold h-9 text-xs"
                            onClick={submitWith('replan')}
                        >
                            Re-plan Goal
                        </Button>
                    </>
                ) : (
                    <Button type="submit" className="w-full sm:w-auto font-bold h-9 text-xs">
                        Save & Continue
                    </Button>
                )}
            </div>
        </form>
    );
};
