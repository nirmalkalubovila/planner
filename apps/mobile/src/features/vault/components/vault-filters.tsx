import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Bell } from 'lucide-react-native';
import { CATEGORY_META, type VaultCategory } from '@llb/core';
import { CATEGORY_CLASSES } from '@/theme/category-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface VaultFiltersProps {
  tags: { tag: string; count: number }[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const VaultFilters: React.FC<VaultFiltersProps> = ({ tags, activeTag, onSelectTag }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row items-center gap-2 px-4">
      <Pressable
        onPress={() => onSelectTag(null)}
        className={cn(
          'px-4 py-2 rounded-full border',
          !activeTag ? 'bg-accent border-border' : 'bg-muted/50 border-transparent'
        )}
      >
        <Text className={cn('text-sm font-medium', !activeTag ? 'text-primary' : 'text-muted-foreground')}>All</Text>
      </Pressable>
      {tags.map(({ tag, count }) => {
        const meta = CATEGORY_META[tag as VaultCategory];
        const classes = CATEGORY_CLASSES[tag as VaultCategory];
        if (!meta) return null;
        const isActive = activeTag === tag;
        return (
          <Pressable
            key={tag}
            onPress={() => onSelectTag(tag)}
            className={cn('px-2.5 py-1.5 rounded-lg border', isActive ? classes.bgClass : 'bg-muted/50 border-transparent')}
          >
            <Text variant="small" className={isActive ? classes.color : undefined}>
              {meta.label} ({count})
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => onSelectTag('reminders')}
        className={cn(
          'px-2.5 py-1.5 rounded-lg border flex-row items-center gap-1.5',
          activeTag === 'reminders' ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-transparent'
        )}
      >
        <Bell size={11} color={activeTag === 'reminders' ? '#e4e4e7' : '#a1a1aa'} fill={activeTag === 'reminders' ? '#e4e4e7' : 'none'} />
        <Text variant="small" className={activeTag === 'reminders' ? 'text-primary' : undefined}>
          With Reminders
        </Text>
      </Pressable>
    </ScrollView>
  );
};
