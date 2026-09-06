import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowRight, Check, ChevronDown, Sparkles, Trophy } from 'lucide-react-native';
import {
  BUCKET_META,
  LIFE_BUCKETS,
  WeekUtils,
  getWeekKeyFromDisplay,
  type LifeBucket,
} from '@llb/core';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Text } from '@/components/ui/typography';
import { BUCKET_CLASSES } from '@/theme/bucket-classes';
import { cn } from '@/lib/cn';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';

interface ActionStep {
  title: string;
  desc: string;
}

const BUCKET_BAR_COLOR: Record<LifeBucket, string> = {
  income: '#34d399',
  asset: '#a78bfa',
  recovery: '#38bdf8',
  relational: '#fbbf24',
};

/** Mirrors web's getColor() thresholds, but as literal hex — mobile's
 * CircularProgress takes a color prop, not a stroke class. */
function progressColors(v: number): { hex: string; textClass: string } {
  if (v > 80) return { hex: '#34d399', textClass: 'text-emerald-400' };
  if (v > 50) return { hex: '#f59e0b', textClass: 'text-amber-400' };
  return { hex: '#ef4444', textClass: 'text-destructive' };
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="rounded-3xl bg-card/80 border border-border overflow-hidden">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3.5 active:bg-accent"
      >
        <View className="flex-row items-center gap-3">
          <Text variant="tiny" className="uppercase tracking-widest font-bold">
            {title}
          </Text>
          {count !== undefined && (
            <View className="px-2 py-0.5 rounded-full bg-muted">
              <Text variant="tiny" className="font-bold">
                {count}
              </Text>
            </View>
          )}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={14} color="#a1a1aa" />
        </View>
      </Pressable>

      {open && <View className="px-4 pb-4 gap-3">{children}</View>}
    </View>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-muted/20 p-3 items-center">
      <Text variant="tiny" className="uppercase tracking-wider font-bold text-center">
        {label}
      </Text>
      <Text className="text-base font-black text-foreground mt-1">{value}</Text>
      {!!sub && (
        <Text variant="tiny" className="font-mono text-center mt-0.5">
          {sub}
        </Text>
      )}
    </View>
  );
}

/** Horizontal "week bar" row shared by Weekly Execution and the 8-week
 * bucket trend — same shape web draws with a motion.div width animation. */
function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <View className="flex-row items-center gap-3 py-1">
      <Text variant="tiny" className="font-mono w-24 shrink-0" numberOfLines={1}>
        {label}
      </Text>
      <View className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#f59e0b' }}
        />
      </View>
      <Text className="text-xs font-bold font-mono text-amber-400 w-10 text-right">{pct}%</Text>
    </View>
  );
}

function DetailChip({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-background/50 p-2 rounded-lg border border-border/50">
      <Text variant="tiny" className="uppercase tracking-wider font-bold">
        {label}
      </Text>
      <Text className={cn('text-xs font-bold font-mono mt-0.5', valueClass || 'text-foreground')}>
        {value}
      </Text>
    </View>
  );
}

interface DetailedViewProps {
  data: DetailedAnalytics;
}

/** Port of apps/web/src/features/statistics/components/detailed-view.tsx.
 * All the analysis is already computed by useDetailedAnalytics (shared
 * @llb/core engines); this is presentation only. framer-motion's staggered
 * entrance/width animations are dropped rather than reimplemented — the
 * panels are collapsed by default, so the payoff for animating them on
 * mount is small and the list would stutter on a mid-range phone. */
