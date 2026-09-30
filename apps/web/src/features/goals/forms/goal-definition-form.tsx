import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, ChevronDown, Copy, Check, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';

import { BucketSelector } from '@/components/common/bucket-selector';
import { OptionChips } from '@/components/common/option-chips';
import { LifeBucket, type GoalContext } from '@llb/core';

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
    const [copied, setCopied] = useState(false);
    const [bucket, setBucket] = useState<LifeBucket | null>(initialValues?.bucket || null);
    const [goalContext, setGoalContext] = useState<GoalContext>(initialValues?.goalContext ?? {});
    const [contextOpen, setContextOpen] = useState(!!initialValues?.goalContext);
    const patchContext = (patch: Partial<GoalContext>) => setGoalContext((prev) => ({ ...prev, ...patch }));
    const patchResources = (patch: NonNullable<GoalContext['resources']>) => setGoalContext((prev) => ({ ...prev, resources: { ...prev.resources, ...patch } }));
    const patchAttempt = (patch: NonNullable<GoalContext['priorAttempt']>) => setGoalContext((prev) => ({ ...prev, priorAttempt: { ...prev.priorAttempt, ...patch } }));
    const templateText = `I am [your age] and currently [your situation, e.g., a student / working at / freelancing].
I want to [your goal, e.g., build a clothing brand / start a YouTube channel / get fit].
My limits: [e.g., I can spend 2 hours a day, I have a small budget, I'm a beginner].`;

    const handleCopy = () => {
        navigator.clipboard.writeText(templateText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    const handleFormSubmit = (formValues: FormValues, mode: 'save' | 'replan' = 'replan') => {
        const name = `Current State:\n${formValues.currentState}\n\nUltimate Goal:\n${formValues.ultimateGoal}`;
        const purpose = `Strict Constraints:\n${formValues.constraints}`;
        const cleanedContext = cleanGoalContext(goalContext);
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
        <form onSubmit={form.handleSubmit((v) => handleFormSubmit(v, 'replan'))} className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Quick Template</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={handleCopy}>
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </Button>
                </div>
                <pre className="text-[10px] sm:text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background/50 p-2.5 rounded-lg border border-border/50">
                    {templateText}
                </pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                    <BucketSelector value={bucket} onChange={setBucket} />
                </div>

                <div className="md:col-span-2 rounded-xl border border-border/60 bg-card/30">
                    <button
                        type="button"
                        onClick={() => setContextOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 p-3 text-left cursor-pointer"
                        aria-expanded={contextOpen}
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles size={14} className="text-primary" />
                            Goal context
                            <span className="text-xs text-muted-foreground font-normal">(Optional - makes your AI plan more accurate)</span>
                        </span>
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${contextOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {contextOpen && (
                        <div className="p-3 pt-0 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium flex flex-col">
                                    <span>Why does this matter to you?</span>
                                    <span className="text-muted-foreground font-normal text-[11px]">The reason that keeps you going when it gets hard</span>
                                </label>
                                <textarea value={goalContext.why ?? ''} onChange={(e) => patchContext({ why: e.target.value })} placeholder="e.g., I want financial independence so I can support my family." className={TEXTAREA_CLASS} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium flex flex-col">
                                    <span>How will you measure success?</span>
                                    <span className="text-muted-foreground font-normal text-[11px]">A number or a clear finish line</span>
                                </label>
                                <Input value={goalContext.successMeasure ?? ''} onChange={(e) => patchContext({ successMeasure: e.target.value })} placeholder="e.g., 1,000 USD/month from freelancing" className="bg-muted/50" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Is the deadline fixed?</label>
                                <OptionChips
                                    className="grid-cols-2 sm:grid-cols-2"
                                    value={goalContext.deadlineFlex}
                                    onChange={(v) => patchContext({ deadlineFlex: goalContext.deadlineFlex === v ? undefined : v })}
                                    options={[
                                        { value: 'fixed', label: 'Fixed', hint: 'Cannot move' },
                                        { value: 'flexible', label: 'Flexible', hint: 'Can slip if needed' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hours per week for this goal</label>
                                <Input type="number" min="0" max="80" step="0.5" value={goalContext.weeklyHours ?? ''} onChange={(e) => patchContext({ weeklyHours: e.target.value })} placeholder="e.g., 10" className="bg-muted/50" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Budget you can put in</label>
                                <OptionChips
                                    value={goalContext.resources?.budget}
                                    onChange={(v) => patchResources({ budget: goalContext.resources?.budget === v ? undefined : v })}
                                    options={[
                                        { value: 'none', label: 'None', hint: 'Free only' },
                                        { value: 'low', label: 'Low', hint: 'Small spend' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'high', label: 'High' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Skills you already have</label>
                                <Input value={goalContext.resources?.skills ?? ''} onChange={(e) => patchResources({ skills: e.target.value })} placeholder="e.g., basic design, Photoshop" className="bg-muted/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tools / equipment</label>
                                <Input value={goalContext.resources?.tools ?? ''} onChange={(e) => patchResources({ tools: e.target.value })} placeholder="e.g., laptop, camera" className="bg-muted/50" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">People who can help</label>
                                <Input value={goalContext.resources?.network ?? ''} onChange={(e) => patchResources({ network: e.target.value })} placeholder="e.g., a mentor, friends in the industry" className="bg-muted/50" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Have you tried this goal before?</label>
                                <OptionChips
                                    className="grid-cols-2 sm:grid-cols-2"
                                    value={goalContext.priorAttempt?.attempted ? 'yes' : goalContext.priorAttempt ? 'no' : undefined}
                                    onChange={(v) => patchAttempt({ attempted: v === 'yes' })}
                                    options={[{ value: 'no', label: 'First time' }, { value: 'yes', label: 'Yes, I have tried' }]}
                                />
                            </div>
                            {goalContext.priorAttempt?.attempted && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">What did you try?</label>
                                        <Input value={goalContext.priorAttempt.whatTried ?? ''} onChange={(e) => patchAttempt({ whatTried: e.target.value })} placeholder="e.g., posted daily for 2 weeks" className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Why did you stop?</label>
                                        <Input value={goalContext.priorAttempt.whyStopped ?? ''} onChange={(e) => patchAttempt({ whyStopped: e.target.value })} placeholder="e.g., missed two days and gave up" className="bg-muted/50" />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon size={14} /> Start Date</label>
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
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">
                        * Best to start on a Monday for clean weekly planning.
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
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                {isEditing ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto font-bold h-9 text-xs"
                            onClick={form.handleSubmit((v) => handleFormSubmit(v, 'save'))}
                        >
                            Save Goal
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            className="w-full sm:w-auto font-bold h-9 text-xs"
                            onClick={form.handleSubmit((v) => handleFormSubmit(v, 'replan'))}
                        >
                            Re-plan Goal <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button type="submit" className="w-full sm:w-auto font-bold h-9 text-xs">
                        Save & Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                )}
            </div>
        </form>
    );
};
