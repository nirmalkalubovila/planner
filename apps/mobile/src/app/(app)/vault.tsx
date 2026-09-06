import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Plus, Vault, X } from 'lucide-react-native';
import { useAddNote, useDeleteNote, useNotes, useReminders, useTogglePinNote, useUpdateNote } from '@llb/api';
import { CATEGORY_META, VAULT_CATEGORIES, toast, type VaultCategory, type VaultNote } from '@llb/core';

import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { NoteCard } from '@/features/vault/components/note-card';
import { NoteViewDialog } from '@/features/vault/components/note-view-dialog';
import { VaultFilters } from '@/features/vault/components/vault-filters';
import { clearNoteDraft, hasDraft, loadDraft, NoteForm, type NoteFormValues } from '@/features/vault/forms/note-form';

function filterNotes(notes: VaultNote[], activeTag: string | null, reminders: any[]): VaultNote[] {
  if (!activeTag || activeTag === 'all') return notes;
  if (activeTag === 'reminders') {
    const reminderNoteIds = new Set(reminders.map((r) => r.note_id));
    return notes.filter((n) => reminderNoteIds.has(n.id));
  }
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
  return VAULT_CATEGORIES.filter((cat) => groups[cat]?.length).map((cat) => ({ category: cat, notes: groups[cat] }));
}

