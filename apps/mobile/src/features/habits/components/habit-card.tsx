import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Calendar as CalendarIcon, Clock, Edit2, Trash2 } from 'lucide-react-native';
import { BUCKET_META, type Habit } from '@llb/core';
import { BUCKET_CLASSES } from '@/theme/bucket-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete }) => {
  const activeDays = new Set((habit.daysOfWeek || []).map((d) => DAY_MAP[d] || d.substring(0, 3)));
  const frequency = activeDays.size;
  const isEveryday = frequency === 7;

  return (
    <View className="rounded-2xl border border-border bg-card overflow-hidden flex-row">
      <View className="w-1 bg-primary" style={{ opacity: Math.max(0.4, frequency / 7) }} />
      <View className="flex-1 p-4 gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-wrap items-center gap-1.5 flex-1 pr-2">
            <Text className="font-bold text-[15px] text-foreground" numberOfLines={1}>
              {habit.name}
            </Text>
            {isEveryday && (
              <View className="bg-primary/15 border border-primary/20 px-1.5 py-0.5 rounded">
                <Text variant="tiny" className="text-primary uppercase font-black">
                  Daily
                </Text>
              </View>
            )}
            {habit.bucket && BUCKET_META[habit.bucket] && (
              <View className={cn('px-1.5 py-0.5 rounded border', BUCKET_CLASSES[habit.bucket].badgeClass)}>
                <Text variant="tiny" className={cn('uppercase font-black', BUCKET_CLASSES[habit.bucket].color)}>
                  {BUCKET_META[habit.bucket].label}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row gap-1">
            <Pressable onPress={() => onEdit(habit)} className="h-7 w-7 items-center justify-center rounded-lg">
              <Edit2 size={13} color="#a1a1aa" />
            </Pressable>
            <Pressable
              onPress={() => habit.id && onDelete(habit.id)}
              className="h-7 w-7 items-center justify-center rounded-lg"
            >
              <Trash2 size={13} color="#a1a1aa" />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-1.5 self-start">
          <Clock size={13} color="#a1a1aa" />
          <Text className="text-sm font-bold text-foreground font-mono">{habit.startTime}</Text>
          <Text variant="small">→</Text>
          <Text className="text-sm font-bold text-foreground font-mono">{habit.endTime}</Text>
        </View>

        <View className="flex-row items-center gap-1">
          {ALL_DAYS.map((day) => {
            const active = activeDays.has(day);
            return (
              <View key={day} className="items-center gap-1">
                <View className={cn('w-[22px] h-[6px] rounded-full', active ? 'bg-primary' : 'bg-muted')} />
                <Text variant="tiny" className={cn('font-bold uppercase', active && 'text-foreground')}>
                  {day.charAt(0)}
                </Text>
              </View>
            );
          })}
          <Text variant="tiny" className="text-foreground ml-1.5 font-black uppercase">
            {frequency}/7
          </Text>
        </View>

        {!!habit.purpose && (
          <Text className="text-[11px] text-foreground/80 italic" numberOfLines={2}>
            &quot;{habit.purpose}&quot;
          </Text>
        )}

        {!!(habit.startDate && habit.endDate) && (
          <View className="flex-row items-center gap-1.5">
            <CalendarIcon size={10} color="#a1a1aa" />
            <Text variant="tiny">{habit.startDate}</Text>
            <Text variant="tiny">→</Text>
            <Text variant="tiny">{habit.endDate}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
