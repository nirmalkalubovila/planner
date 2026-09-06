import React from 'react';
import { Pressable, View } from 'react-native';
import { Target, Link2 } from 'lucide-react-native';
import { WeeklyBucketActions, WeeklyPriorityItem } from '@llb/core';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface BucketTargetsBarProps {
  bucketActions: WeeklyBucketActions;
  onOpenDialog: () => void;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01', label: 'Outcome 01' },
  { id: 'p2', num: '02', label: 'Outcome 02' },
  { id: 'p3', num: '03', label: 'Outcome 03' },
] as const;

/** RN port of apps/web/.../planner/components/bucket-targets-bar.tsx —
 * stacked full-width cards instead of web's 3-col grid (no room for 3
 * columns on a phone). */
export const BucketTargetsBar: React.FC<BucketTargetsBarProps> = ({ bucketActions, onOpenDialog }) => {
  const actions: Record<string, WeeklyPriorityItem> = React.useMemo(() => {
    const raw = (bucketActions || {}) as any;
    if (raw.p1 || raw.p2 || raw.p3) return raw;
    const migrated: Record<string, WeeklyPriorityItem> = {};
    const entries = Object.entries(raw).filter(([_, v]: any) => !!v?.text?.trim());
    if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
    if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
    if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
    return migrated;
  }, [bucketActions]);

  const totalSet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;

  return (
    <Pressable onPress={onOpenDialog} className="rounded-2xl bg-card/80 border border-border/60 p-3 gap-2.5 mx-4 mt-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Target size={14} color="#e4e4e7" />
          <Text className="text-xs uppercase tracking-widest font-bold text-foreground">THIS WEEK</Text>
          <View className={cn('px-2 py-0.5 rounded-full border', totalSet > 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border')}>
            <Text variant="tiny" className={cn('font-bold font-mono', totalSet > 0 && 'text-primary')}>
              {totalSet}/3 Set
            </Text>
          </View>
        </View>
        <Text variant="tiny" className="text-primary font-bold">
          {totalSet === 0 ? 'Define →' : 'Edit →'}
        </Text>
      </View>

      <View className="gap-2">
        {OUTCOME_SLOTS.map(slot => {
          const action = actions[slot.id];
          const hasText = !!action?.text?.trim();
          return (
            <View
              key={slot.id}
              className={cn('p-2.5 rounded-xl border gap-1', hasText ? 'border-border/80 bg-card/40' : 'border-border/40 bg-muted/10')}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Text variant="tiny" className="font-mono font-bold px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-foreground">
                    {slot.num}
                  </Text>
                  <Text variant="tiny" className="uppercase tracking-wider text-foreground font-bold">
                    {slot.label}
                  </Text>
                </View>
                {!!action?.linkedItemName && <Link2 size={11} color="#e4e4e7" />}
              </View>
              <Text
                numberOfLines={1}
                className={cn('text-[11px] font-semibold', hasText ? 'text-foreground' : 'text-muted-foreground italic opacity-60')}
              >
                {hasText && action?.text ? action.text : 'No outcome set'}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};
