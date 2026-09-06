import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Send, X, Loader2, Check, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';



type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CaptureBarProps {
  /** Manual submit — used for send button / Ctrl+S. In new-note mode with an
   *  active draft, the draftId is forwarded so the parent can skip creating a
   *  duplicate. */
  onSubmit: (content: string, draftId?: string) => void;
  /** Background auto-save. Returns the persisted note ID (needed to turn a new
   *  note into an update on subsequent saves). */
  onAutoSave?: (id: string | null, content: string) => Promise<string>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  editNote?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  mainTags?: { tag: string; count: number }[];
}

export const CaptureBar: React.FC<CaptureBarProps> = ({
  onSubmit,
  onAutoSave,
  disabled = false,
  placeholder = 'Capture a thought... (Ctrl+S or Cmd+Enter to save)',
  className,
  editNote,
  onCancelEdit,
  mainTags = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(editNote?.content ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [draftId, setDraftId] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>(editNote?.content ?? '');

  const isEditMode = !!editNote;

  // Sync value when switching to a different note (by id) or entering/exiting edit mode
  useEffect(() => {
    setValue(editNote?.content ?? '');
    lastSavedContentRef.current = editNote?.content ?? '';
    setSaveStatus('idle');
    // When entering edit mode, clear any new-note draft tracking
    if (editNote) setDraftId(null);
  }, [editNote?.id]);

  // Reset draft tracking when exiting edit mode
  useEffect(() => {
    if (!editNote) {
      setDraftId(null);
      lastSavedContentRef.current = '';
    }
  }, [editNote]);

  // Manual submit: send button or Ctrl+S
  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    if (isEditMode) {
      // Edit mode manual submit = save & exit
      onSubmit(trimmed);
    } else {
      // New note mode — pass draftId so parent knows it's already persisted
      onSubmit(trimmed, draftId ?? undefined);
      setValue('');
      setDraftId(null);
      lastSavedContentRef.current = '';
      setSaveStatus('idle');
    }
  }, [value, disabled, onSubmit, isEditMode, draftId]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Background auto-save — works for BOTH new notes (drafts) and edits
  useEffect(() => {
    if (!onAutoSave) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed === lastSavedContentRef.current.trim()) return;

    const noteId = isEditMode ? editNote!.id : draftId;

    const t = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const savedId = await onAutoSave(noteId, trimmed);
        lastSavedContentRef.current = trimmed;
        // If this was a new draft, store its ID for future updates
        if (!isEditMode && !draftId) {
          setDraftId(savedId);
        }
        setSaveStatus('saved');
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [value, isEditMode, editNote?.id, draftId, onAutoSave]);

  // Cleanup
  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

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

  const hasDraft = !!draftId && !isEditMode;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 bg-glass border border-border rounded-2xl p-4 transition-colors focus-within:border-primary/40',
        isEditMode && 'ring-1 ring-primary/20',
        hasDraft && 'ring-1 ring-emerald-500/20',
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
        <div className="flex gap-1 shrink-0 items-center">
          {/* Save status indicator */}
          {saveStatus !== 'idle' && (
            <span className="flex items-center gap-1 text-[10px] mr-1 animate-in fade-in duration-200">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground hidden sm:inline">Saving</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 hidden sm:inline">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <WifiOff size={12} className="text-destructive" />
                  <span className="text-destructive hidden sm:inline">Failed</span>
                </>
              )}
            </span>
          )}
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
