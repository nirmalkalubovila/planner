import React, { useState, useEffect } from 'react';
import { Plus, ChevronUp, Search, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useGetHabits, useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/api/services/habit-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Habit } from '@/types/global-types';
import { useAuth } from '@/contexts/auth-context';
import { timeToMinutes, isTimeOverlapping, isSleepOverlapping } from '@/utils/time-utils';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { HabitCard } from './components/habit-card';
import { HabitDefinitionForm, HabitFormValues } from './forms/habit-definition-form';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const HabitsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [conflictError, setConflictError] = useState<string | null>(null);

    // Confirmation state
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: habits = [], isLoading } = useGetHabits();
    const createHabit = useCreateHabit();
    const updateHabit = useUpdateHabit();
    const deleteHabit = useDeleteHabit();

    const isSeedingRef = React.useRef(false);

    const onSubmit = (values: HabitFormValues) => {
        setConflictError(null);
        // Calculate end time
        const startMin = timeToMinutes(values.startTime);
        const endMin = startMin + values.durationPacks * 30;
        const endTime = `${Math.floor((endMin % 1440) / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;

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
            if (editingHabit && habit.id === editingHabit.id) continue;

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

        if (editingHabit?.id) {
            updateHabit.mutate({ ...habitData, id: editingHabit.id } as Habit, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setEditingHabit(null);
                }
            });
        } else {
            createHabit.mutate(habitData as Habit, {
                onSuccess: () => {
                    setIsFormOpen(false);
                }
            });
        }
    };

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setConflictError(null);
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
                <Button onClick={() => { setIsFormOpen(!isFormOpen); setEditingHabit(null); }} className="gap-2 w-full sm:w-auto">
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
                        <CardTitle>{editingHabit ? "Edit Habit" : "Add New Habit"}</CardTitle>
                        <CardDescription>Fill in the details for your recurring daily habit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HabitDefinitionForm
                            key={editingHabit?.id || 'new'}
                            initialValues={editingHabit ? {
                                name: editingHabit.name,
                                purpose: editingHabit.purpose || '',
                                startTime: editingHabit.startTime,
                                durationPacks: Math.max(1, Math.round(((timeToMinutes(editingHabit.endTime) < timeToMinutes(editingHabit.startTime) ? (timeToMinutes(editingHabit.endTime) + 1440 - timeToMinutes(editingHabit.startTime)) : (timeToMinutes(editingHabit.endTime) - timeToMinutes(editingHabit.startTime)))) / 30)),
                                startDate: editingHabit.startDate || new Date().toISOString().split('T')[0],
                                endDate: editingHabit.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                                daysOfWeek: editingHabit.daysOfWeek || DAYS_OF_WEEK,
                            } : undefined}
                            onSubmit={onSubmit}
                            isPending={createHabit.isPending || updateHabit.isPending}
                        />
                        {conflictError && (
                            <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                {conflictError}
                            </div>
                        )}
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
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onEdit={handleEdit}
                            onDelete={(id) => { setIdToDelete(id); setShowDeleteConfirm(true); }}
                        />
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

export default HabitsPage;
