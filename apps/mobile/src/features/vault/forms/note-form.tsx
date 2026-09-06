import React, { useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VAULT_CATEGORIES, CATEGORY_META, kv } from '@llb/core';
import { CATEGORY_CLASSES } from '@/theme/category-classes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

const DRAFT_KEY = 'vault_note_draft';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Write your thought'),
  category: z.string().min(1, 'Select a category'),
  source_page: z.string().optional().nullable(),
});

export type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteFormProps {
  initialValues?: Partial<NoteFormValues>;
  onSubmit: (values: NoteFormValues) => void;
  isPending?: boolean;
  /** When true, form auto-saves to MMKV on change */
  enableDraft?: boolean;
}

/** Port of apps/web/src/features/vault/forms/note-form.tsx — same schema,
 * same auto-save-draft behavior, MMKV (via @llb/core's kv port) standing in
 * for web's localStorage. Vault drafts are app-local by design (per the
 * plan), so this reads/writes the port directly rather than going through
 * a shared service. */
export function saveDraft(values: Partial<NoteFormValues>) {
  try {
    kv.persistent.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    /* ignore */
  }
}

export function loadDraft(): Partial<NoteFormValues> | null {
  try {
    const raw = kv.persistent.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.title?.trim() || parsed.content?.trim()) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function hasDraft(): boolean {
  return loadDraft() !== null;
}

export function clearNoteDraft() {
  kv.persistent.removeItem(DRAFT_KEY);
}

export const NoteForm: React.FC<NoteFormProps> = ({ initialValues, onSubmit, isPending, enableDraft = false }) => {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: initialValues?.title || '',
      content: initialValues?.content || '',
      category: initialValues?.category || 'ideas',
      source_page: initialValues?.source_page || '',
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (!enableDraft) return;
    const trimmedTitle = watchedValues.title?.trim();
    const trimmedContent = watchedValues.content?.trim();
    if (trimmedTitle || trimmedContent) {
      saveDraft(watchedValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.title, watchedValues.content, watchedValues.category, watchedValues.source_page, enableDraft]);

  const handleSubmit = (values: NoteFormValues) => {
    clearNoteDraft();
    onSubmit(values);
  };

  const category = form.watch('category');
  const showSourceField = ['quotes', 'reading', 'resources'].includes(category);

  return (
    <View className="gap-5 p-5">
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          Title <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="title"
          render={({ field }) => (
            <Input value={field.value} onChangeText={field.onChange} placeholder="Give your thought a title" />
          )}
        />
        {!!form.formState.errors.title && (
          <Text className="text-xs text-destructive">{form.formState.errors.title.message}</Text>
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          Category <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {VAULT_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const classes = CATEGORY_CLASSES[cat];
                const isSelected = field.value === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => field.onChange(cat)}
                    className={cn(
                      'px-3.5 py-2 rounded-full border',
                      isSelected ? classes.bgClass : 'bg-card border-border'
                    )}
                  >
                    <Text className={cn('text-xs font-bold', isSelected ? classes.color : 'text-muted-foreground')}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        {!!form.formState.errors.category && (
          <Text className="text-xs text-destructive">{form.formState.errors.category.message}</Text>
        )}
      </View>

      {showSourceField && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">
            Source / Reference <Text variant="small">(e.g., Book, page number, or web link)</Text>
          </Text>
          <Controller
            control={form.control}
            name="source_page"
            render={({ field }) => (
              <Input
                value={field.value || ''}
                onChangeText={field.onChange}
                placeholder="e.g. Atomic Habits, p. 24"
              />
            )}
          />
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">
          Your Thought <Text className="text-destructive">*</Text>
        </Text>
        <Controller
          control={form.control}
          name="content"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Capture your thought, idea, or plan..."
              placeholderTextColor="#71717a"
              multiline
              textAlignVertical="top"
              className="w-full min-h-[160px] rounded-md border border-input bg-transparent px-3 py-2.5 text-sm text-foreground"
              style={{ includeFontPadding: false }}
            />
          )}
        />
        {!!form.formState.errors.content && (
          <Text className="text-xs text-destructive">{form.formState.errors.content.message}</Text>
        )}
      </View>

      <Button onPress={form.handleSubmit(handleSubmit)} loading={isPending}>
        {initialValues?.title ? 'Update Note' : 'Save to Vault'}
      </Button>
    </View>
  );
};
