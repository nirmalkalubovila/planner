import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const goalSchema = z.object({
    name: z.string().min(1, "Goal Name is required"),
    purpose: z.string().min(1, "Purpose is required"),
    startDate: z.string().min(1, "Start Date is required"),
    goalType: z.enum(['Week', 'Month', 'Year']),
    durationValue: z.number().min(1, "Duration must be at least 1"),
}).superRefine((data, ctx) => {
    if (data.goalType === 'Week' && (data.durationValue < 1 || data.durationValue > 4)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Week Goal duration must be between 1 and 4 weeks",
            path: ["durationValue"],
        });
    }
    if (data.goalType === 'Month' && (data.durationValue < 2 || data.durationValue > 12)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Month Goal duration must be between 2 and 12 months",
            path: ["durationValue"],
        });
    }
    if (data.goalType === 'Year' && (data.durationValue < 2 || data.durationValue > 10)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Year Goal duration must be between 2 and 10 years",
            path: ["durationValue"],
        });
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
            name: initialValues?.name || '',
            purpose: initialValues?.purpose || '',
            startDate: initialValues?.startDate || '',
            goalType: initialValues?.goalType || 'Week',
            durationValue: initialValues?.durationValue || 1,
        },
    });

    const watchedGoalType = form.watch('goalType');

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input {...form.register('name')} placeholder="e.g., Master React in 2 weeks" className="bg-background" />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Goal Purpose (Why?)</label>
                    <Input {...form.register('purpose')} placeholder="e.g., To build better frontend applications faster" className="bg-background" />
                    {form.formState.errors.purpose && <p className="text-xs text-destructive">{form.formState.errors.purpose.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Starting Date</label>
                    <Input type="date" {...form.register('startDate')} className="bg-background" />
                    {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Goal Type</label>
                    <select {...form.register('goalType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="Week">Week Goal (1-4 weeks)</option>
                        <option value="Month">Month Goal (2-12 months)</option>
                        <option value="Year">Year Goal (2-10 years)</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-1">
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
            <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full sm:w-auto">
                    Save & Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
};
