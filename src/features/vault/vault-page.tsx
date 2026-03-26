import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Vault, Lightbulb, FileText, X } from 'lucide-react';
import { useNotes, useAddNote, useUpdateNote, useTogglePinNote, useDeleteNote } from '@/api/services/vault-service';
import { VaultFilters } from '@/features/vault/components/vault-filters';
import { NoteCard } from './components/note-card';
import { NoteForm, NoteFormValues, clearNoteDraft, loadDraft, hasDraft, saveDraft } from './forms/note-form';
import { VaultNote, VaultCategory, VAULT_CATEGORIES, CATEGORY_META } from '@/types/vault';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { StandardDialog } from '@/components/common/standard-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function filterNotes(notes: VaultNote[], activeTag: string | null): VaultNote[] {
  if (!activeTag || activeTag === 'all') return notes;
  return notes.filter((n) => n.category === activeTag);
}

function computeTagCounts(notes: VaultNote[]): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  notes.forEach((n) => {
    counts[n.category] = (counts[n.category] ?? 0) + 1;
  });
  return VAULT_CATEGORIES.map((tag) => ({ tag, count: counts[tag] ?? 0 }));
}

function groupByCategory(notes: VaultNote[]): { category: VaultCategory; notes: VaultNote[] }[] {
  const groups: Record<string, VaultNote[]> = {};
  notes.forEach((n) => {
    const cat = n.category || 'ideas';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(n);
  });
  return VAULT_CATEGORIES
    .filter((cat) => groups[cat]?.length)
    .map((cat) => ({ category: cat, notes: groups[cat] }));
}

export const VaultPage: React.FC = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Track whether we're opening from draft or fresh
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftInitialValues, setDraftInitialValues] = useState<Partial<NoteFormValues> | undefined>(undefined);

  const { data: notes = [], isLoading } = useNotes();
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const togglePin = useTogglePinNote();
  const deleteNote = useDeleteNote();

  const filteredNotes = useMemo(() => filterNotes(notes, activeTag), [notes, activeTag]);
  const tagCounts = useMemo(() => computeTagCounts(notes), [notes]);
  const grouped = useMemo(() => {
    if (activeTag && activeTag !== 'all') {
      return [{ category: activeTag as VaultCategory, notes: filteredNotes }];
    }
    return groupByCategory(filteredNotes);
  }, [filteredNotes, activeTag]);

  // Check for draft on mount and after dialog closes
  useEffect(() => {
    setDraftExists(hasDraft());
  }, [isFormOpen]);

  // Open a fresh new note (no draft)
  const handleNewNote = () => {
    setEditingNote(null);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
    setIsFormOpen(true);
  };

  // Resume from draft
  const handleResumeDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setEditingNote(null);
      setIsRestoringDraft(true);
      setDraftInitialValues(draft);
      setIsFormOpen(true);
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    clearNoteDraft();
    setDraftExists(false);
    toast.success('Draft discarded');
  };

  // Close dialog — save as draft if there's unsaved content
  const closeDialog = () => {
    // If we're in new-note mode (not editing), check for unsaved content
    if (!editingNote) {
      // The form auto-saves draft via enableDraft, so it's already in localStorage
      // Just check if draft exists and show toast
      if (hasDraft()) {
        toast('Note saved as draft', {
          icon: '📝',
          description: 'You can resume it anytime from the draft indicator.',
        });
      }
    }
    setIsFormOpen(false);
    setEditingNote(null);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
  };

  const handleSubmit = (values: NoteFormValues) => {
    if (editingNote) {
      updateNote.mutate({
        id: editingNote.id,
        title: values.title,
        content: values.content,
        category: values.category as VaultCategory,
      }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingNote(null);
          toast.success('Note updated');
        }
      });
    } else {
      addNote.mutate({
        title: values.title,
        content: values.content,
        category: values.category as VaultCategory,
      }, {
        onSuccess: () => {
          clearNoteDraft();
          setIsFormOpen(false);
          setEditingNote(null);
          setDraftExists(false);
          toast.success('Note saved to vault');
        }
      });
    }
  };

  const handleEdit = (note: VaultNote) => {
    setEditingNote(note);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
    setIsFormOpen(true);
  };

  const handlePin = (id: string, is_pinned: boolean) => {
    togglePin.mutate({ id, is_pinned });
  };

  // Determine form initial values
  const formInitialValues = editingNote
    ? { title: editingNote.title, content: editingNote.content, category: editingNote.category }
    : isRestoringDraft
      ? draftInitialValues
      : undefined;

  return (
    <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">The Vault</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary/40 rounded-full" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{notes.length} NOTES</span>
          </div>
        </div>
        <Button
          onClick={handleNewNote}
          variant="ghost"
          className="h-10 w-10 p-0 rounded-full text-foreground hover:bg-accent transition-all duration-150 active:scale-95"
          title="New Note"
        >
          <Plus size={26} strokeWidth={2.5} />
        </Button>
      </div>

      {/* Draft indicator banner */}
      {draftExists && !isFormOpen && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <FileText size={18} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">You have an unsaved draft</p>
            <p className="text-[11px] text-muted-foreground truncate">Pick up where you left off</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
              onClick={handleDiscardDraft}
            >
              <X size={14} className="mr-1" />
              Discard
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs h-7 px-3"
              onClick={handleResumeDraft}
            >
              Resume Draft
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <VaultFilters tags={tagCounts} activeTag={activeTag} onSelectTag={setActiveTag} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="col-span-full"><PageLoader /></div>
      ) : notes.length === 0 ? (
        <div className="py-24 text-center">
          <Vault className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" strokeWidth={1} />
          <h3 className="text-xl font-bold text-muted-foreground tracking-tight leading-none">Vault Empty</h3>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
            Capture your first thought. Ideas, problems, future plans — store them all here.
          </p>
          <Button
            onClick={handleNewNote}
            variant="link"
            className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
          >
            + Capture First Thought
          </Button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-24 text-center">
          <h3 className="text-xl font-bold text-muted-foreground tracking-tight leading-none">No Match</h3>
          <p className="text-sm text-muted-foreground mt-3">No notes in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, notes: groupNotes }) => {
            const meta = CATEGORY_META[category];
            return (
              <section key={category}>
                {(!activeTag || activeTag === 'all') && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-bold">{groupNotes.length}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {groupNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onPin={handlePin}
                        onDelete={(id) => { setDeleteId(id); setShowDeleteConfirm(true); }}
                        onEdit={handleEdit}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add/Edit Note Dialog */}
      <StandardDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        title={editingNote ? 'Edit Note' : isRestoringDraft ? 'Resume Draft' : 'New Note'}
        subtitle="Capture your thoughts"
        icon={Lightbulb}
        maxWidth="lg"
      >
        <div className="p-4 sm:p-6">
          <NoteForm
            key={editingNote?.id || (isRestoringDraft ? 'draft' : 'new-' + Date.now())}
            initialValues={formInitialValues}
            onSubmit={handleSubmit}
            isPending={addNote.isPending || updateNote.isPending}
            enableDraft={!editingNote}
          />
        </div>
      </StandardDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (deleteId) {
            deleteNote.mutate(deleteId);
            setDeleteId(null);
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete Note?"
        description="This note will be permanently removed from the vault. This cannot be undone."
        confirmText="Delete Note"
        variant="destructive"
      />
    </div>
  );
};
