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
                        <option value="Week">Week Goal (1-3 weeks)</option>
                        <option value="Month">Month Goal (1-11 months)</option>
                        <option value="Year">Year Goal (1-10 years)</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium">Duration ({watchedGoalType}s)</label>
                    <Input
                        type="number"
                        {...form.register('durationValue', { valueAsNumber: true })}
                        min="1"
                        max={watchedGoalType === 'Week' ? 3 : watchedGoalType === 'Month' ? 11 : 10}
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
