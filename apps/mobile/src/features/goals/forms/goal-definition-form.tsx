import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import type { LifeBucket } from '@llb/core';

import { BucketSelector } from '@/components/common/bucket-selector';
import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/typography';

function parseLegacyName(text: string): { currentState: string; ultimateGoal: string } {
  if (!text) return { currentState: '', ultimateGoal: '' };
  const marker1 = 'Current State:\n';
  const marker2 = '\n\nUltimate Goal:\n';
  const h1 = text.indexOf(marker1);
  const h2 = text.indexOf(marker2);
  if (h1 !== -1 && h2 !== -1) {
    return {
      currentState: text.substring(h1 + marker1.length, h2).trim(),
      ultimateGoal: text.substring(h2 + marker2.length).trim(),
    };
  }
  return { currentState: text, ultimateGoal: '' };
}

function parseLegacyPurpose(text: string): string {
  if (!text) return '';
  const marker = 'Strict Constraints:\n';
  const defMarker = '\n\nDefinition of Success:\n';
  const h1 = text.indexOf(marker);
  const h2 = text.indexOf(defMarker);
  if (h1 !== -1) {
    const end = h2 !== -1 ? h2 : text.length;
    return text.substring(h1 + marker.length, end).trim();
  }
  return text;
}

const formSchema = z
  .object({
    title: z.string().min(1, 'Give your goal a short name').max(60, 'Title must be 60 characters or less'),
    currentState: z.string().min(1, 'Describe where you are right now'),
    ultimateGoal: z.string().min(1, 'Describe what you want to achieve'),
    constraints: z.string().min(1, 'Mention your limits or constraints'),
    startDate: z.string().min(1, 'Pick a start date'),
    goalType: z.enum(['Week', 'Month', 'Year']),
    durationValue: z.number().min(1, 'Duration must be at least 1'),
  })
  .superRefine((data, ctx) => {
    if (data.goalType === 'Week' && (data.durationValue < 1 || data.durationValue > 4)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Week Goal: 1-4 weeks', path: ['durationValue'] });
    }
    if (data.goalType === 'Month' && (data.durationValue < 2 || data.durationValue > 12)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Month Goal: 2-12 months', path: ['durationValue'] });
    }
    if (data.goalType === 'Year' && (data.durationValue < 2 || data.durationValue > 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Year Goal: 2-10 years', path: ['durationValue'] });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface GoalFormValues {
  title: string;
  name: string;
  purpose: string;
  startDate: string;
  goalType: 'Week' | 'Month' | 'Year';
  durationValue?: number;
  bucket?: LifeBucket;
}

interface GoalDefinitionFormProps {
  initialValues?: Partial<GoalFormValues>;
  onSubmit: (values: GoalFormValues, mode?: 'save' | 'replan') => void;
  isEditing?: boolean;
}

const DURATION_RANGE: Record<FormValues['goalType'], [number, number]> = {
  Week: [1, 4],
  Month: [2, 12],
  Year: [2, 10],
};

/** Port of apps/web/src/features/goals/forms/goal-definition-form.tsx —
 * same schema, same "Current State / Ultimate Goal / Constraints" ->
 * name/purpose text-packing scheme (kept so the DB rows stay compatible
 * with what web already writes/reads). The "copy template" button is
 * dropped — no clipboard module in this build yet. */
export const GoalDefinitionForm: React.FC<GoalDefinitionFormProps> = ({ initialValues, onSubmit, isEditing }) => {
  const [bucket, setBucket] = useState<LifeBucket | null>(initialValues?.bucket || null);
  const templateText = `I am [your age] and currently [your situation, e.g., a student / working at / freelancing].\nI want to [your goal, e.g., build a clothing brand / start a YouTube channel / get fit].\nMy limits: [e.g., I can spend 2 hours a day, I have a small budget, I'm a beginner].`;

  const parsedName = parseLegacyName(initialValues?.name || '');
  const parsedConstraints = parseLegacyPurpose(initialValues?.purpose || '');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || '',
      currentState: parsedName.currentState,
      ultimateGoal: parsedName.ultimateGoal,
      constraints: parsedConstraints,
      startDate: initialValues?.startDate || '',
      goalType: initialValues?.goalType || 'Week',
      durationValue: initialValues?.durationValue || 1,
    },
  });

  const watchedGoalType = form.watch('goalType');
  const [durMin, durMax] = DURATION_RANGE[watchedGoalType];

  const handleFormSubmit = (formValues: FormValues, mode: 'save' | 'replan' = 'replan') => {
    const name = `Current State:\n${formValues.currentState}\n\nUltimate Goal:\n${formValues.ultimateGoal}`;
    const purpose = `Strict Constraints:\n${formValues.constraints}`;
    onSubmit(
      {
        title: formValues.title,
        name,
        purpose,
        startDate: formValues.startDate,
        goalType: formValues.goalType,
        durationValue: formValues.durationValue,
        bucket: bucket || undefined,
      },
      mode
    );
  };

  return (
    <View className="gap-5 p-5">
      <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 gap-2">
        <Text variant="tiny" className="text-primary font-bold uppercase tracking-wider">
          Quick Template
        </Text>
        <Text variant="tiny" className="font-mono bg-background/50 p-2.5 rounded-lg border border-border/50">
          {templateText}
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Goal Title</Text>
        <Controller
          control={form.control}
          name="title"
          render={({ field }) => (
            <Input value={field.value} onChangeText={field.onChange} placeholder="e.g., Build a clothing brand" maxLength={60} />
          )}
        />
        {!!form.formState.errors.title && (
          <Text className="text-xs text-destructive">{form.formState.errors.title.message}</Text>
        )}
      </View>

      <TextAreaField
        label="Where You Are Now"
        hint="Your current situation in a few words"
        control={form.control}
        name="currentState"
        placeholder="e.g., I'm a 22 year old university student with basic design skills and a small savings."
        error={form.formState.errors.currentState?.message}
      />

      <TextAreaField
        label="What You Want to Achieve"
        hint="The end result you're working towards"
        control={form.control}
        name="ultimateGoal"
        placeholder="e.g., Launch my own clothing brand online, get first 50 orders, and build a social media following."
        error={form.formState.errors.ultimateGoal?.message}
      />

      <TextAreaField
        label="Your Limits"
        hint="Any time, money, or skill constraints to keep in mind"
        control={form.control}
        name="constraints"
        placeholder="e.g., I can only work on this 2 hours a day, my budget is around 15,000 LKR, and I have no marketing experience."
        error={form.formState.errors.constraints?.message}
      />

      <BucketSelector value={bucket} onChange={setBucket} />

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <CalendarIcon size={14} color="#e4e4e7" />
          <Text className="text-sm font-medium text-foreground">Start Date</Text>
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
        {!!form.formState.errors.startDate && (
          <Text className="text-xs text-destructive">{form.formState.errors.startDate.message}</Text>
        )}
        <Text variant="tiny" className="text-rose-400 font-semibold">
          * Best to start on a Monday for clean weekly planning.
        </Text>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1 gap-2">
          <Text className="text-sm font-medium text-foreground">Goal Type</Text>
          <Controller
            control={form.control}
            name="goalType"
            render={({ field }) => (
              <SelectField
                value={field.value}
                onValueChange={(v) => field.onChange(v as FormValues['goalType'])}
                options={['Week', 'Month', 'Year']}
                title="Goal Type"
              />
            )}
          />
        </View>
        <View className="flex-1 gap-2">
          <Text className="text-sm font-medium text-foreground">
            Duration ({watchedGoalType}s, {durMin}-{durMax})
          </Text>
          <Controller
            control={form.control}
            name="durationValue"
            render={({ field }) => (
              <Input
                value={String(field.value ?? '')}
                onChangeText={(v) => field.onChange(Number(v.replace(/[^0-9]/g, '')) || 0)}
                keyboardType="number-pad"
              />
            )}
          />
          {!!form.formState.errors.durationValue && (
            <Text className="text-xs text-destructive">{form.formState.errors.durationValue.message}</Text>
          )}
        </View>
      </View>

      {isEditing ? (
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={form.handleSubmit((v) => handleFormSubmit(v, 'save'))} className="flex-1">
            Save Goal
          </Button>
          <Button onPress={form.handleSubmit((v) => handleFormSubmit(v, 'replan'))} className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-primary-foreground font-bold text-xs">Re-plan Goal</Text>
              <ChevronRight size={16} color="#000000" />
            </View>
          </Button>
        </View>
      ) : (
        <Button onPress={form.handleSubmit((v) => handleFormSubmit(v, 'replan'))}>
          <View className="flex-row items-center gap-1">
            <Text className="text-primary-foreground font-bold text-xs">Save & Continue</Text>
            <ChevronRight size={16} color="#000000" />
          </View>
        </Button>
      )}
    </View>
  );
};

function TextAreaField({
  label,
  hint,
  control,
  name,
  placeholder,
  error,
}: {
  label: string;
  hint: string;
  control: any;
  name: 'currentState' | 'ultimateGoal' | 'constraints';
  placeholder: string;
  error?: string;
}) {
  return (
    <View className="gap-2">
      <View>
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <Text variant="tiny">{hint}</Text>
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            placeholder={placeholder}
            placeholderTextColor="#71717a"
            multiline
            textAlignVertical="top"
            className="w-full min-h-[70px] rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground"
            style={{ includeFontPadding: false }}
          />
        )}
      />
      {!!error && <Text className="text-xs text-destructive">{error}</Text>}
    </View>
  );
}
