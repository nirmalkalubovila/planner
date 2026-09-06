import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Clock, Library, Trash2 } from 'lucide-react-native';
import { useCreateCustomTask } from '@llb/api';
import { CUSTOM_TASK_COLORS, DAYS_OF_WEEK, LifeBucket, toast } from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { BucketSelector } from '@/components/common/bucket-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface CustomTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    color?: string;
    saveToLibrary: boolean;
    isReminder?: boolean;
    bucket?: LifeBucket;
  }) => void;
  onDelete?: (id: string) => void;
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    color?: string;
    isReminder?: boolean;
    bucket?: LifeBucket;
  } | null;
}

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** RN port of apps/web/.../planner/forms/custom-task-dialog.tsx.
 *
 * Fields used to be seeded (or blanked, for a new task) by an effect that
 * ran on open. Re-keying the body on open remounts it instead, so every
 * useState initializer seeds itself — the "else" branch that reset each
 * field back to its default disappears entirely, since a fresh mount with
 * no initialData already starts there. */
export const CustomTaskDialog: React.FC<CustomTaskDialogProps> = (props) => {
  const target = props.initialData;
  return (
    <CustomTaskDialogBody
      key={`${props.isOpen ? 'open' : 'closed'}:${target ? target.id ?? target.name : 'new'}`}
      {...props}
    />
  );
};

