import React from 'react';
import { Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import type { VaultReminder } from '@llb/api';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

/** Shows existing reminder state (read-only — reminders are already
 * fetched via useReminders() elsewhere). Tapping to CREATE/edit a reminder
 * is deferred: apps/web's reminder-form.tsx is its own sub-feature with its
 * own dialog, not yet ported. Surfacing "coming soon" here keeps that
 * honest instead of silently doing nothing. */
export function ReminderButton({
  reminder,
  onPress,
}: {
  reminder?: VaultReminder | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-7 px-2 rounded-lg flex-row items-center gap-1',
        reminder ? 'bg-primary/5' : ''
      )}
    >
      <Bell size={11} color={reminder ? '#e4e4e7' : '#a1a1aa'} fill={reminder ? '#e4e4e7' : 'none'} />
      <Text variant="tiny" className={cn('font-bold uppercase', reminder && 'text-primary')}>
        {reminder ? 'Reminded' : 'Remind'}
      </Text>
    </Pressable>
  );
}
