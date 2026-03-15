import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Repeat } from 'lucide-react';
import { useGetHabits, useCreateHabit, useDeleteHabit, useUpdateHabit } from '@/api/services/habit-service';
import { Button } from '@/components/ui/button';
import { Habit } from '@/types/global-types';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { StandardDialog } from '@/components/common/standard-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { HabitCard } from './components/habit-card';
import { HabitDefinitionForm, HabitFormValues } from './forms/habit-definition-form';
import { useHabitConflicts } from './hooks/use-habit-conflicts';

export const HabitsPage: React.FC = () => {
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [conflictError, setConflictError] = useState<string | null>(null);

    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: habits = [], isLoading } = useGetHabits();
    const createHabit = useCreateHabit();
    const updateHabit = useUpdateHabit();
    const deleteHabit = useDeleteHabit();

    const { checkConflicts } = useHabitConflicts(habits, editingHabit?.id);

    const closeDialog = () => {
        setIsFormOpen(false);
        setEditingHabit(null);
        setConflictError(null);
    };

    const onSubmit = (values: HabitFormValues) => {
        setConflictError(null);

        const error = checkConflicts({
            startTime: values.startTime,
            endTime: values.endTime,
            daysOfWeek: values.daysOfWeek,
            startDate: values.startDate,
            endDate: values.endDate,
        });

        if (error) {
            setConflictError(error);
            toast.error(error);
            return;
        }

        const habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
            name: values.name,
            purpose: values.purpose,
            startTime: values.startTime,
            endTime: values.endTime,
            startDate: values.startDate,
            endDate: values.endDate,
            daysOfWeek: values.daysOfWeek,
        };

        if (editingHabit?.id) {
            updateHabit.mutate({ ...habitData, id: editingHabit.id } as Habit, {
                onSuccess: () => closeDialog()
            });
        } else {
            createHabit.mutate(habitData as Habit, {
                onSuccess: () => {
                    closeDialog();
                    toast.success('Habit added to your planner', {
                        description: 'Recurring schedule updated',
                        action: { label: 'Open Planner', onClick: () => navigate('/planner') },
                    });
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
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">
            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 leading-none">Habit Collection</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{habits.length} ACTIVE</span>
                    </div>
                </div>
                <Button
                    onClick={() => { setEditingHabit(null); setConflictError(null); setIsFormOpen(true); }}
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-full text-white hover:bg-white/10 transition-all duration-150 active:scale-95"
                    title="New Habit"
                >
                    <Plus size={26} strokeWidth={2.5} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {isLoading ? (
                    <div className="col-span-full"><PageLoader /></div>
                ) : habits.length === 0 ? (
                    <div className="col-span-full py-24 text-center border border-white/5 rounded-[40px] bg-white/[0.01] backdrop-blur-sm group hover:border-white/10 transition-colors">
                        <Target className="w-16 h-16 text-white/5 mx-auto mb-6 group-hover:scale-110 group-hover:text-white/10 transition-all duration-500" strokeWidth={1} />
                        <h3 className="text-xl font-bold text-white/40 tracking-tight leading-none">System Empty</h3>
                        <p className="text-sm text-white/20 mt-3 max-w-xs mx-auto">Initialize your first habit to begin the architectural process.</p>
                        <Button
                            onClick={() => setIsFormOpen(true)}
                            variant="link"
                            className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
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

            <StandardDialog
                isOpen={isFormOpen}
                onClose={closeDialog}
                title={editingHabit ? 'Edit Habit' : 'New Habit'}
                subtitle="Define recurring cycles"
                icon={Repeat}
                maxWidth="lg"
            >
                <div className="p-4 sm:p-6">
                    <HabitDefinitionForm
                        key={editingHabit?.id || 'new'}
                        initialValues={editingHabit ? {
                            name: editingHabit.name,
                            purpose: editingHabit.purpose || '',
                            startTime: editingHabit.startTime,
                            endTime: editingHabit.endTime,
                            startDate: editingHabit.startDate || new Date().toISOString().split('T')[0],
                            endDate: editingHabit.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                            daysOfWeek: editingHabit.daysOfWeek || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        } : undefined}
                        onSubmit={onSubmit}
                        isPending={createHabit.isPending || updateHabit.isPending}
                    />
                    {conflictError && (
                        <div className="mt-4 p-3 text-xs font-bold uppercase tracking-widest text-destructive bg-destructive/5 border border-destructive/20 rounded-xl">
                            {conflictError}
                        </div>
                    )}
                </div>
            </StandardDialog>

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
