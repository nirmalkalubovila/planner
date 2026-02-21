import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit2, ChevronUp } from 'lucide-react';
import { useGetHabits, useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/api/services/habit-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WeekUtils } from '@/utils/week-utils';
import { Habit } from '@/types/global-types';

const habitSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    packs: z.number().min(1, "Duration is required"),
    startDay: z.string().regex(/^\d{4}-\d{1,2}-[1-7]$/, "Format: YYYY-WW-D"),
});

type HabitFormValues = z.infer<typeof habitSchema>;

export const HabitsPage: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: habits = [], isLoading } = useGetHabits();
    const createHabit = useCreateHabit();
    const updateHabit = useUpdateHabit();
    const deleteHabit = useDeleteHabit();

    const form = useForm<HabitFormValues>({
        resolver: zodResolver(habitSchema),
        defaultValues: {
            name: '',
            description: '',
            startTime: '',
            packs: 1,
            startDay: WeekUtils.getCurrentDay(),
        },
    });

    const onSubmit = (values: HabitFormValues) => {
        // Calculate end time
        const [startHour, startMinute] = values.startTime.split(':').map(Number);
        const totalMinutes = startHour * 60 + startMinute + (values.packs * 30);
        const endHour = Math.floor(totalMinutes / 60) % 24;
        const endMinute = totalMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        const habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
            ...values,
            endTime,
        };

        if (editingId) {
            updateHabit.mutate({ ...habitData, id: editingId } as Habit);
            setEditingId(null);
        } else {
            createHabit.mutate(habitData as Habit);
        }

        form.reset({
            name: '',
            description: '',
            startTime: '',
            packs: 1,
            startDay: WeekUtils.getCurrentDay(),
        });
        setIsFormOpen(false);
    };

    const handleEdit = (habit: Habit) => {
        setEditingId(habit.id!);
        form.reset({
            name: habit.name,
            description: habit.description,
            startTime: habit.startTime,
            packs: habit.packs,
            startDay: habit.startDay,
        });
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Habit Tracker</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Define daily habits. These will lock into your Weekly Planner.</p>
                </div>
                <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2 w-full sm:w-auto">
                    {isFormOpen ? <ChevronUp size={16} /> : <Plus size={16} />}
                    {isFormOpen ? "Cancel" : "Add New Habit"}
                </Button>
            </div>

            {isFormOpen && (
                <Card className="border-primary/20 bg-accent/5 focus-within:border-primary/40 transition-all">
                    <CardHeader>
                        <CardTitle>{editingId ? "Edit Habit" : "Add New Habit"}</CardTitle>
                        <CardDescription>Fill in the details for your recurring daily habit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Habit Name</label>
                                    <Input {...form.register('name')} placeholder="e.g., Read Book" />
                                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input {...form.register('description')} placeholder="Description" />
                                    {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Time</label>
                                    <Input type="time" {...form.register('startTime')} />
                                    {form.formState.errors.startTime && <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Duration (30-min packs)</label>
                                    <select
                                        {...form.register('packs', { valueAsNumber: true })}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(p => (
                                            <option key={p} value={p}>{p} pack{p > 1 ? 's' : ''} ({p * 30} min)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Starting Day (YYYY-WW-D)</label>
                                    <div className="flex gap-2">
                                        <Input {...form.register('startDay')} placeholder="e.g., 2025-51-1" />
                                        <Button type="button" variant="outline" onClick={() => form.setValue('startDay', WeekUtils.getCurrentDay())}>Today</Button>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full md:w-auto px-8">
                                {editingId ? "Update Habit" : "Save Habit"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-32 bg-accent/20" />
                        </Card>
                    ))
                ) : (
                    habits.map((habit: Habit) => (
                        <Card key={habit.id} className="group hover:border-primary/40 transition-all hover:shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(habit)}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteHabit.mutate(habit.id!)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>{habit.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-1 text-sm text-muted-foreground font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">Time</span>
                                        <span>{habit.startTime} - {habit.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded text-xs">Packs</span>
                                        <span>{habit.packs} ({habit.packs * 30} min)</span>
                                    </div>
                                    <div className="mt-2 text-xs opacity-60">Starts: {habit.startDay}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
