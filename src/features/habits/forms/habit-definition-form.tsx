import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const habitSchema = z.object({
    name: z.string().min(1, "Name is required"),
    purpose: z.string().min(1, "Purpose is required"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    startDate: z.string().min(1, "Starting date is required"),
    endDate: z.string().min(1, "Ending date is required"),
    daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
});

export type HabitFormValues = z.infer<typeof habitSchema>;

interface HabitDefinitionFormProps {
    initialValues?: Partial<HabitFormValues>;
    onSubmit: (values: HabitFormValues) => void;
    isPending?: boolean;
}

export const HabitDefinitionForm: React.FC<HabitDefinitionFormProps> = ({
    initialValues,
    onSubmit,
    isPending
}) => {
    const form = useForm<HabitFormValues>({
        resolver: zodResolver(habitSchema),
        defaultValues: {
            name: initialValues?.name || '',
            purpose: initialValues?.purpose || '',
            startTime: initialValues?.startTime || '06:00',
            endTime: initialValues?.endTime || '07:00',
            startDate: initialValues?.startDate || new Date().toISOString().split('T')[0],
            endDate: initialValues?.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            daysOfWeek: initialValues?.daysOfWeek || DAYS_OF_WEEK,
        },
    });

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Habit Name <span className="text-destructive">*</span></label>
                    <Input {...form.register('name')} placeholder="e.g., Gym & Exercise" />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Habit Purpose <span className="text-destructive">*</span></label>
                    <Input {...form.register('purpose')} placeholder="e.g., Build strength & discipline" />
                    {form.formState.errors.purpose && <p className="text-xs text-destructive">{form.formState.errors.purpose.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon size={14} /> Starting Date <span className="text-destructive">*</span></label>
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
                    <label className="text-sm font-medium flex items-center gap-2"><CalendarIcon size={14} /> Ending Date <span className="text-destructive">*</span></label>
                    <Controller
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <CustomDatePicker
                                selected={field.value ? new Date(field.value) : null}
                                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                placeholderText="Select end date"
                            />
                        )}
                    />
                    {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Clock size={14} /> Start Time <span className="text-destructive">*</span></label>
                    <Controller
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <SimpleTimePicker value={field.value} onChange={field.onChange} />
                        )}
                    />
                    {form.formState.errors.startTime && <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Clock size={14} /> End Time <span className="text-destructive">*</span></label>
                    <Controller
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <SimpleTimePicker value={field.value} onChange={field.onChange} />
                        )}
                    />
                    {form.formState.errors.endTime && <p className="text-xs text-destructive">{form.formState.errors.endTime.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2 border rounded-xl p-4 bg-background">
                    <label className="text-sm font-medium mb-3 block">Days in a Week <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                            const currentDays = form.watch('daysOfWeek') || [];
                            const isSelected = currentDays.includes(day);
                            return (
                                <label key={day} className={cn(
                                    "cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all border select-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                                    isSelected ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                )}>
                                    <input
                                        type="checkbox"
                                        value={day}
                                        className="sr-only"
                                        {...form.register('daysOfWeek')}
                                    />
                                    {day}
                                </label>
                            );
                        })}
                    </div>
                    {form.formState.errors.daysOfWeek && <p className="text-xs text-destructive mt-2">{form.formState.errors.daysOfWeek.message}</p>}
                </div>
            </div>
            <Button type="submit" className="w-full md:w-auto px-8" disabled={isPending}>
                {initialValues?.name ? "Update Habit" : "Save Habit"}
            </Button>
        </form>
    );
};
