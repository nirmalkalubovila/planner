import React from 'react';
import { Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react-native';

import { BucketSelector } from '@/components/common/bucket-selector';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Text } from '@/components/ui/typography';
import type { LifeBucket } from '@llb/core';
import { cn } from '@/lib/cn';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  startDate: z.string().min(1, 'Starting date is required'),
  endDate: z.string().min(1, 'Ending date is required'),
  daysOfWeek: z.array(z.string()).min(1, 'Select at least one day'),
});

export type HabitFormValues = z.infer<typeof habitSchema> & { bucket?: LifeBucket };

interface HabitDefinitionFormProps {
  initialValues?: Partial<HabitFormValues>;
  onSubmit: (values: HabitFormValues) => void;
  isPending?: boolean;
}

/** Port of apps/web/src/features/habits/forms/habit-definition-form.tsx —
 * same schema and same field set. Every field goes through Controller
 * (not register()) since RN inputs don't share the DOM ref shape RHF's
 * register() expects. */
export const HabitDefinitionForm: React.FC<HabitDefinitionFormProps> = ({
  initialValues,
  onSubmit,
  isPending,
}) => {
  const [bucket, setBucket] = React.useState<LifeBucket | null>(initialValues?.bucket || null);
  const form = useForm<z.infer<typeof habitSchema>>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: initialValues?.name || '',
      purpose: initialValues?.purpose || '',
      startTime: initialValues?.startTime || '06:00',
      endTime: initialValues?.endTime || '07:00',
      startDate: initialValues?.startDate || new Date().toISOString().split('T')[0],
      endDate:
        initialValues?.endDate ||
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      daysOfWeek: initialValues?.daysOfWeek || DAYS_OF_WEEK,
    },
  });

  const handleFormSubmit = (values: z.infer<typeof habitSchema>) => {
    onSubmit({ ...values, bucket: bucket || undefined });
  };

  return (
    <View className="gap-5 p-5">
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          Habit Name <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <Input value={field.value} onChangeText={field.onChange} placeholder="e.g., Gym & Exercise" />
          )}
        />
        {!!form.formState.errors.name && (
          <Text className="text-xs text-destructive">{form.formState.errors.name.message}</Text>
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          Habit Purpose <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <Input value={field.value} onChangeText={field.onChange} placeholder="e.g., Build strength & discipline" />
          )}
        />
        {!!form.formState.errors.purpose && (
          <Text className="text-xs text-destructive">{form.formState.errors.purpose.message}</Text>
        )}
      </View>

      <BucketSelector value={bucket} onChange={setBucket} />

      <View className="flex-row gap-4">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <CalendarIcon size={14} color="#e4e4e7" />
            <Text className="text-sm font-medium text-foreground">
              Start Date <Text className="text-destructive">*</Text>
            </Text>
          </View>
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
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <CalendarIcon size={14} color="#e4e4e7" />
            <Text className="text-sm font-medium text-foreground">
              End Date <Text className="text-destructive">*</Text>
            </Text>
          </View>
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
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="#e4e4e7" />
            <Text className="text-sm font-medium text-foreground">
              Start Time <Text className="text-destructive">*</Text>
            </Text>
          </View>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field }) => <SimpleTimePicker value={field.value} onChange={field.onChange} />}
          />
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="#e4e4e7" />
            <Text className="text-sm font-medium text-foreground">
              End Time <Text className="text-destructive">*</Text>
            </Text>
          </View>
          <Controller
            control={form.control}
            name="endTime"
            render={({ field }) => <SimpleTimePicker value={field.value} onChange={field.onChange} />}
          />
        </View>
      </View>

      <View className="gap-3 border border-border rounded-xl p-4 bg-background">
        <Text className="text-sm font-medium text-foreground">
          Days in a Week <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="daysOfWeek"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (field.value || []).includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      const current = field.value || [];
                      field.onChange(
                        isSelected ? current.filter((d) => d !== day) : [...current, day]
                      );
                    }}
                    className={cn(
                      'px-3.5 py-2 rounded-full border',
                      isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-bold',
                        isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        {!!form.formState.errors.daysOfWeek && (
          <Text className="text-xs text-destructive">{form.formState.errors.daysOfWeek.message}</Text>
        )}
      </View>

      <Button onPress={form.handleSubmit(handleFormSubmit)} loading={isPending}>
        {initialValues?.name ? 'Update Habit' : 'Save Habit'}
      </Button>
    </View>
  );
};
