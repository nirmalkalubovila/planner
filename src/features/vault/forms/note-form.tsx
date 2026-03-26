import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { VAULT_CATEGORIES, CATEGORY_META } from '@/types/vault';

const DRAFT_KEY = 'vault_note_draft';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Write your thought'),
  category: z.string().min(1, 'Select a category'),
});

export type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteFormProps {
  initialValues?: Partial<NoteFormValues>;
  onSubmit: (values: NoteFormValues) => void;
  isPending?: boolean;
  /** When true, form auto-saves to localStorage on change */
  enableDraft?: boolean;
}

/** Save draft to localStorage */
export function saveDraft(values: Partial<NoteFormValues>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch { /* ignore */ }
}

/** Load draft from localStorage */
export function loadDraft(): Partial<NoteFormValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only return if there's actual content
    if (parsed.title?.trim() || parsed.content?.trim()) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Check if a draft exists */
export function hasDraft(): boolean {
  return loadDraft() !== null;
}

/** Clear draft from localStorage */
export function clearNoteDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export const NoteForm: React.FC<NoteFormProps> = ({
  initialValues,
  onSubmit,
  isPending,
  enableDraft = false,
}) => {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: initialValues?.title || '',
      content: initialValues?.content || '',
      category: initialValues?.category || 'ideas',
    },
  });

  const watchedValues = form.watch();

  // Auto-save draft to localStorage when enabled
  useEffect(() => {
    if (!enableDraft) return;
    const trimmedTitle = watchedValues.title?.trim();
    const trimmedContent = watchedValues.content?.trim();
    if (trimmedTitle || trimmedContent) {
      saveDraft(watchedValues);
    }
  }, [watchedValues.title, watchedValues.content, watchedValues.category, enableDraft]);

  const handleSubmit = (values: NoteFormValues) => {
    clearNoteDraft();
    onSubmit(values);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
        <Input
          {...form.register('title')}
          placeholder="Give your thought a title"
          autoFocus
        />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
        <div className="flex flex-wrap gap-2">
          {VAULT_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isSelected = form.watch('category') === cat;
            return (
              <label
                key={cat}
                className={cn(
                  'cursor-pointer px-3 py-1.5 rounded-full text-xs font-bold transition-all border select-none',
                  'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                  isSelected
                    ? `${meta.bgClass} ${meta.color} border shadow-md`
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <input
                  type="radio"
                  value={cat}
                  className="sr-only"
                  {...form.register('category')}
                />
                {meta.label}
              </label>
            );
          })}
        </div>
        {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Thought <span className="text-destructive">*</span></label>
        <textarea
          {...form.register('content')}
          placeholder="Capture your thought, idea, or plan..."
          rows={4}
          className="w-full min-h-[100px] max-h-[300px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        />
        {form.formState.errors.content && <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>}
      </div>

      <Button type="submit" className="w-full md:w-auto px-8" disabled={isPending}>
        {initialValues?.title ? 'Update Note' : 'Save to Vault'}
      </Button>
    </form>
  );
};
