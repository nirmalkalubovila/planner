import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, Pencil, Plus } from 'lucide-react-native';
import { toast, type DailyOutcomeItem, type WeeklyBucketActions, type WeeklyPriorityItem } from '@llb/core';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface WeeklyTargetsBannerProps {
  bucketActions: WeeklyBucketActions;
  currentDayStr?: string;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01' },
  { id: 'p2', num: '02' },
  { id: 'p3', num: '03' },
] as const;

const formatLinkedTitle = (name?: string, maxLen = 26) => {
  if (!name) return '';
  const cleaned = name.replace(/^(Current State|Goal|Habit|Task):\s*/i, '').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned;
};

/** Port of apps/web/src/features/today/components/weekly-targets-banner.tsx.
 * Web's "Open Planner"/"Define in Planner" links navigate to the week
 * planner — not built on mobile yet (the plan's own hardest feature, a
 * redesign not a port), so those show an honest "coming soon" toast here. */
export const WeeklyTargetsBanner: React.FC<WeeklyTargetsBannerProps> = ({ bucketActions, currentDayStr }) => {
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
  const totalWeeklySet = setSlots.length;

  const todayWin: DailyOutcomeItem | undefined = currentDayStr && raw.dailyWins ? raw.dailyWins[currentDayStr] : undefined;
  const hasTodayWin = !!todayWin?.text?.trim();

  const openPlanner = () => toast.info('The week planner is coming soon.');

  return (
    <View className="rounded-xl bg-card/60 border border-border/60 mb-4 overflow-hidden">
      <Pressable onPress={() => setIsExpanded((v) => !v)} className="px-3.5 py-3 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
          <Text variant="tiny" className="uppercase tracking-[0.15em] font-black shrink-0">
            TODAY&apos;S OUTCOME:
          </Text>
          {hasTodayWin && todayWin ? (
            <Text className="text-base font-black text-foreground flex-1" numberOfLines={1}>
              {todayWin.text}
            </Text>
          ) : (
            <Text variant="small" className="italic flex-1" numberOfLines={1}>
              No outcome defined for today
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <View className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
            <Text variant="tiny" className="font-mono font-bold">
              Week: {totalWeeklySet}/3
            </Text>
          </View>
          <Pressable onPress={openPlanner} className="p-1">
            {hasTodayWin ? <Pencil size={13} color="#a1a1aa" /> : <Plus size={14} color="#a1a1aa" />}
          </Pressable>
          <ChevronDown size={14} color="#a1a1aa" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
        </View>
      </Pressable>

      {isExpanded && (
        <View className="px-3.5 py-3 border-t border-white/10 gap-2.5 bg-black/20">
          <Text variant="tiny" className="uppercase tracking-[0.15em] font-black">
            This Week&apos;s Outcomes ({totalWeeklySet}/3)
          </Text>

          {totalWeeklySet > 0 ? (
            <View className="gap-2">
              {setSlots.map((slot) => {
                const action = actions[slot.id];
                return (
                  <Pressable
                    key={slot.id}
                    onPress={openPlanner}
                    className="px-3 py-2 rounded-lg border border-border/70 bg-card/50 gap-1"
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                        <Text variant="tiny" className="font-mono font-bold">
                          {slot.num}
                        </Text>
                      </View>
                      <Text className="text-base font-extrabold text-foreground flex-1" numberOfLines={1}>
                        {action?.text}
                      </Text>
                    </View>
                    {!!action?.linkedItemName && (
                      <Text variant="tiny" className="font-mono pl-0.5" numberOfLines={1}>
                        Linked {action.linkedItemType || 'item'}: {formatLinkedTitle(action.linkedItemName)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Pressable onPress={openPlanner} className="px-3 py-2 rounded-lg border border-dashed border-border/50">
              <Text variant="small" className={cn('text-center italic')}>
                No weekly outcomes defined yet.{' '}
                <Text variant="small" className="text-primary font-bold not-italic">
                  + Define in Planner
                </Text>
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};
