import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Repeat, Target } from 'lucide-react-native';
import { useCreateHabit, useDeleteHabit, useGetHabits, useUpdateHabit } from '@llb/api';
import { toast, type Habit } from '@llb/core';

import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from '@/components/ui/typography';
import { HabitCard } from '@/features/habits/components/habit-card';
import { HabitDefinitionForm, type HabitFormValues } from '@/features/habits/forms/habit-definition-form';
import { useHabitConflicts } from '@/features/habits/hooks/use-habit-conflicts';

export default function HabitsScreen() {
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
      bucket: values.bucket,
    };

    if (editingHabit?.id) {
      updateHabit.mutate({ ...habitData, id: editingHabit.id } as Habit, {
        onSuccess: () => closeDialog(),
      });
    } else {
      createHabit.mutate(habitData as Habit, {
        onSuccess: () => {
          closeDialog();
          toast.success('Habit added to your planner', { description: 'Recurring schedule updated' });
        },
      });
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setConflictError(null);
    setIsFormOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <View className="flex-row items-end justify-between px-4 pt-4 pb-4 border-b border-border">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase tracking-[0.3em] font-bold">
            Habit Collection
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-1 w-12 bg-primary/40 rounded-full" />
            <Text variant="tiny" className="font-black uppercase">
              {habits.length} ACTIVE
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setEditingHabit(null);
            setConflictError(null);
            setIsFormOpen(true);
          }}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-accent"
        >
          <Plus size={26} strokeWidth={2.5} color="#e4e4e7" />
        </Pressable>
      </View>

      {isLoading ? (
        <PageLoader />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerClassName="p-4 gap-3"
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onEdit={handleEdit}
              onDelete={(id) => {
                setIdToDelete(id);
                setShowDeleteConfirm(true);
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Target size={64} color="#3f3f46" strokeWidth={1} />
              <Text className="text-xl font-bold text-muted-foreground mt-6">System Empty</Text>
              <Text variant="muted" className="text-center mt-3">
                Initialize your first habit to begin the architectural process.
              </Text>
              <Pressable onPress={() => setIsFormOpen(true)} className="mt-6">
                <Text variant="tiny" className="text-primary font-bold uppercase tracking-widest">
                  + Begin Initialization
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      <StandardDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        title={editingHabit ? 'Edit Habit' : 'New Habit'}
        subtitle="Define recurring cycles"
        icon={Repeat}
      >
        <HabitDefinitionForm
          key={editingHabit?.id || 'new'}
          initialValues={
            editingHabit
              ? {
                  name: editingHabit.name,
                  purpose: editingHabit.purpose || '',
                  startTime: editingHabit.startTime,
                  endTime: editingHabit.endTime,
                  startDate: editingHabit.startDate || new Date().toISOString().split('T')[0],
                  endDate:
                    editingHabit.endDate ||
                    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  daysOfWeek: editingHabit.daysOfWeek || [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ],
                  bucket: editingHabit.bucket,
                }
              : undefined
          }
          onSubmit={onSubmit}
          isPending={createHabit.isPending || updateHabit.isPending}
        />
        {!!conflictError && (
          <View className="mx-5 mb-5 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <Text variant="tiny" className="text-destructive uppercase font-bold">
              {conflictError}
            </Text>
          </View>
        )}
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
    </SafeAreaView>
  );
}