export default function VaultScreen() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null);
  const [viewingNote, setViewingNote] = useState<VaultNote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  // Seeded from storage on mount and refreshed in closeDialog(), rather
  // than re-read by an effect on every isFormOpen change: the draft
  // indicator is hidden outright while the form is open (see its render
  // below), so closing is the only moment the answer can have changed.
  const [draftExists, setDraftExists] = useState(() => hasDraft());
  const [draftInitialValues, setDraftInitialValues] = useState<Partial<NoteFormValues> | undefined>(undefined);

  const { data: notes = [], isLoading } = useNotes();
  const { data: reminders = [] } = useReminders();

  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const togglePin = useTogglePinNote();
  const deleteNote = useDeleteNote();

  const filteredNotes = useMemo(() => filterNotes(notes, activeTag, reminders), [notes, activeTag, reminders]);
  const tagCounts = useMemo(() => computeTagCounts(notes), [notes]);
  const grouped = useMemo(() => {
    if (activeTag && activeTag !== 'all' && activeTag !== 'reminders') {
      return [{ category: activeTag as VaultCategory, notes: filteredNotes }];
    }
    return groupByCategory(filteredNotes);
  }, [filteredNotes, activeTag]);

  const sections = useMemo(
    () => grouped.map((g) => ({ title: CATEGORY_META[g.category].label, data: g.notes })),
    [grouped]
  );

  const activeViewingNote = useMemo(() => {
    if (!viewingNote) return null;
    return notes.find((n) => n.id === viewingNote.id) || viewingNote;
  }, [notes, viewingNote]);

  const handleNewNote = () => {
    setEditingNote(null);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
    setIsFormOpen(true);
  };

  const handleResumeDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setEditingNote(null);
      setIsRestoringDraft(true);
      setDraftInitialValues(draft);
      setIsFormOpen(true);
    }
  };

  const handleDiscardDraft = () => {
    clearNoteDraft();
    setDraftExists(false);
    toast.success('Draft discarded');
  };

  const closeDialog = () => {
    const draftPending = hasDraft();
    if (!editingNote && draftPending) {
      toast('Note saved as draft', { description: 'You can resume it anytime from the draft indicator.' });
    }
    setDraftExists(draftPending);
    setIsFormOpen(false);
    setEditingNote(null);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
  };

  const handleSubmit = (values: NoteFormValues) => {
    if (editingNote) {
      updateNote.mutate(
        { id: editingNote.id, title: values.title, content: values.content, category: values.category as VaultCategory, source_page: values.source_page || null },
        { onSuccess: () => { setIsFormOpen(false); setEditingNote(null); toast.success('Note updated'); } }
      );
    } else {
      addNote.mutate(
        { title: values.title, content: values.content, category: values.category as VaultCategory, source_page: values.source_page || null },
        {
          onSuccess: () => {
            clearNoteDraft();
            setIsFormOpen(false);
            setEditingNote(null);
            setDraftExists(false);
            toast.success('Note saved to vault');
          },
        }
      );
    }
  };

  const handleEdit = (note: VaultNote) => {
    setEditingNote(note);
    setIsRestoringDraft(false);
    setDraftInitialValues(undefined);
    setIsFormOpen(true);
  };

  const handlePin = (id: string, is_pinned: boolean) => togglePin.mutate({ id, is_pinned });

  const handleReminderClick = () => toast.info('Reminders are coming soon.');

  const formInitialValues = editingNote
    ? { title: editingNote.title, content: editingNote.content, category: editingNote.category, source_page: editingNote.source_page }
    : isRestoringDraft
      ? draftInitialValues
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <View className="flex-row items-end justify-between px-4 pt-4 pb-4 border-b border-border">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase tracking-[0.3em] font-bold">
            The Vault
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-1 w-12 bg-primary/40 rounded-full" />
            <Text variant="tiny" className="font-black uppercase">
              {notes.length} NOTES
            </Text>
          </View>
        </View>
        <Pressable onPress={handleNewNote} className="h-10 w-10 items-center justify-center rounded-full active:bg-accent">
          <Plus size={26} strokeWidth={2.5} color="#e4e4e7" />
        </Pressable>
      </View>

      {draftExists && !isFormOpen && (
        <View className="flex-row items-center gap-3 mx-4 mt-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <FileText size={18} color="#fbbf24" />
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground">You have an unsaved draft</Text>
            <Text variant="tiny">Pick up where you left off</Text>
          </View>
          <Pressable onPress={handleDiscardDraft} className="p-1.5">
            <X size={14} color="#a1a1aa" />
          </Pressable>
          <Button size="sm" onPress={handleResumeDraft}>
            Resume
          </Button>
        </View>
      )}

      <View className="py-3">
        <VaultFilters tags={tagCounts} activeTag={activeTag} onSelectTag={setActiveTag} />
      </View>

      {isLoading ? (
        <PageLoader />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4 gap-3"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            !activeTag || activeTag === 'all' || activeTag === 'reminders' ? (
              <View className="flex-row items-center gap-2 mb-3 mt-2 bg-background">
                <Text variant="tiny" className="font-black uppercase tracking-widest">
                  {section.title}
                </Text>
                <View className="flex-1 h-px bg-border" />
                <Text variant="tiny">{section.data.length}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="mb-3">
              <NoteCard
                note={item}
                reminder={reminders.find((r) => r.note_id === item.id)}
                onPin={handlePin}
                onDelete={(id) => { setDeleteId(id); setShowDeleteConfirm(true); }}
                onEdit={handleEdit}
                onReminderClick={handleReminderClick}
                onClick={setViewingNote}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-24 px-6">
              <Vault size={64} color="#3f3f46" strokeWidth={1} />
              <Text className="text-xl font-bold text-muted-foreground mt-6">
                {notes.length === 0 ? 'Vault Empty' : 'No Match'}
              </Text>
              <Text variant="muted" className="text-center mt-3">
                {notes.length === 0
                  ? 'Capture your first thought. Ideas, problems, future plans, favorite quotes — store them all here.'
                  : 'No notes found matching this filter.'}
              </Text>
              {notes.length === 0 && (
                <Pressable onPress={handleNewNote} className="mt-6">
                  <Text variant="tiny" className="text-primary font-bold uppercase tracking-widest">
                    + Capture First Thought
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      <StandardDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        title={editingNote ? 'Edit Note' : isRestoringDraft ? 'Resume Draft' : 'New Note'}
        subtitle="Capture your thoughts"
      >
        <NoteForm
          key={editingNote?.id || (isRestoringDraft ? 'draft' : 'new')}
          initialValues={formInitialValues}
          onSubmit={handleSubmit}
          isPending={addNote.isPending || updateNote.isPending}
          enableDraft={!editingNote}
        />
      </StandardDialog>

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

      <NoteViewDialog
        isOpen={viewingNote !== null}
        onClose={() => setViewingNote(null)}
        note={activeViewingNote}
        reminder={activeViewingNote ? reminders.find((r) => r.note_id === activeViewingNote.id) : null}
        onPin={handlePin}
        onDelete={(id) => { setDeleteId(id); setShowDeleteConfirm(true); }}
        onEdit={handleEdit}
        onReminderClick={handleReminderClick}
      />
    </SafeAreaView>
  );
}
