import React, { useState } from 'react';
import { View } from 'react-native';
import { Check, Clock, FileText, Repeat, Tag, Target, Trash2, type LucideIcon } from 'lucide-react-native';
import { useGetGoals } from '@llb/api';
import { LifeBucket } from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { BucketSelector } from '@/components/common/bucket-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { OptionPickerField } from '@/components/ui/option-picker-field';
import { Text } from '@/components/ui/typography';

interface TaskEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
  initialData: any;
}

/** RN port of apps/web/.../planner/forms/task-edit-dialog.tsx.
 *
 * The fields used to be copied out of `initialData` by an effect that ran
 * on open. Re-keying the body on open (and on a change of target) remounts
 * it instead, so each field's useState initializer seeds itself directly —
 * same result, one render earlier, and no setState from an effect. */
export const TaskEditDialog: React.FC<TaskEditDialogProps> = (props) => {
  // The planner keeps this mounted with `initialData={editingTaskData}`,
  // which is null until a block is actually tapped — there's no dialog to
  // build in that state, and rendering one would mean every field
  // initializer had to defend against a null target.
  if (!props.initialData) return null;

  return (
    <TaskEditDialogBody
      key={`${props.isOpen ? 'open' : 'closed'}:${props.initialData.id ?? props.initialData.name ?? ''}`}
      {...props}
    />
  );
};

const TaskEditDialogBody: React.FC<TaskEditDialogProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [name, setName] = useState(() => initialData.name || '');
  const [description, setDescription] = useState(() => initialData.description || '');
  const [goalId, setGoalId] = useState(() => initialData.goalId || '');
  // Fixed for the lifetime of the dialog: it comes from the task being
  // edited and nothing here toggles it, so it's derived rather than state.
  const isReminder = !!initialData.isReminder;
  const [time, setTime] = useState(() => initialData.time || initialData.startTime || '09:00');
  const [bucket, setBucket] = useState<LifeBucket | null>(() => initialData.bucket || null);
  const { data: goals } = useGetGoals();

  const handleSave = () => {
    onSave({
      ...initialData,
      name,
      description,
      goalId: initialData.type === 'goal' ? goalId : undefined,
      isReminder,
      time,
      bucket: bucket || null,
    });
  };

  const isGoalType = initialData?.type === 'goal';
  const isHabitType = initialData?.type === 'habit';
  const icon: LucideIcon = isReminder ? Clock : isHabitType ? Repeat : isGoalType ? Target : Tag;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${isReminder ? 'Reminder' : isHabitType ? 'Habit' : isGoalType ? 'Goal Task' : 'Custom Task'}`}
      subtitle="Update details"
      icon={icon}
      footer={
        <View className="flex-row items-center justify-between">
          {!isHabitType ? (
            <Button variant="ghost" className="rounded-xl" onPress={onDelete}>
              <View className="flex-row items-center gap-2">
                <Trash2 size={16} color="#ef4444" />
                <Text className="text-destructive font-bold">Delete</Text>
              </View>
            </Button>
          ) : (
            <View />
          )}
          <View className="flex-row gap-3">
            <Button variant="secondary" className="rounded-xl" onPress={onClose}>
              Cancel
            </Button>
            <Button className="rounded-xl px-5" onPress={handleSave}>
              <View className="flex-row items-center gap-2">
                <Check size={16} color="#0a0a0a" />
                <Text className="text-primary-foreground font-bold">Save</Text>
              </View>
            </Button>
          </View>
        </View>
      }
    >
      <View className="p-5 gap-5">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase font-bold ml-1">
            Name / Title {isHabitType && '(Fixed)'}
          </Text>
          <Input value={name} onChangeText={setName} placeholder="Working on..." editable={!isHabitType} className="text-base h-11" />
        </View>

        {!isGoalType && !isHabitType && <BucketSelector value={bucket} onChange={setBucket} />}

        {isGoalType && !isReminder && (
          <View className="gap-2">
            <Text variant="tiny" className="uppercase font-bold ml-1">
              Linked Goal
            </Text>
            <OptionPickerField
              value={goalId}
              onValueChange={setGoalId}
              emptyOptionLabel="No Goal Linked"
              title="Select a goal"
              options={(goals || []).map(g => ({ value: g.id || '', label: g.title || g.name }))}
            />
          </View>
        )}

        {isReminder && (
          <View className="gap-2">
            <Text variant="tiny" className="uppercase font-bold ml-1">
              Reminder Time
            </Text>
            <SimpleTimePicker value={time} onChange={setTime} allowAllMinutes />
          </View>
        )}

        <View className="gap-2">
          <View className="flex-row items-center gap-1 ml-1">
            <FileText size={12} color="#a1a1aa" />
            <Text variant="tiny" className="uppercase font-bold">
              Description (Optional)
            </Text>
          </View>
          <Input value={description} onChangeText={setDescription} placeholder="Add notes about this task..." className="h-11" />
        </View>
      </View>
    </StandardDialog>
  );
};
