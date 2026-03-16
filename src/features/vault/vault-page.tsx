import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Vault } from 'lucide-react';
import { useNotes, useAddNote, useUpdateNote, useTogglePinNote, useDeleteNote } from '@/api/services/vault-service';
import { CaptureBar } from './components/capture-bar';
import { VaultFilters } from '@/features/vault/components/vault-filters';
import { NoteCard } from './components/note-card';
import { VaultNote } from '@/types/vault';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { Button } from '@/components/ui/button';

const VAULT_FILTER_TAGS = ['ideas', 'problems', 'future', 'nextweek'] as const;

function filterNotes(notes: VaultNote[], activeTag: string | null): VaultNote[] {
  if (!activeTag) return notes;
  return notes.filter((n) => n.tags?.some((t) => t === activeTag));
}

function computeTagCounts(notes: VaultNote[]): { tag: string; count: number }[] {
  const counts: Record<string, number> = {};
  notes.forEach((n) => {
    (n.tags ?? []).forEach((t) => {
      counts[t] = (counts[t] ?? 0) + 1;
    });
  });
  return VAULT_FILTER_TAGS.map((tag) => ({ tag, count: counts[tag] ?? 0 }));
}

export const VaultPage: React.FC = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useNotes();
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const togglePin = useTogglePinNote();
  const deleteNote = useDeleteNote();

  const filteredNotes = useMemo(() => filterNotes(notes, activeTag), [notes, activeTag]);
  const tagCounts = useMemo(() => computeTagCounts(notes), [notes]);

  const handleTagSelect = (tag: string | null) => {
    setActiveTag(tag);
    setEditingNote(null);
  };

  const handleAddNote = (content: string) => {
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, content }, { onSuccess: () => setEditingNote(null) });
    } else {
      addNote.mutate(content);
    }
  };

  const handlePin = (id: string, is_pinned: boolean) => {
    togglePin.mutate({ id, is_pinned });
  };

  const handleEdit = (note: VaultNote) => {
    setEditingNote(note);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteNote.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">
      <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">The Vault</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary/40 rounded-full" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{notes.length} NOTES</span>
          </div>
        </div>
      </div>

      <CaptureBar
        onSubmit={handleAddNote}
        disabled={addNote.isPending || updateNote.isPending}
        editNote={editingNote}
        onCancelEdit={handleCancelEdit}
        mainTags={tagCounts}
        className="mb-2"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <VaultFilters tags={tagCounts} activeTag={activeTag} onSelectTag={handleTagSelect} />
      </div>

      {isLoading ? (
        <div className="col-span-full"><PageLoader /></div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-24 text-center">
          <Vault className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6 group-hover:scale-110 group-hover:text-muted-foreground transition-all duration-500" strokeWidth={1} />
          <h3 className="text-xl font-bold text-muted-foreground tracking-tight leading-none">
            {!activeTag ? 'Vault Empty' : 'No Match'}
          </h3>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
            {!activeTag
              ? 'Capture a thought above. Ctrl+S or Cmd+Enter to save. Auto-saves when editing.'
              : 'No notes match this filter.'}
          </p>
          {!activeTag && (
            <Button
              variant="link"
              className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
              onClick={() => document.getElementById('vault-capture-input')?.focus()}
            >
              + Start Capturing
            </Button>
          )}
        </div>
      ) : (
        <motion.div layout className="columns-2 md:columns-3 lg:columns-4 gap-x-6 gap-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPin={handlePin}
                onDelete={handleDeleteClick}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete note"
        description="This note will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};