export const DetailedView: React.FC<DetailedViewProps> = ({ data }) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedItemId((prev) => (prev === id ? null : id));

  const rawGoalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (data.rawGoals || []).forEach((g) => map.set(g.id || '', g));
    return map;
  }, [data.rawGoals]);

  const rawHabitsMap = useMemo(() => {
    const map = new Map<string, any>();
    (data.rawHabits || []).forEach((h) => map.set(h.id || '', h));
    return map;
  }, [data.rawHabits]);

  const actionPlan = useMemo(() => {
    const steps: ActionStep[] = [];

    if (data.bucketStats?.unassignedHours > 0) {
      const namesList =
        data.bucketStats.unassignedTaskNames?.length > 0
          ? data.bucketStats.unassignedTaskNames.join(', ')
          : 'scheduled tasks';
      steps.push({
        title: 'Tag Unassigned Tasks',
        desc: `Unassigned tasks on planner (${data.bucketStats.unassignedHours}h): ${namesList}.`,
      });
    }

    if (data.emptyBucketStreaks) {
      Object.entries(data.emptyBucketStreaks).forEach(([bKey, streak]) => {
        if (streak >= 1) {
          const wBucket = BUCKET_META[bKey as LifeBucket];
          if (wBucket && !steps.some((s) => s.title.includes(wBucket.label))) {
            steps.push({
              title: `Restore ${wBucket.label} Bucket`,
              desc:
                streak >= 2
                  ? `${wBucket.label} has been empty for ${streak} consecutive weeks. Schedule at least one block in your weekly planner.`
                  : `${wBucket.label} has 0 hours allocated this week. Schedule at least one block in your weekly planner for ${wBucket.label.toLowerCase()}.`,
            });
          }
        }
      });
    }

    const weakHabit = data.habits.find((h) => h.consistency < 50);
    if (weakHabit) {
      steps.push({
        title: `Stabilize "${weakHabit.name}" Habit`,
        desc: `Consistency is at ${weakHabit.consistency}%. Set a fixed daily alarm and place it early in your schedule.`,
      });
    }

    const stagnantGoal = data.goals.find((g) => g.progress < 30 && g.totalMilestones === 0);
    if (stagnantGoal) {
      steps.push({
        title: `Break Down "${stagnantGoal.name}"`,
        desc: `Goal progress is at ${stagnantGoal.progress}% with 0 milestones. Add 2-3 target milestones to build velocity.`,
      });
    }

    if (steps.length === 0) {
      steps.push({
        title: 'Maintain Weekly Rhythm',
        desc: 'Your goals, habits, and balance are well aligned. Keep executing your scheduled planner blocks daily.',
      });
    }

    return steps.slice(0, 3);
  }, [data]);

  const overallBucketStats = useMemo(() => {
    const history = data.bucketHistory || [];
    const activeWeeks = history.filter((w) => (w.totalHours || 0) > 0);
    const totalWeeksCount = history.length;
    const activeWeeksCount = activeWeeks.length;

    const avgHoursByBucket: Record<LifeBucket, number> = {
      income: 0,
      asset: 0,
      recovery: 0,
      relational: 0,
    };

    if (activeWeeksCount === 0) {
      return {
        avgHoursByBucket,
        dominantBucket: null as LifeBucket | null,
        dominantBucketHours: 0,
        dominantBucketPct: 0,
        avgWeeklyHours: 0,
        avgWeeklyPct: 0,
        activeWeeksCount: 0,
        totalWeeksCount,
        avgActiveBucketsPerWeek: 0,
      };
    }

    const totalHoursByBucket: Record<LifeBucket, number> = {
      income: 0,
      asset: 0,
      recovery: 0,
      relational: 0,
    };

    let totalAllocatedSum = 0;
    let totalActiveBucketsCount = 0;

    activeWeeks.forEach((w) => {
      totalAllocatedSum += Math.min(168, w.totalHours || 0);
      let weekActiveCount = 0;
      LIFE_BUCKETS.forEach((b) => {
        const h = w.hours?.[b] || 0;
        totalHoursByBucket[b] += h;
        if (h > 0) weekActiveCount++;
      });
      totalActiveBucketsCount += weekActiveCount;
    });

    LIFE_BUCKETS.forEach((b) => {
      avgHoursByBucket[b] = Math.round((totalHoursByBucket[b] / activeWeeksCount) * 10) / 10;
    });

    const avgWeeklyHours = Math.round((totalAllocatedSum / activeWeeksCount) * 10) / 10;
    const avgWeeklyPct = Math.min(100, Math.round((avgWeeklyHours / 168) * 100));

    let maxAvgHours = -1;
    let dominantBucket: LifeBucket | null = null;
    LIFE_BUCKETS.forEach((b) => {
      const avgH = avgHoursByBucket[b];
      if (avgH > maxAvgHours && avgH > 0) {
        maxAvgHours = avgH;
        dominantBucket = b;
      }
    });

    const dominant = dominantBucket as LifeBucket | null;
    const dominantBucketHours = dominant ? avgHoursByBucket[dominant] : 0;
    const dominantBucketPct = dominant
      ? Math.min(100, Math.round((dominantBucketHours / 168) * 100))
      : 0;

    return {
      avgHoursByBucket,
      dominantBucket: dominant,
      dominantBucketHours,
      dominantBucketPct,
      avgWeeklyHours,
      avgWeeklyPct,
      activeWeeksCount,
      totalWeeksCount,
      avgActiveBucketsPerWeek: Math.round((totalActiveBucketsCount / activeWeeksCount) * 10) / 10,
    };
  }, [data.bucketHistory]);

  const sortedWeeks = useMemo(
    () =>
      [...data.weeks].sort((a, b) =>
        WeekUtils.compareWeeks(getWeekKeyFromDisplay(b.weekKey), getWeekKeyFromDisplay(a.weekKey))
      ),
    [data.weeks]
  );

  return (
    <View className="gap-4">
      <View className="rounded-3xl bg-card/80 border border-border p-4 gap-3">
        <View className="border-b border-border pb-3">
          <Text className="text-xs uppercase tracking-widest font-black text-foreground">
            Actionable Execution Feedback
          </Text>
        </View>

        {actionPlan.map((step, idx) => (
          <View key={idx} className="p-3.5 rounded-2xl bg-muted/30 border border-border gap-2">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-lg bg-muted border border-border items-center justify-center">
                <ArrowRight size={12} color="#e4e4e7" />
              </View>
              <Text className="text-xs font-black uppercase tracking-wider text-foreground flex-1" numberOfLines={1}>
                {step.title}
              </Text>
            </View>
            <Text variant="tiny" className="leading-relaxed">
              {step.desc}
            </Text>
          </View>
        ))}
      </View>

      <Panel title="Habits" count={data.habits.length}>
        {data.habits.length === 0 ? (
          <Text variant="muted" className="py-4">
            No habits created yet.
          </Text>
        ) : (
          data.habits.map((habit) => {
            const raw = rawHabitsMap.get(habit.id);
            const bucket: LifeBucket | undefined = raw?.bucket;
            const bucketMeta = bucket ? BUCKET_META[bucket] : null;
            const bucketClasses = bucket ? BUCKET_CLASSES[bucket] : null;
            const c = progressColors(habit.consistency);
            const isExpanded = expandedItemId === habit.id;

            return (
              <View key={habit.id} className="rounded-2xl border border-border bg-muted/10 overflow-hidden">
                <Pressable
                  onPress={() => toggleExpand(habit.id)}
                  className="flex-row items-center gap-3 p-3 active:bg-accent/40"
                >
                  <CircularProgress value={habit.consistency} size={48} strokeWidth={4} color={c.hex} />
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-sm font-medium text-foreground shrink" numberOfLines={1}>
                        {habit.name}
                      </Text>
                      {bucketMeta && bucketClasses && (
                        <View className={cn('px-1.5 py-0.5 rounded border', bucketClasses.badgeClass)}>
                          <Text variant="tiny" className={cn('font-black uppercase tracking-widest', bucketClasses.color)}>
                            {bucketMeta.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-3 mt-1">
                      <Text variant="tiny">Streak: {habit.longestStreak}d</Text>
                      <Text variant="tiny">
                        {habit.activeDays}/{habit.totalExpectedDays} days
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className={cn('text-sm font-bold', c.textClass)}>{habit.consistency}%</Text>
                    <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={14} color="#a1a1aa" />
                    </View>
                  </View>
                </Pressable>

                {isExpanded && (
                  <View className="px-3 pb-3 pt-2 border-t border-border/50 bg-muted/20 gap-2">
                    {!!raw?.purpose && (
                      <Text variant="tiny" className="italic">
                        &quot;{raw.purpose}&quot;
                      </Text>
                    )}
                    <View className="flex-row flex-wrap gap-2">
                      <DetailChip
                        label="Time Window"
                        value={`${raw?.startTime || '06:00'} - ${raw?.endTime || '07:00'}`}
                      />
                      <DetailChip
                        label="Target Days"
                        value={`${(raw?.daysOfWeek || []).length || 7} days/week`}
                      />
                      <DetailChip
                        label="Life Bucket"
                        value={bucketMeta ? bucketMeta.label : 'Unassigned'}
                        valueClass={bucketClasses ? bucketClasses.color : 'text-muted-foreground'}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Panel>

      <Panel title="Goals" count={data.goals.length}>
        {data.goals.length === 0 ? (
          <Text variant="muted" className="py-4">
            No goals created yet.
          </Text>
        ) : (
          data.goals.map((goal) => {
            const raw = rawGoalsMap.get(goal.id);
            const bucket: LifeBucket | undefined = raw?.bucket;
            const bucketMeta = bucket ? BUCKET_META[bucket] : null;
            const bucketClasses = bucket ? BUCKET_CLASSES[bucket] : null;
            const isCompleted = goal.progress >= 100;
            const isExpanded = expandedItemId === goal.id;

            const completedTone =
              goal.goalType === 'Week'
                ? { text: 'text-emerald-400', hex: '#34d399', label: '100% Met', Icon: Check }
                : goal.goalType === 'Month'
                  ? { text: 'text-violet-400', hex: '#a78bfa', label: '100% Achieved', Icon: Sparkles }
                  : { text: 'text-yellow-400', hex: '#facc15', label: '100% Built', Icon: Trophy };

            return (
              <View
                key={goal.id}
                className={cn(
                  'rounded-2xl border overflow-hidden',
                  isCompleted ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-border bg-muted/10'
                )}
              >
                <Pressable
                  onPress={() => toggleExpand(goal.id)}
                  className="flex-row items-center gap-3 p-3 active:bg-accent/40"
                >
                  {isCompleted ? (
                    <View
                      className="w-12 h-12 rounded-full border items-center justify-center"
                      style={{ borderColor: `${completedTone.hex}55`, backgroundColor: `${completedTone.hex}1a` }}
                    >
                      <completedTone.Icon size={16} color={completedTone.hex} />
                    </View>
                  ) : (
                    <CircularProgress value={goal.progress} size={48} strokeWidth={4} color="#34d399" />
                  )}

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text
                        className={cn('text-sm font-medium shrink', isCompleted ? completedTone.text : 'text-foreground')}
                        numberOfLines={1}
                      >
                        {goal.name}
                      </Text>
                      {bucketMeta && bucketClasses && (
                        <View className={cn('px-1.5 py-0.5 rounded border', bucketClasses.badgeClass)}>
                          <Text variant="tiny" className={cn('font-black uppercase tracking-widest', bucketClasses.color)}>
                            {bucketMeta.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-3 mt-1 flex-wrap">
                      <Text variant="tiny">
                        Milestones: {goal.completedMilestones}/{goal.totalMilestones}
                      </Text>
                      <Text variant="tiny">Velocity: {goal.velocityMultiplier}x</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text className={cn('text-sm font-bold', isCompleted ? completedTone.text : 'text-emerald-400')}>
                      {isCompleted ? completedTone.label : `${goal.progress}%`}
                    </Text>
                    <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={14} color="#a1a1aa" />
                    </View>
                  </View>
                </Pressable>

                {isExpanded && (
                  <View className="px-3 pb-3 pt-2 border-t border-border/50 bg-muted/20 gap-2">
                    {!!raw?.purpose && (
                      <View className="bg-background/40 p-2.5 rounded-xl border border-border/50">
                        <Text variant="tiny" className="uppercase tracking-wider font-bold mb-0.5">
                          Purpose / Constraints
                        </Text>
                        <Text variant="small" className="text-foreground/80 leading-relaxed">
                          {raw.purpose}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row flex-wrap gap-2">
                      <DetailChip label="Goal Type" value={goal.goalType || '-'} />
                      <DetailChip label="Target" value={goal.projectedCompletion || '-'} />
                      <DetailChip label="Start Date" value={raw?.startDate || '-'} />
                      <DetailChip label="End Date" value={raw?.endDate || '-'} />
                      <DetailChip
                        label="Bucket"
                        value={bucketMeta ? bucketMeta.label : 'Unassigned'}
                        valueClass={bucketClasses ? bucketClasses.color : 'text-muted-foreground'}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Panel>

      <Panel title="Weekly Execution" count={data.weeks.length}>
        {data.weeks.length === 0 ? (
          <Text variant="muted" className="py-4">
            No weekly plans recorded yet.
          </Text>
        ) : (
          <>
            <View className="flex-row gap-2">
              <StatBox
                label="Best Week"
                value={data.bestWeek ? `${data.bestWeek.efficiency}%` : '—'}
                sub={data.bestWeek?.weekKey}
              />
              <StatBox label="All-Time Avg" value={`${data.weekAverage}%`} />
              <StatBox label="Weeks Tracked" value={`${data.weeks.length}`} />
            </View>

            <View className="gap-0.5 mt-1">
              {sortedWeeks.map((w) => (
                <BarRow key={w.weekKey} label={w.weekKey} pct={Math.min(w.efficiency, 100)} />
              ))}
            </View>
          </>
        )}
      </Panel>

      <Panel title="Life Buckets Deep Analysis" count={overallBucketStats.totalWeeksCount || 8}>
        <View className="flex-row gap-2">
          <StatBox
            label="Overall Focus"
            value={
              overallBucketStats.dominantBucket
                ? BUCKET_META[overallBucketStats.dominantBucket].label
                : '—'
            }
            sub={
              overallBucketStats.dominantBucket
                ? `Avg ${overallBucketStats.dominantBucketHours}h/wk`
                : undefined
            }
          />
          <StatBox
            label="All-Time Avg"
            value={`${overallBucketStats.avgWeeklyPct}%`}
            sub={`${overallBucketStats.avgWeeklyHours}h / 168h`}
          />
          <StatBox
            label="Weeks Tracked"
            value={`${overallBucketStats.totalWeeksCount}`}
            sub={`${overallBucketStats.avgActiveBucketsPerWeek} of 4 active`}
          />
        </View>

        <View className="flex-row flex-wrap gap-2.5 mt-1">
          {LIFE_BUCKETS.map((bucketKey) => {
            const meta = BUCKET_META[bucketKey];
            const classes = BUCKET_CLASSES[bucketKey];
            const avgHours = overallBucketStats.avgHoursByBucket[bucketKey] || 0;
            const avgPct = Math.min(100, Math.round((avgHours / 168) * 100));

            return (
              <View
                key={bucketKey}
                className="flex-1 min-w-[45%] p-3 rounded-2xl border border-border bg-muted/20 gap-2"
              >
                <Text variant="tiny" className={cn('font-bold uppercase tracking-wider', classes.color)}>
                  {meta.label}
                </Text>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-xl font-black text-foreground font-mono">{avgHours}h</Text>
                  <Text variant="tiny" className="font-mono">
                    Avg {avgPct}%
                  </Text>
                </View>
                <View className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(avgHours > 0 ? 8 : 0, avgPct))}%`,
                      backgroundColor: BUCKET_BAR_COLOR[bucketKey],
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {data.bucketHistory && data.bucketHistory.length > 0 && (
          <View className="gap-2 pt-3 mt-1 border-t border-border/50">
            <Text variant="tiny" className="uppercase tracking-wider font-bold">
              8-Week Bucket Allocation Trend
            </Text>
            <View className="gap-0.5">
              {[...data.bucketHistory].reverse().map((historyItem) => {
                const totalHours = Math.min(168, historyItem.totalHours || 0);
                return (
                  <BarRow
                    key={historyItem.week}
                    label={historyItem.week}
                    pct={Math.min(100, Math.round((totalHours / 168) * 100))}
                  />
                );
              })}
            </View>
          </View>
        )}
      </Panel>
    </View>
  );
};
