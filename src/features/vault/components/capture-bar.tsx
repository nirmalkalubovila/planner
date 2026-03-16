import React, { useRef, useEffect, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MainTag {
  tag: string;
  count: number;
}

interface CaptureBarProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Edit mode: pre-filled content, show Cancel */
  editNote?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  /** Main hashtags to show inside the bar for instant add */
  mainTags?: MainTag[];
}

export const CaptureBar: React.FC<CaptureBarProps> = ({
  onSubmit,
  disabled = false,
  placeholder = 'Capture a thought... (Ctrl+S or Cmd+Enter to save)',
  className,
  editNote,
  onCancelEdit,
  mainTags = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState(editNote?.content ?? '');

  const isEditMode = !!editNote;

  useEffect(() => {
    setValue(editNote?.content ?? '');
  }, [editNote?.id, editNote?.content]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    if (!isEditMode) setValue('');
  }, [value, disabled, onSubmit, isEditMode]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Debounced auto-save when editing (cloud save like planner)
  useEffect(() => {
    if (!isEditMode || !editNote || value.trim() === editNote.content.trim()) return;
    const t = setTimeout(() => submit(), 1500);
    return () => clearTimeout(t);
  }, [value, isEditMode, editNote?.id, editNote?.content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      submit();
    }
  };

  const handleAddTag = (tag: string) => {
    setValue((prev) => {
      if (prev.includes(`#${tag}`)) return prev;
      return prev.trim() ? `${prev.trimEnd()} #${tag}` : `#${tag}`;
    });
    textareaRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 bg-glass border border-border rounded-2xl p-4 transition-colors focus-within:border-primary/40',
        isEditMode && 'ring-1 ring-primary/20',
        className
      )}
    >
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          id="vault-capture-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground text-sm leading-relaxed outline-none"
        />
        <div className="flex gap-1 shrink-0">
          {isEditMode && onCancelEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={onCancelEdit}
              aria-label="Cancel edit"
            >
              <X size={16} />
            </Button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label={isEditMode ? 'Save changes' : 'Save note'}
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {mainTags.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground mr-1">Add:</span>
          {mainTags.map(({ tag }) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddTag(tag)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
