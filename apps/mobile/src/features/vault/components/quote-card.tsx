import React from 'react';
import { Pressable, View } from 'react-native';
import { Edit2, Pin, Trash2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { CATEGORY_META, type VaultNote } from '@llb/core';
import type { VaultReminder } from '@llb/api';
import { CATEGORY_CLASSES } from '@/theme/category-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { ReminderButton } from './reminder-button';

interface QuoteCardProps {
  note: VaultNote;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick: (note: VaultNote) => void;
  onClick: (note: VaultNote) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
  onClick,
}) => {
  const date = new Date(note.createdAt);
  const meta = CATEGORY_META.quotes;
  const classes = CATEGORY_CLASSES.quotes;

  return (
    <Pressable onPress={() => onClick(note)} className="rounded-2xl border border-border bg-card overflow-hidden">
      <View className="h-1 w-full bg-emerald-500/20" />
      <View className="p-5 gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            {note.is_pinned && <Pin size={12} color="#fbbf24" fill="#fbbf24" />}
            <View className={cn('px-1.5 py-0.5 rounded border', classes.bgClass)}>
              <Text variant="tiny" className={cn('uppercase font-black', classes.color)}>
                {meta.label}
              </Text>
            </View>
          </View>
          {!!reminder && (
            <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10">
              <Text variant="tiny" className="text-emerald-400 font-medium">
                Active
              </Text>
            </View>
          )}
        </View>

        <View className="gap-3">
          <Text className="text-[16px] text-foreground/90 italic">&quot;{note.content}&quot;</Text>
          {!!note.source_page && (
            <Text className="text-right text-xs font-semibold text-muted-foreground">— {note.source_page}</Text>
          )}
        </View>

        <View className="gap-1">
          {!!note.title && <Text className="text-xs font-bold text-foreground/75">{note.title}</Text>}
          <Text variant="tiny">{formatDistanceToNow(date, { addSuffix: true })}</Text>
        </View>
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
