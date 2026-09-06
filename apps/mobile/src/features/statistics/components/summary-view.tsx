import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Briefcase, Calendar, HeartHandshake, Moon, TrendingUp } from 'lucide-react-native';
import { BUCKET_META, LIFE_BUCKETS, WeekUtils, type LifeBucket } from '@llb/core';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';
import type { UserStatsCache } from '../hooks/use-user-stats';
import { useShareMilestone } from '../hooks/use-share-milestone';
import { MilestoneShareCard } from './milestones/milestone-share-card';
import { MilestonesShowcase } from './milestones/milestones-showcase';

const BUCKET_VESSEL_CONFIG: Record<LifeBucket, { icon: React.ComponentType<{ size?: number; color?: string }>; hex: string; textClass: string }> = {
  income: { icon: Briefcase, hex: '#10b981', textClass: 'text-emerald-400' },
  asset: { icon: TrendingUp, hex: '#8b5cf6', textClass: 'text-violet-400' },
  recovery: { icon: Moon, hex: '#0ea5e9', textClass: 'text-sky-400' },
  relational: { icon: HeartHandshake, hex: '#f59e0b', textClass: 'text-amber-400' },
};

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('rounded-3xl p-4 bg-card/80 border border-border', className)}>{children}</View>;
}

function Label({ text }: { text: string }) {
  return (
    <Text variant="tiny" className="uppercase tracking-widest font-bold mb-3">
      {text}
    </Text>
  );
}

function truncateText(text: string, maxLength = 70) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function getHeatmapColor(count: number) {
  if (count === 0) return '#27272a';
  if (count === 1) return 'rgba(99,102,241,0.2)';
  if (count === 2) return 'rgba(99,102,241,0.4)';
  if (count === 3) return 'rgba(99,102,241,0.6)';
  return 'rgba(99,102,241,0.9)';
}

interface SummaryViewProps {
  cache: UserStatsCache;
  detailed: DetailedAnalytics | undefined;
  onSwitchToInsights: () => void;
}

/** Port of apps/web/src/features/statistics/components/summary-view.tsx.
 * "Share Milestone" renders <MilestoneShareCard/> off-screen and captures
 * it with react-native-view-shot instead of hand-translating web's ~500
 * lines of Canvas 2D calls — see milestone-share-card.tsx. */
