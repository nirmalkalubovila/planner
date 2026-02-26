import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format, parse } from 'date-fns';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { CustomTimePicker } from '@/components/ui/time-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit2, ChevronUp, Search, Calendar as CalendarIcon, Target } from 'lucide-react';
import { useGetHabits, useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/api/services/habit-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Habit } from '@/types/global-types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { timeToMinutes, minutesToTime, isTimeOverlapping, isSleepOverlapping } from '@/utils/time-utils';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const habitSchema = z.object({
    name: z.string().min(1, "Name is required"),
    purpose: z.string().min(1, "Purpose is required"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    durationPacks: z.number().min(1, "At least 1 pack (30 min) is required"),
    startDate: z.string().min(1, "Starting date is required"),
    endDate: z.string().min(1, "Ending date is required"),
    daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
});

type HabitFormValues = z.infer<typeof habitSchema>;

export const HabitsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [conflictError, setConflictError] = useState<string | null>(null);

    // Confirmation state
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: habits = [], isLoading } = useGetHabits();
    const createHabit = useCreateHabit();
    const updateHabit = useUpdateHabit();
    const deleteHabit = useDeleteHabit();

    const form = useForm<HabitFormValues>({
        resolver: zodResolver(habitSchema),
        defaultValues: {
            name: '',
            purpose: '',
            startTime: '06:00',
            durationPacks: 2, // Default to 1 hour (2 * 30 min)
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            daysOfWeek: DAYS_OF_WEEK,
        },
    });

    const watchedStartTime = form.watch('startTime');
    const watchedPacks = form.watch('durationPacks');
    const computedEndTime = watchedStartTime && watchedPacks
        ? minutesToTime(timeToMinutes(watchedStartTime) + watchedPacks * 30)
        : '';

    // Inject Defaults once loaded if empty
    useEffect(() => {
        if (!isLoading && habits.length === 0) {
            const hasSeeded = localStorage.getItem('seededDefaultHabits');
            if (!hasSeeded) {
                const defaults: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>[] = [
                    { name: 'Gym & Exercise', purpose: 'Build physical health and discipline', startTime: '06:00', endTime: '07:30', startDate: new Date().toISOString().split('T')[0], endDate: '2030-12-31', daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
                    { name: 'Breakfast', purpose: 'Fuel for the day', startTime: '08:00', endTime: '09:00', startDate: new Date().toISOString().split('T')[0], endDate: '2030-12-31', daysOfWeek: DAYS_OF_WEEK },
                    { name: 'Lunch', purpose: 'Mid-day reboot', startTime: '12:00', endTime: '13:00', startDate: new Date().toISOString().split('T')[0], endDate: '2030-12-31', daysOfWeek: DAYS_OF_WEEK },
                    { name: 'Dinner', purpose: 'Evening recovery', startTime: '19:00', endTime: '20:00', startDate: new Date().toISOString().split('T')[0], endDate: '2030-12-31', daysOfWeek: DAYS_OF_WEEK },
                ];

                defaults.forEach(d => createHabit.mutate(d as Habit));
                localStorage.setItem('seededDefaultHabits', 'true');
            }
        }
    }, [habits, isLoading, createHabit]);

    const onSubmit = (values: HabitFormValues) => {
        setConflictError(null);
        const endTime = minutesToTime(timeToMinutes(values.startTime) + values.durationPacks * 30);

        // Conflict Check
        // 1. Sleep Conflict
        const sleepStart = user?.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user?.user_metadata?.sleepDuration) || 8;

        if (isSleepOverlapping(values.startTime, endTime, sleepStart, sleepDuration)) {
            const errorMsg = "This habit overlaps with your sleep schedule.";
            setConflictError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        // 2. Existing Habit Conflict
        for (const habit of habits) {
            if (editingId && habit.id === editingId) continue;

            const start1 = new Date(values.startDate);
            const end1 = new Date(values.endDate);
            const start2 = new Date(habit.startDate || '');
            const end2 = new Date(habit.endDate || '');

            if (start1 <= end2 && start2 <= end1) {
                const commonDays = values.daysOfWeek.filter(day => habit.daysOfWeek?.includes(day));
                if (commonDays.length > 0) {
                    if (isTimeOverlapping(values.startTime, endTime, habit.startTime, habit.endTime)) {
                        const errorMsg = `This habit overlaps with "${habit.name}" on ${commonDays[0]}.`;
                        setConflictError(errorMsg);
                        toast.error(errorMsg);
                        return;
                    }
                }
            }
        }

        const habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
            name: values.name,
            purpose: values.purpose,
            startTime: values.startTime,
            endTime: endTime,
            startDate: values.startDate,
            endDate: values.endDate,
            daysOfWeek: values.daysOfWeek,
        };

        if (editingId) {
            updateHabit.mutate({ ...habitData, id: editingId } as Habit);
            setEditingId(null);
        } else {
            createHabit.mutate(habitData as Habit);
        }

        form.reset({
            name: '',
            purpose: '',
            startTime: '06:00',
            durationPacks: 2,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            daysOfWeek: DAYS_OF_WEEK,
        });
        setIsFormOpen(false);
    };

    const handleEdit = (habit: Habit) => {
        setEditingId(habit.id!);
        setConflictError(null);

        // Convert endTime back to durationPacks
        const startMin = timeToMinutes(habit.startTime);
        const endMin = timeToMinutes(habit.endTime);
        const diff = endMin < startMin ? (endMin + 1440 - startMin) : (endMin - startMin);
        const packs = Math.max(1, Math.round(diff / 30));

        form.reset({
            name: habit.name,
            purpose: habit.purpose || '',
            startTime: habit.startTime,
            durationPacks: packs,
            startDate: habit.startDate || new Date().toISOString().split('T')[0],
            endDate: habit.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            daysOfWeek: habit.daysOfWeek || DAYS_OF_WEEK,
        });
        setIsFormOpen(true);
    };

    const filteredHabits = habits.filter((h: Habit) => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalCount = filteredHabits.length;

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

            {/* Search and Counts */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border rounded-lg p-3 w-full shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search habits..."
                        className="pl-9 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium">
                    <span className="text-muted-foreground">Total Habits:</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{totalCount}</span>
                </div>
            </div>

            {isFormOpen && (
                <Card className="border-primary/20 bg-accent/5 focus-within:border-primary/40 transition-all">
                    <CardHeader>
                        <CardTitle>{editingId ? "Edit Habit" : "Add New Habit"}</CardTitle>
                        <CardDescription>Fill in the details for your recurring daily habit.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    <label className="text-sm font-medium">Start Time <span className="text-destructive">*</span></label>
                                    <Controller
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <CustomTimePicker
                                                selected={field.value ? parse(field.value, 'HH:mm', new Date()) : null}
                                                onChange={(date) => field.onChange(date ? format(date, 'HH:mm') : '')}
                                                placeholderText="Select start time"
                                            />
                                        )}
                                    />
                                    {form.formState.errors.startTime && <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Number of Packs (30 min each) <span className="text-destructive">*</span></label>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...form.register('durationPacks', { valueAsNumber: true })}
                                        placeholder="e.g., 2 for 1 hour"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Calculated End Time: <span className="font-bold text-primary">{computedEndTime}</span>
                                    </p>
                                    {form.formState.errors.durationPacks && <p className="text-xs text-destructive">{form.formState.errors.durationPacks.message}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2 border rounded-xl p-4 bg-background">
                                    <label className="text-sm font-medium mb-3 block">Days in a Week <span className="text-destructive">*</span></label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => {
                                            const currentDays = form.watch('daysOfWeek') || [];
                                            const isSelected = currentDays.includes(day);
                                            return (
                                                <label key={day} className={cn(
                                                    "cursor-pointer px-4 py-2 rounded-full text-xs font-bold transition-all border select-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
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
                            {conflictError && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                    {conflictError}
                                </div>
                            )}
                            <Button type="submit" className="w-full md:w-auto px-8" disabled={createHabit.isPending || updateHabit.isPending}>
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
                            <CardContent className="h-40 bg-accent/20" />
                        </Card>
                    ))
                ) : filteredHabits.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-card rounded-xl border border-dashed">
                        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground">No Habits Found</h3>
                        <p className="text-sm text-muted-foreground">There are no habits matching your search criteria.</p>
                    </div>
                ) : (
                    filteredHabits.map((habit: Habit) => (
                        <Card key={habit.id} className="group hover:border-primary/40 transition-all hover:shadow-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg font-bold pr-2 leading-tight">{habit.name}</CardTitle>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(habit)}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setIdToDelete(habit.id!); setShowDeleteConfirm(true); }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                {(habit.purpose) && (
                                    <CardDescription className="line-clamp-2 mt-1 italic text-muted-foreground/80 font-medium">
                                        "{habit.purpose}"
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2.5 text-sm text-foreground/80 font-medium">
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div className="flex flex-col bg-accent/30 p-2 rounded border border-border/50 col-span-2">
                                            <span className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">Time Range</span>
                                            <span className="font-semibold text-primary">{habit.startTime} - {habit.endTime}</span>
                                        </div>
                                    </div>

                                    {habit.startDate && habit.endDate && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 bg-background pt-1">
                                            <CalendarIcon size={12} className="text-primary/60" />
                                            <span>{habit.startDate}</span>
                                            <span className="mx-1 font-light">&rarr;</span>
                                            <span>{habit.endDate}</span>
                                        </div>
                                    )}

                                    {habit.daysOfWeek && habit.daysOfWeek.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {habit.daysOfWeek.map(day => (
                                                <span key={day} className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm">
                                                    {day.substring(0, 3)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    if (idToDelete) {
                        deleteHabit.mutate(idToDelete);
                        setIdToDelete(null);
                        setShowDeleteConfirm(false);
                    }
                }}
                title="Delete Habit?"
                description="Are you sure you want to delete this habit? This will remove all its occurrences from your weekly planning grid."
                confirmText="Delete Habit"
                variant="destructive"
            />
        </div>
    );
};
