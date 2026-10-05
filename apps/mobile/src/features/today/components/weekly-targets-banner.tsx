import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { toast, type WeeklyBucketActions, type WeeklyPriorityItem } from '@llb/core';
import { Text } from '@/components/ui/typography';

interface WeeklyTargetsBannerProps {
  bucketActions: WeeklyBucketActions;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01' },
  { id: 'p2', num: '02' },
  { id: 'p3', num: '03' },
] as const;

const formatLinkedTitle = (name?: string) =>
  name ? name.replace(/^(Current State|Goal|Habit|Task):\s*/i, '').trim() : '';

/** Port of apps/web/src/features/today/components/weekly-targets-banner.tsx.
 * Web's "Edit"/"Set Outcomes" links navigate to the week planner — not built
 * on mobile yet (the plan's own hardest feature, a redesign not a port), so
 * those show an honest "coming soon" toast here. */
export const WeeklyTargetsBanner: React.FC<WeeklyTargetsBannerProps> = ({ bucketActions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // `(bucketActions || {})` built a fresh object on every render when
  // bucketActions was nullish, so the useMemo below re-ran every time.
  // Memoizing it too gives the migration a stable input to key off.
  const raw = useMemo(() => (bucketActions || {}) as any, [bucketActions]);
  const actions: Record<string, WeeklyPriorityItem> = useMemo(() => {
    if (raw.p1 || raw.p2 || raw.p3) return raw;
    const migrated: Record<string, WeeklyPriorityItem> = {};
    const entries = Object.entries(raw).filter(([k, v]: any) => k !== 'dailyWins' && !!v?.text?.trim());
    if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
    if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
    if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
    return migrated;
  }, [raw]);

  const setSlots = OUTCOME_SLOTS.filter((s) => !!actions[s.id]?.text?.trim());

  const openPlanner = () => toast.info('The week planner is coming soon.');

  return (
    <View className="rounded-xl bg-card/60 border border-border/60 mb-4 overflow-hidden">
      <Pressable
        onPress={() => setIsExpanded((v) => !v)}
        accessibilityState={{ expanded: isExpanded }}
        className="px-3.5 py-3 flex-row items-center justify-between gap-3"
      >
        <View className="flex-row items-center gap-2.5">
          <Text variant="tiny" className="uppercase tracking-[0.15em] font-black">
            This Week&apos;s Priorities
          </Text>
          <Text variant="tiny" className="font-mono font-bold text-foreground">
            {setSlots.length}/3
          </Text>
        </View>
        <Text variant="tiny" className="text-primary font-bold">
          {isExpanded ? 'Hide' : 'Show'}
        </Text>
      </Pressable>

      {isExpanded && (
        <View className="px-3.5 py-3 border-t border-white/10 gap-2 bg-black/20">
          {setSlots.length > 0 ? (
            <>
              {setSlots.map((slot) => {
                const action = actions[slot.id];
                return (
                  <View key={slot.id} className="px-3 py-2.5 rounded-lg border border-border/70 bg-card/50 gap-1">
                    <View className="flex-row items-start gap-2.5">
                      <Text variant="tiny" className="font-mono font-bold text-primary pt-1">
                        {slot.num}
                      </Text>
                      <Text className="text-sm font-bold text-foreground flex-1">{action?.text}</Text>
                    </View>
                    {!!action?.linkedItemName && (
                      <Text variant="tiny" className="font-mono pl-[26px]">
                        {action.linkedItemType || 'item'}: {formatLinkedTitle(action.linkedItemName)}
                      </Text>
                    )}
                  </View>
                );
              })}
              <Pressable onPress={openPlanner} hitSlop={8} className="self-end pt-1">
                <Text variant="tiny" className="text-primary font-bold">
                  Edit
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center justify-between gap-3">
              <Text variant="small" className="flex-1">
                Choose up to three outcomes that define this week.
              </Text>
              <Pressable onPress={openPlanner} hitSlop={8}>
                <Text variant="tiny" className="text-primary font-bold">
                  Set Outcomes
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
