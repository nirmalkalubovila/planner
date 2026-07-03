import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';

function parseCombinedField(text: string, header1: string, header2: string): { val1: string; val2: string } {
    if (!text) return { val1: '', val2: '' };
    const h1Index = text.indexOf(header1);
    const h2Index = text.indexOf(header2);
    if (h1Index === -1 || h2Index === -1) {
        return { val1: text, val2: '' };
    }
    const val1 = text.substring(h1Index + header1.length, h2Index).trim();
    const val2 = text.substring(h2Index + header2.length).trim();
    return { val1, val2 };
}

const formSchema = z.object({
    title: z.string().min(1, "Goal Title is required").max(60, "Title must be 60 characters or less"),
    currentState: z.string().min(1, "Current State is required"),
    ultimateGoal: z.string().min(1, "Ultimate Goal is required"),
    constraints: z.string().min(1, "Strict Constraints is required"),
    successMetrics: z.string().min(1, "Definition of Success is required"),
    startDate: z.string().min(1, "Start Date is required"),
    goalType: z.enum(['Week', 'Month', 'Year']),
    durationValue: z.number().min(1, "Duration must be at least 1"),
}).superRefine((data, ctx) => {
    if (data.goalType === 'Week' && (data.durationValue < 1 || data.durationValue > 4)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Week Goal: 1–4 weeks", path: ["durationValue"] });
    }
    if (data.goalType === 'Month' && (data.durationValue < 2 || data.durationValue > 12)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Month Goal: 2–12 months", path: ["durationValue"] });
    }
    if (data.goalType === 'Year' && (data.durationValue < 2 || data.durationValue > 10)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Year Goal: 2–10 years", path: ["durationValue"] });
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
}

interface GoalDefinitionFormProps {
    initialValues?: Partial<GoalFormValues>;
    onSubmit: (values: GoalFormValues) => void;
}

export const GoalDefinitionForm: React.FC<GoalDefinitionFormProps> = ({ initialValues, onSubmit }) => {
    const [copied, setCopied] = useState(false);
    const templateText = `Current Situation: I am [Age] with [Current Resources/Money] and [Current Skills].
The Goal: I want to build [Specific Product/Business/Asset] by the time I am [Target Age].
Constraints: I have [Budget Limitations] and can only commit [Time Available].
Success Metrics: I will consider this a success when I hit [Specific Number/Currency/Milestone].`;

    const handleCopy = () => {
        navigator.clipboard.writeText(templateText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const parsedName = parseCombinedField(initialValues?.name || '', "Current State:\n", "\n\nUltimate Goal:\n");
    const parsedPurpose = parseCombinedField(initialValues?.purpose || '', "Strict Constraints:\n", "\n\nDefinition of Success:\n");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialValues?.title || '',
            currentState: parsedName.val1,
            ultimateGoal: parsedName.val2,
            constraints: parsedPurpose.val1,
            successMetrics: parsedPurpose.val2,
            startDate: initialValues?.startDate || '',
            goalType: initialValues?.goalType || 'Week',
            durationValue: initialValues?.durationValue || 1,
        },
    });

    const watchedGoalType = form.watch('goalType');

    const handleFormSubmit = (formValues: FormValues) => {
        const name = `Current State:\n${formValues.currentState}\n\nUltimate Goal:\n${formValues.ultimateGoal}`;
        const purpose = `Strict Constraints:\n${formValues.constraints}\n\nDefinition of Success:\n${formValues.successMetrics}`;
        onSubmit({
            title: formValues.title,
            name,
            purpose,
            startDate: formValues.startDate,
            goalType: formValues.goalType,
            durationValue: formValues.durationValue,
        });
    };

    return (
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Fill-in-the-Blank Template</span>
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
                    <label className="text-sm font-medium">Goal Title <span className="text-muted-foreground font-normal text-xs">(short unique name)</span></label>
                    <Input {...form.register('title')} placeholder="e.g., Master Node.js" className="bg-muted/50" maxLength={60} />
                    {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Current State (The Starting Line)</span>
                        <span className="text-muted-foreground font-normal text-[11px]">What is your exact situation right now?</span>
                    </label>
                    <textarea {...form.register('currentState')} placeholder="Example: Age, current job, current skills, starting budget." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.currentState && <p className="text-xs text-destructive">{form.formState.errors.currentState.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>The Ultimate Goal (The Finish Line)</span>
                        <span className="text-muted-foreground font-normal text-[11px]">What exactly are you trying to build or achieve?</span>
                    </label>
                    <textarea {...form.register('ultimateGoal')} placeholder="Example: A tech startup, a real estate portfolio, a recognizable brand." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.ultimateGoal && <p className="text-xs text-destructive">{form.formState.errors.ultimateGoal.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Strict Constraints (The Rules of the Game)</span>
                        <span className="text-muted-foreground font-normal text-[11px]">What limitations does the AI need to know about so it doesn't suggest impossible things?</span>
                    </label>
                    <textarea {...form.register('constraints')} placeholder="Example: No money to start, only have 2 hours a day, must be done in a specific country/currency." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.constraints && <p className="text-xs text-destructive">{form.formState.errors.constraints.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex flex-col">
                        <span>Definition of Success (The Metrics)</span>
                        <span className="text-muted-foreground font-normal text-[11px]">How will you know you actually reached the goal?</span>
                    </label>
                    <textarea {...form.register('successMetrics')} placeholder="Example: Hitting a specific revenue number in LKR, getting 1,000 daily active users, quitting your 9-to-5." className="flex min-h-[70px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.successMetrics && <p className="text-xs text-destructive">{form.formState.errors.successMetrics.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon size={14} /> Starting Date</label>
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
            <div className="flex justify-end pt-2">
                <Button type="submit" className="w-full sm:w-auto">
                    Save & Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
};
