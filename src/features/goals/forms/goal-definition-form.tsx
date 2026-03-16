import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';

const goalSchema = z.object({
    title: z.string().min(1, "Goal Title is required").max(60, "Title must be 60 characters or less"),
    name: z.string().min(1, "Description is required"),
    purpose: z.string().min(1, "Purpose is required"),
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

export type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalDefinitionFormProps {
    initialValues?: Partial<GoalFormValues>;
    onSubmit: (values: GoalFormValues) => void;
}

export const GoalDefinitionForm: React.FC<GoalDefinitionFormProps> = ({ initialValues, onSubmit }) => {
    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            title: initialValues?.title || '',
            name: initialValues?.name || '',
            purpose: initialValues?.purpose || '',
            startDate: initialValues?.startDate || '',
            goalType: initialValues?.goalType || 'Week',
            durationValue: initialValues?.durationValue || 1,
        },
    });

    const watchedGoalType = form.watch('goalType');

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Goal Title <span className="text-muted-foreground font-normal text-xs">(short unique name)</span></label>
                    <Input {...form.register('title')} placeholder="e.g., Master Node.js" className="bg-background" maxLength={60} />
                    {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Mission / Description</label>
                    <textarea {...form.register('name')} placeholder="e.g., Master core Node.js concepts including modules, async programming..." className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Purpose (Why?)</label>
                    <Input {...form.register('purpose')} placeholder="e.g., To build better frontend applications faster" className="bg-background" />
                    {form.formState.errors.purpose && <p className="text-xs text-destructive">{form.formState.errors.purpose.message}</p>}
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
                    <select {...form.register('goalType')} className="flex h-9 w-full rounded-lg border border-white/10 bg-[hsl(224,71%,6%)] px-3 py-2 text-sm hover:border-white/20 transition-colors appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                        <option value="Week" className="bg-[hsl(224,71%,6%)] text-white/80">Week Goal (1-4 weeks)</option>
                        <option value="Month" className="bg-[hsl(224,71%,6%)] text-white/80">Month Goal (2-12 months)</option>
                        <option value="Year" className="bg-[hsl(224,71%,6%)] text-white/80">Year Goal (2-10 years)</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Duration ({watchedGoalType}s)</label>
                    <Input
                        type="number"
                        {...form.register('durationValue', { valueAsNumber: true })}
                        min={watchedGoalType === 'Week' ? 1 : 2}
                        max={watchedGoalType === 'Week' ? 4 : watchedGoalType === 'Month' ? 12 : 10}
                        className="bg-background"
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