const CustomTaskDialogBody: React.FC<CustomTaskDialogProps> = ({ isOpen, onClose, onConfirm, onDelete, initialData }) => {
  // Unlike the task-edit dialog, a null target is a valid state here — it
  // means "create a new task" — so it's normalized to an empty seed once,
  // rather than every field initializer having to guard for it.
  const seed: Partial<NonNullable<CustomTaskDialogProps['initialData']>> = initialData ?? {};

  const [name, setName] = useState(() => seed.name || '');
  const [description, setDescription] = useState(() => seed.description || '');
  const [startTime, setStartTime] = useState(() => seed.startTime || '09:00');
  const [endTime, setEndTime] = useState(() => seed.endTime || '10:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(() => seed.daysOfWeek || []);
  const [color, setColor] = useState(() => seed.color || CUSTOM_TASK_COLORS[0]);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [isReminder, setIsReminder] = useState(() => !!seed.isReminder);
  const [bucket, setBucket] = useState<LifeBucket | null>(() => seed.bucket || null);
  const createLibraryTask = useCreateCustomTask();

  const toggleDay = (day: string) => {
    setSelectedDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  const getEndTimeOfReminder = (timeStr: string): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + 30;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (!name) return;
    if (selectedDays.length === 0) {
      toast.error('Select at least one day below to schedule this.');
      return;
    }
    const resolvedEndTime = isReminder ? getEndTimeOfReminder(startTime) : endTime;

    onConfirm({
      name,
      description,
      startTime,
      endTime: resolvedEndTime,
      daysOfWeek: selectedDays,
      color,
      saveToLibrary,
      isReminder,
      bucket: bucket || undefined,
    });

    if (saveToLibrary) {
      createLibraryTask.mutate({
        name,
        description,
        startTime,
        endTime: resolvedEndTime,
        daysOfWeek: selectedDays,
        color,
        isReminder,
        bucket: bucket || undefined,
      } as any);
    }

    setName('');
    setDescription('');
    setSelectedDays([]);
    setSaveToLibrary(false);
    setIsReminder(false);
    setBucket(null);
    onClose();
  };

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? (isReminder ? 'Edit Reminder' : 'Edit Custom Task') : isReminder ? 'Create Reminder' : 'Create Custom Task'}
      icon={Library}
      footer={
        <View className="flex-row items-center justify-between gap-3">
          {initialData?.id && onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onPress={() => {
                if (initialData.id) {
                  onDelete(initialData.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={18} color="#ef4444" />
            </Button>
          ) : (
            <Button variant="ghost" onPress={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
          )}
          <View className="flex-row gap-3 flex-1">
            {initialData?.id && onDelete && (
              <Button variant="outline" onPress={onClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
            )}
            <Button disabled={!name} onPress={handleConfirm} className="flex-1 rounded-xl">
              Add to Planner
            </Button>
          </View>
        </View>
      }
    >
      <View className="p-5 gap-5">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase font-bold ml-1">
            Task Name
          </Text>
          <Input value={name} onChangeText={setName} placeholder="e.g., Deep Work Session" className="text-base h-11" autoFocus />
        </View>

        <View className="gap-2">
          <Text variant="tiny" className="uppercase font-bold ml-1">
            Description (Optional)
          </Text>
          <Input value={description} onChangeText={setDescription} placeholder="Brief details..." className="h-10" />
        </View>

        <BucketSelector value={bucket} onChange={setBucket} />

        <Pressable
          onPress={() => setIsReminder(!isReminder)}
          className="flex-row items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-transparent"
        >
          <View className={cn('w-5 h-5 rounded items-center justify-center', isReminder ? 'bg-rose-500' : 'bg-card border border-border')}>
            {isReminder && <Check size={14} color="#fff" strokeWidth={3} />}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold">Is Specific Time Reminder</Text>
            <Text variant="tiny">Schedule at a specific moment without a time range</Text>
          </View>
        </Pressable>

        {isReminder ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-1 ml-1">
              <Clock size={12} color="#a1a1aa" />
              <Text variant="tiny" className="uppercase font-bold">
                Reminder Time
              </Text>
            </View>
            <SimpleTimePicker value={startTime} onChange={setStartTime} allowAllMinutes />
          </View>
        ) : (
          <View className="flex-row gap-4">
            <View className="flex-1 gap-2">
              <Text variant="tiny" className="uppercase font-bold ml-1">
                Start Time
              </Text>
              <SimpleTimePicker value={startTime} onChange={setStartTime} />
            </View>
            <View className="flex-1 gap-2">
              <Text variant="tiny" className="uppercase font-bold ml-1">
                End Time
              </Text>
              <SimpleTimePicker value={endTime} onChange={setEndTime} />
            </View>
          </View>
        )}

        <View className="gap-3">
          <View className="flex-row items-baseline gap-1.5 ml-1">
            <Text variant="tiny" className="uppercase font-bold">
              Target Days
            </Text>
            <Text style={{ fontSize: 10 }} className="text-primary font-bold">
              Required — pick where this shows up
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {SHORT_DAYS.map((day, idx) => {
              const fullDayName = DAYS_OF_WEEK[idx];
              const isSelected = selectedDays.includes(fullDayName);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(fullDayName)}
                  className={cn(
                    'h-9 px-3 rounded-md items-center justify-center border',
                    isSelected ? 'bg-primary border-primary' : 'bg-background border-border'
                  )}
                >
                  <Text className={cn('text-xs font-bold', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!isReminder && (
          <View className="gap-3">
            <Text variant="tiny" className="uppercase font-bold ml-1">
              Task Color
            </Text>
            <View className="flex-row gap-2.5">
              {CUSTOM_TASK_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn('w-8 h-8 rounded-full border-2', color === c ? 'border-foreground' : 'border-transparent')}
                />
              ))}
            </View>
          </View>
        )}

        <Pressable onPress={() => setSaveToLibrary(!saveToLibrary)} className="flex-row items-center gap-3 p-3 bg-muted/30 rounded-xl">
          <View className={cn('w-5 h-5 rounded items-center justify-center', saveToLibrary ? 'bg-primary' : 'bg-card border border-border')}>
            {saveToLibrary && <Check size={14} color="#0a0a0a" strokeWidth={3} />}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold">Save to Library</Text>
            <Text variant="tiny">Keep this task template for future quick scheduling</Text>
          </View>
        </Pressable>
      </View>
    </StandardDialog>
  );
};
