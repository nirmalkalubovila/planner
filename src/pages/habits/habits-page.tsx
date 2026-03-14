import React, { useState, useEffect } from 'react';
import { Plus, ChevronUp, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useGetHabits, useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/api/services/habit-service';
import { Button } from '@/components/ui/button';
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
    const [conflictError, setConflictError] = useState<string | null>(null);

    // Confirmation state
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: habits = [], isLoading } = useGetHabits();
    const createHabit = useCreateHabit();
    const updateHabit = useUpdateHabit();
    const deleteHabit = useDeleteHabit();

    const onSubmit = (values: HabitFormValues) => {
        setConflictError(null);
        // Calculate end time
        const startMin = timeToMinutes(values.startTime);
        const endMin = startMin + values.durationPacks * 30;
        const endTime = `${Math.floor((endMin % 1440) / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;

        // Conflict Check: Sleep
        const sleepStart = user?.user_metadata?.sleepStart || '22:00';
        const sleepDuration = Number(user?.user_metadata?.sleepDuration) || 8;

        if (isSleepOverlapping(values.startTime, endTime, sleepStart, sleepDuration)) {
            const errorMsg = "This habit overlaps with your sleep schedule.";
            setConflictError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        // Conflict Check: Planning Time
        const planDay = user?.user_metadata?.planDay || 'Sunday';
        const planStartTime = user?.user_metadata?.planStartTime || '21:00';
        const planDurationPacks = Number(user?.user_metadata?.planDurationPacks) || 2;
        const planEndMin = timeToMinutes(planStartTime) + planDurationPacks * 30;
        const planEndTime = `${Math.floor((planEndMin % 1440) / 60).toString().padStart(2, '0')}:${(planEndMin % 60).toString().padStart(2, '0')}`;

        if (values.daysOfWeek.includes(planDay)) {
            if (isTimeOverlapping(values.startTime, endTime, planStartTime, planEndTime)) {
                const errorMsg = `This habit overlaps with your Weekly Planning time on ${planDay} (${planStartTime} - ${planEndTime}).`;
                setConflictError(errorMsg);
                toast.error(errorMsg);
                return;
            }
        }

        // Conflict Check: Other Habits
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

    return (
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4">
            {/* Minimalist Header */}
            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 leading-none">Habit Collection</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{habits.length} ACTIVE</span>
                    </div>
                </div>
                <Button
                    onClick={() => { setIsFormOpen(!isFormOpen); setEditingHabit(null); }}
                    variant={isFormOpen ? "outline" : "default"}
                    className="gap-2 h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300"
                >
                    {isFormOpen ? <ChevronUp size={14} /> : <Plus size={14} />}
                    {isFormOpen ? "Close Panel" : "Architect Habit"}
                </Button>
            </div>

            {isFormOpen && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold tracking-tight text-white/90">{editingHabit ? "Refine Habit" : "New Habit Definition"}</CardTitle>
                            <CardDescription className="text-white/40">Define the recurring cycles of your legacy.</CardDescription>
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
                                <div className="mt-4 p-4 text-xs font-bold uppercase tracking-widest text-destructive bg-destructive/5 border border-destructive/20 rounded-2xl">
                                    {conflictError}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                    ))
                ) : habits.length === 0 ? (
                    <div className="col-span-full py-24 text-center border border-white/5 rounded-[40px] bg-white/[0.01] backdrop-blur-sm">
                        <Target className="w-16 h-16 text-white/10 mx-auto mb-6 opacity-50" strokeWidth={1} />
                        <h3 className="text-xl font-bold text-white/60 tracking-tight">System Empty</h3>
                        <p className="text-sm text-white/20 mt-2 max-w-xs mx-auto">Initialize your first habit to begin the architectural process.</p>
                        <Button
                            onClick={() => setIsFormOpen(true)}
                            variant="link"
                            className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px]"
                        >
                            + Begin Initialization
                        </Button>
                    </div>
                ) : (
                    habits.map((habit: Habit) => (
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
                title="Deconstruct Habit?"
                description="This action will remove all recurring occurrences of this habit from your operational schedule. This cannot be undone."
                confirmText="Confirm Deconstruction"
                variant="destructive"
            />
        </div>
    );
};

export default HabitsPage;