export const SummaryView: React.FC<SummaryViewProps> = ({ cache, detailed }) => {
  const trajectory = detailed?.trajectory;
  const milestoneProgress = detailed?.milestoneProgress;
  const { cardRef, target, shareMilestone, captureAndShare } = useShareMilestone();

  useEffect(() => {
    if (target) {
      // Let the off-screen card lay out for a frame before capturing it.
      const t = setTimeout(captureAndShare, 50);
      return () => clearTimeout(t);
    }
  }, [target, captureAndShare]);

  const currentWeek = WeekUtils.getCurrentWeek();
  const currentWeekExecution = detailed?.weeks?.find((w) => w.weekKey === currentWeek);
  const currentEff = currentWeekExecution ? currentWeekExecution.efficiency : (detailed?.weekAverage ?? 100);

  let rankPct = 60;
  if (currentEff >= 80) rankPct = 2;
  else if (currentEff >= 65) rankPct = 7;
  else if (currentEff >= 50) rankPct = 14;
  else if (currentEff >= 30) rankPct = 32;

  const balanceAvg = detailed?.bucketBalanceScores
    ? Math.round((Object.values(detailed.bucketBalanceScores).reduce((a, b) => a + b, 0) / 4) * 10)
    : 50;

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Consistency Grade" />
          <Text className="text-5xl font-black text-foreground">{cache.consistency_grade}</Text>
          <View className="items-center gap-0.5 mt-3">
            <Text variant="tiny" className="uppercase font-black">
              Based on 30-Day Activity
            </Text>
            {!!milestoneProgress && (
              <Text variant="tiny" className="font-bold mt-0.5">
                {milestoneProgress.totalDaysExecuted} Total Days • {milestoneProgress.currentStreak}d Streak
              </Text>
            )}
          </View>
        </Card>

        <Card className="flex-1 min-w-[90%] items-center py-6">
          <Label text="Your Legacy Life Score" />
          <CircularProgress value={trajectory?.total ?? 0} size={130} strokeWidth={10} color="#34d399" />
          {!!trajectory && (
            <View className="flex-row flex-wrap items-center justify-center gap-3 mt-4">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text variant="small">Goals {trajectory.goalScore}%</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <Text variant="small">Habits {trajectory.habitScore}%</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
                <Text variant="small">Execution {trajectory.executionScore}%</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-violet-400" />
                <Text variant="small">Balance {trajectory.balanceScore}%</Text>
              </View>
            </View>
          )}
        </Card>

        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Global Rank" />
          <Text className="text-4xl font-black text-primary">Top {rankPct}%</Text>
          <Text variant="tiny" className="text-center mt-3">
            You ranked in the <Text variant="tiny" className="text-primary font-bold">top {rankPct}%</Text> of all Legacy builders this week!
          </Text>
        </Card>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Goal Progress" />
          <CircularProgress
            value={detailed?.bestGoal?.progress ?? cache.top_goal.progress}
            size={90}
            strokeWidth={7}
            color="#34d399"
            label={truncateText(detailed?.bestGoal?.name ?? cache.top_goal.name)}
            sublabel="Top Active Goal"
          />
          {!!detailed && (
            <View className="mt-4 pt-3 border-t border-border w-full items-center">
              <Text variant="tiny" className="uppercase font-bold">
                All Goals Avg
              </Text>
              <Text className="text-lg font-black text-emerald-400/80 mt-1">{detailed.goalAverage}%</Text>
            </View>
          )}
        </Card>

        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Habit Strength" />
          <CircularProgress
            value={detailed?.bestHabit?.consistency ?? 0}
            size={90}
            strokeWidth={7}
            color="#3b82f6"
            label={detailed?.bestHabit?.name ?? '—'}
            sublabel="Strongest Habit"
          />
          {!!detailed && (
            <View className="mt-4 pt-3 border-t border-border w-full items-center">
              <Text variant="tiny" className="uppercase font-bold">
                All Habits Avg
              </Text>
              <Text className="text-lg font-black text-blue-400/80 mt-1">{detailed.habitAverage}%</Text>
            </View>
          )}
        </Card>

        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Week Execution" />
          <CircularProgress
            value={detailed?.bestWeek?.efficiency ?? 0}
            size={90}
            strokeWidth={7}
            color="#f59e0b"
            label={detailed?.bestWeek?.weekKey ?? '—'}
            sublabel="Best Week"
          />
          {!!detailed && (
            <View className="mt-4 pt-3 border-t border-border w-full items-center">
              <Text variant="tiny" className="uppercase font-bold">
                All-Time Avg
              </Text>
              <Text className="text-lg font-black text-amber-400/80 mt-1">{detailed.weekAverage}%</Text>
            </View>
          )}
        </Card>

        <Card className="flex-1 min-w-[45%] items-center">
          <Label text="Life Balance" />
          <CircularProgress
            value={balanceAvg}
            size={90}
            strokeWidth={7}
            color="#a78bfa"
            label={detailed?.bucketStats?.weakestBucket ? `Focus: ${BUCKET_META[detailed.bucketStats.weakestBucket].label}` : 'Balanced'}
            sublabel="Bucket Health"
          />
          {!!detailed && (
            <View className="mt-4 pt-3 border-t border-border w-full items-center">
              <Text variant="tiny" className="uppercase font-bold">
                4 Buckets Avg
              </Text>
              <Text className="text-lg font-black text-violet-400 mt-1">{balanceAvg}%</Text>
            </View>
          )}
        </Card>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Card className="flex-[2] min-w-[60%]">
          <Label text="30-Day Activity" />
          <View className="flex-row flex-wrap gap-2 mb-4">
            {cache.habit_heatmap.map((day, idx) => (
              <View key={idx} className="w-5 h-5 rounded-md" style={{ backgroundColor: getHeatmapColor(day.count) }} />
            ))}
          </View>
          <View className="flex-row items-center justify-end gap-2">
            <Text variant="tiny" className="font-mono">
              Less
            </Text>
            <View className="flex-row gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(i) }} />
              ))}
            </View>
            <Text variant="tiny" className="font-mono">
              More
            </Text>
          </View>
        </Card>

        <Card className="flex-1 min-w-[35%]">
          <Label text="Bio-Sync" />
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{cache.bio_sync.sleep_duration}h</Text>
              <Text variant="tiny" className="uppercase font-bold">
                Avg Sleep
              </Text>
            </View>
            <View className="flex-1 border-l border-border pl-3">
              <Text className="text-2xl font-bold text-foreground">{cache.bio_sync.completion_volume}</Text>
              <Text variant="tiny" className="uppercase font-bold">
                Avg Tasks/Day
              </Text>
            </View>
          </View>
          <View className="bg-muted p-3 rounded-xl border border-border">
            <Text variant="small">{cache.bio_sync.correlationText}</Text>
          </View>
        </Card>
      </View>

      <Card>
        <View className="flex-row items-center justify-between mb-4 flex-wrap gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-black uppercase tracking-widest text-foreground">Life Balance</Text>
            <Text className="text-muted-foreground/40">•</Text>
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#818cf8" />
              <Text variant="small" className="font-bold">
                {WeekUtils.formatWeekDisplay(currentWeek)}
              </Text>
            </View>
          </View>
          <View className="px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20">
            <Text variant="tiny" className="font-mono font-bold text-primary">
              {detailed?.bucketStats?.totalAllocatedHours || 0}h / 168h ({Math.round(((detailed?.bucketStats?.totalAllocatedHours || 0) / 168) * 100)}%)
            </Text>
          </View>
        </View>

        {detailed?.bucketStats ? (
          <View className="gap-4">
            <View className="items-center gap-2">
              <View className="w-28 h-56 rounded-3xl bg-black/60 border-2 border-white/15 overflow-hidden" style={{ flexDirection: 'column-reverse' }}>
                <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: '25%' }}>
                  <Text variant="tiny" className="font-mono opacity-40">
                    126h
                  </Text>
                </View>
                <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: '50%' }}>
                  <Text variant="tiny" className="font-mono opacity-40">
                    84h
                  </Text>
                </View>
                <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: '75%' }}>
                  <Text variant="tiny" className="font-mono opacity-40">
                    42h
                  </Text>
                </View>

                {LIFE_BUCKETS.map((bucketKey) => {
                  const config = BUCKET_VESSEL_CONFIG[bucketKey];
                  const hours = detailed.bucketStats.bucketHours[bucketKey] || 0;
                  const pct = detailed.bucketStats.bucketPercentages[bucketKey] || 0;
                  if (hours <= 0) return null;
                  return (
                    <View
                      key={bucketKey}
                      className="w-full items-center justify-center border-t border-white/20"
                      style={{ height: `${pct}%`, backgroundColor: `${config.hex}66` }}
                    >
                      {pct >= 8 && (
                        <Text variant="tiny" className="font-mono font-black text-white">
                          {hours}h
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text variant="tiny" className="uppercase font-bold">
                168h Master Bucket
              </Text>
            </View>

            {LIFE_BUCKETS.map((bucketKey) => {
              const config = BUCKET_VESSEL_CONFIG[bucketKey];
              const hours = detailed.bucketStats.bucketHours[bucketKey] || 0;
              const pct = detailed.bucketStats.bucketPercentages[bucketKey] || 0;
              const isZero = hours === 0;
              const Icon = config.icon;

              return (
                <View
                  key={bucketKey}
                  className={cn(
                    'p-3 rounded-2xl border flex-row items-center justify-between gap-3 bg-card/60',
                    isZero ? 'border-border/40 opacity-50' : 'border-white/10'
                  )}
                >
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <Icon size={16} color={isZero ? '#71717a' : config.hex} />
                    <View>
                      <Text className={cn('text-xs font-black uppercase', isZero ? 'text-muted-foreground' : config.textClass)}>
                        {BUCKET_META[bucketKey].label}
                      </Text>
                      <Text variant="tiny" className="font-mono">
                        {hours}h ({pct}% of week)
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base font-mono font-black text-foreground">{pct}%</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="p-4 items-center bg-muted/20 rounded-2xl border border-border">
            <Text variant="small" className="text-center">
              Assign Life Buckets to your goals and habits to view your weekly balance.
            </Text>
          </View>
        )}
      </Card>

      {!!milestoneProgress && (
        <MilestonesShowcase
          progress={milestoneProgress}
          onShareMilestone={(stage) =>
            shareMilestone(stage, milestoneProgress.totalDaysExecuted, milestoneProgress.currentStreak)
          }
        />
      )}

      {!!target && (
        <View style={{ position: 'absolute', top: 0, left: -9999 }}>
          <MilestoneShareCard
            ref={cardRef}
            stage={target.stage}
            totalDaysExecuted={target.totalDaysExecuted}
            currentStreak={target.currentStreak}
          />
        </View>
      )}
    </View>
  );
};
