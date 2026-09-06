import React from 'react';
import { View } from 'react-native';
import { format } from 'date-fns';
import { Edit2, Pin, Quote, Trash2 } from 'lucide-react-native';
import { CATEGORY_META, type VaultNote } from '@llb/core';
import type { VaultReminder } from '@llb/api';
import { CATEGORY_CLASSES } from '@/theme/category-classes';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { ReminderButton } from './reminder-button';

interface NoteViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: VaultNote | null;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick: (note: VaultNote) => void;
}

/** Port of apps/web/src/features/vault/components/note-view-dialog.tsx —
 * built on the shared StandardDialog rather than its own portal/AnimatePresence
 * setup, since RN has no DOM to portal into. Copy-to-clipboard is dropped
 * for now: it needs expo-clipboard, a native module not yet in this build
 * (would mean another EAS rebuild for a minor convenience). */
export const NoteViewDialog: React.FC<NoteViewDialogProps> = ({
  isOpen,
  onClose,
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
}) => {
  if (!note) return null;

  const date = new Date(note.createdAt);
  const meta = CATEGORY_META[note.category] || CATEGORY_META.ideas;
  const classes = CATEGORY_CLASSES[note.category] || CATEGORY_CLASSES.ideas;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={note.title || 'Untitled'}
      subtitle={`Created ${format(date, 'PPP p')}`}
      icon={note.category === 'quotes' ? Quote : undefined}
      iconClassName={classes.bgClass}
      footer={
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-1">
            <Button variant="ghost" size="icon" onPress={() => { onClose(); onEdit(note); }}>
              <Edit2 size={16} color="#e4e4e7" />
            </Button>
            <Button variant="ghost" size="icon" onPress={() => onPin(note.id, !note.is_pinned)}>
              <Pin size={16} color={note.is_pinned ? '#fbbf24' : '#e4e4e7'} fill={note.is_pinned ? '#fbbf24' : 'none'} />
            </Button>
            <Button variant="ghost" size="icon" onPress={() => { onClose(); onDelete(note.id); }}>
              <Trash2 size={16} color="#e4e4e7" />
            </Button>
          </View>
          <ReminderButton reminder={reminder} onPress={() => onReminderClick(note)} />
        </View>
      }
    >
      <View className="p-5 gap-4">
        <View className={cn('self-start px-2.5 py-0.5 rounded-full border', classes.bgClass)}>
          <Text variant="tiny" className={cn('uppercase font-black', classes.color)}>
            {meta.label}
          </Text>
        </View>

        {note.category === 'quotes' ? (
          <View className="gap-4 py-2">
            <Text className="text-xl text-foreground italic leading-relaxed">&quot;{note.content}&quot;</Text>
            {!!note.source_page && (
              <Text className="text-right text-sm font-semibold text-muted-foreground">— {note.source_page}</Text>
            )}
          </View>
        ) : (
          <View className="gap-4">
            <Text className="text-foreground/90 leading-relaxed text-base">{note.content}</Text>
            {!!note.source_page && (
              <View className="p-3 rounded-xl border border-border/45 bg-muted/20">
                <Text variant="muted">
                  <Text className="font-bold text-foreground">Source Reference: </Text>
                  {note.source_page}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </StandardDialog>
  );
};
