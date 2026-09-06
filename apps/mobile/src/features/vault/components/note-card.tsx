import React from 'react';
import { Pressable, View } from 'react-native';
import { BookOpen, Edit2, Pin, Trash2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { CATEGORY_META, type VaultNote } from '@llb/core';
import type { VaultReminder } from '@llb/api';
import { CATEGORY_CLASSES } from '@/theme/category-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { QuoteCard } from './quote-card';
import { ReminderButton } from './reminder-button';

interface NoteCardProps {
  note: VaultNote;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick: (note: VaultNote) => void;
  onClick: (note: VaultNote) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
  onClick,
}) => {
  if (note.category === 'quotes') {
    return (
      <QuoteCard
        note={note}
        reminder={reminder}
        onPin={onPin}
        onDelete={onDelete}
        onEdit={onEdit}
        onReminderClick={onReminderClick}
        onClick={onClick}
      />
    );
  }

  const date = new Date(note.createdAt);
  const meta = CATEGORY_META[note.category] || CATEGORY_META.ideas;
  const classes = CATEGORY_CLASSES[note.category] || CATEGORY_CLASSES.ideas;

  return (
    <Pressable
      onPress={() => onClick(note)}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <View className={cn('h-1 w-full', classes.bgClass.split(' ')[0].replace('/10', '/40'))} />

      <View className="p-4 gap-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-row items-start gap-1.5 flex-1 min-w-0">
            {note.is_pinned && <Pin size={12} color="#fbbf24" fill="#fbbf24" style={{ marginTop: 3 }} />}
            <Text className="font-bold text-[15px] text-foreground flex-1" numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
          </View>
          <View className={cn('px-1.5 py-0.5 rounded border', classes.bgClass)}>
            <Text variant="tiny" className={cn('uppercase font-black', classes.color)}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text className="text-sm text-foreground/80" numberOfLines={4}>
          {note.content}
        </Text>

        {!!note.source_page && (
          <View className="flex-row items-center gap-1">
            <BookOpen size={10} color="#a1a1aa" />
            <Text variant="tiny" numberOfLines={1}>
              {note.source_page}
            </Text>
          </View>
        )}

        <Text variant="tiny">{formatDistanceToNow(date, { addSuffix: true })}</Text>
      </View>

      <View className="flex-row items-center justify-between px-3 py-1.5 border-t border-border/50 bg-muted/5">
        <View className="flex-row gap-0.5">
          <Pressable onPress={() => onEdit(note)} className="h-7 w-7 items-center justify-center rounded-lg">
            <Edit2 size={13} color="#a1a1aa" />
          </Pressable>
          <Pressable onPress={() => onPin(note.id, !note.is_pinned)} className="h-7 w-7 items-center justify-center rounded-lg">
            <Pin size={13} color={note.is_pinned ? '#fbbf24' : '#a1a1aa'} fill={note.is_pinned ? '#fbbf24' : 'none'} />
          </Pressable>
          <Pressable onPress={() => onDelete(note.id)} className="h-7 w-7 items-center justify-center rounded-lg">
            <Trash2 size={13} color="#a1a1aa" />
          </Pressable>
        </View>
        <ReminderButton reminder={reminder} onPress={() => onReminderClick(note)} />
      </View>
    </Pressable>
  );
};
