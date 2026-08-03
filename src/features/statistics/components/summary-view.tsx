import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import { WeekUtils } from '@/utils/week';
import type { UserStatsCache } from '../hooks/use-user-stats';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';
import { LIFE_BUCKETS, BUCKET_META } from '@/types/time';

const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ className, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    className={cn(
      'relative flex flex-col overflow-hidden rounded-3xl p-4 sm:p-6',
      'bg-card/80 backdrop-blur-md border border-border',
      className,
    )}
  >
    {children}
  </motion.div>
);

const Label: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">{text}</p>
);

const truncateText = (text: string, maxLength: number = 70) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

interface SummaryViewProps {
  cache: UserStatsCache;
  detailed: DetailedAnalytics | undefined;
  onSwitchToInsights: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ cache, detailed, onSwitchToInsights }) => {
  const trajectory = detailed?.trajectory;

  const currentWeek = WeekUtils.getCurrentWeek();
  const currentWeekExecution = detailed?.weeks?.find(w => w.weekKey === currentWeek);
  const currentEff = currentWeekExecution ? currentWeekExecution.efficiency : (detailed?.weekAverage ?? 100);

  let rankPct = 60;
  if (currentEff >= 80) rankPct = 2;
  else if (currentEff >= 65) rankPct = 7;
  else if (currentEff >= 50) rankPct = 14;
  else if (currentEff >= 30) rankPct = 32;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/20';
    if (count === 2) return 'bg-primary/40';
    if (count === 3) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Top Row — Legacy Life Score + Grade + Rank */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Consistency Grade */}
        <Card className="items-center justify-center" delay={0.1}>
          <Label text="Consistency Grade" />
          <div className="relative">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/40 select-none">
              {cache.consistency_grade}
            </span>
            <div className="absolute inset-0 bg-primary opacity-15 blur-[40px] -z-10 rounded-full" />
          </div>
        </Card>

        {/* Hero — Your Legacy Life Score */}
        <Card className="md:col-span-2 items-center justify-center py-6 sm:py-8" delay={0.15}>
          <Label text="Your Legacy Life Score" />
          <CircularProgress
            value={trajectory?.total ?? 0}
            size={130}
            strokeWidth={10}
            color="stroke-intent-goal"
            delay={0.2}
          />
          {trajectory && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-[11px] sm:text-xs text-muted-foreground font-medium mt-4 sm:mt-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-intent-goal" />
                Goals {trajectory.goalScore}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-intent-habit" />
                Habits {trajectory.habitScore}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-intent-warning" />
                Execution {trajectory.executionScore}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                Balance {trajectory.balanceScore}%
              </span>
            </div>
          )}
        </Card>

        {/* Global Rank */}
        <Card 
          className="items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-card/95 transition-all duration-300 group" 
          delay={0.2}
        >
          <div onClick={onSwitchToInsights} className="h-full flex flex-col justify-between items-center text-center">
            <div className="flex flex-col items-center">
              <Label text="Global Rank" />
              <div className="relative mt-2">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60 select-none">
                  Top {rankPct}%
                </span>
                <div className="absolute inset-0 bg-primary opacity-10 blur-[30px] -z-10 rounded-full" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-4 max-w-[150px]">
                You ranked in the <strong className="text-primary">top {rankPct}%</strong> of all Legacy builders this week!
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
              View Insights →
            </span>
          </div>
        </Card>
      </div>

      {/* Row — Three circular progress cards: Goals / Habits / Execution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goals */}
        <Card className="items-center" delay={0.2}>
          <Label text="Goal Progress" />
          <CircularProgress
            value={detailed?.bestGoal?.progress ?? cache.top_goal.progress}
            size={90}
            strokeWidth={7}
            color="stroke-intent-goal"
            label={truncateText(detailed?.bestGoal?.name ?? cache.top_goal.name, 70)}
            sublabel="Top Active Goal"
            delay={0.3}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-border w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">All Goals Avg</p>
              <p className="text-lg font-black text-intent-goal/80 mt-1">{detailed.goalAverage}%</p>
            </div>
          )}
        </Card>

        {/* Habits */}
        <Card className="items-center" delay={0.3}>
          <Label text="Habit Strength" />
          <CircularProgress
            value={detailed?.bestHabit?.consistency ?? 0}
            size={90}
            strokeWidth={7}
            color="stroke-intent-habit"
            label={detailed?.bestHabit?.name ?? '—'}
            sublabel="Strongest Habit"
            delay={0.4}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-border w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">All Habits Avg</p>
              <p className="text-lg font-black text-intent-habit/80 mt-1">{detailed.habitAverage}%</p>
            </div>
          )}
        </Card>

        {/* Execution */}
        <Card className="items-center" delay={0.4}>
          <Label text="Week Execution" />
          <CircularProgress
            value={detailed?.bestWeek?.efficiency ?? 0}
            size={90}
            strokeWidth={7}
            color="stroke-intent-warning"
            label={detailed?.bestWeek?.weekKey ?? '—'}
            sublabel="Best Week"
            delay={0.5}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-border w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">All-Time Avg</p>
              <p className="text-lg font-black text-intent-warning/80 mt-1">{detailed.weekAverage}%</p>
            </div>
          )}
        </Card>
      </div>

      {/* Heatmap + Bio-Sync row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 justify-between" delay={0.5}>
          <Label text="30-Day Activity" />
          <div className="flex flex-col space-y-5">
            <div className="flex gap-2 flex-wrap items-center justify-start md:justify-center">
              {cache.habit_heatmap.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-5 h-5 md:w-6 md:h-6 rounded-md transition-colors duration-300 hover:scale-110 cursor-pointer',
                    getHeatmapColor(day.count),
                  )}
                  title={`${new Date(day.date).toLocaleDateString()}: ${day.count} tasks`}
                />
              ))}
            </div>
            <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground font-medium font-mono select-none">
              <span>Less</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-sm bg-muted" />
                <span className="w-3 h-3 rounded-sm bg-primary/20" />
                <span className="w-3 h-3 rounded-sm bg-primary/40" />
                <span className="w-3 h-3 rounded-sm bg-primary/60" />
                <span className="w-3 h-3 rounded-sm bg-primary/90" />
              </div>
              <span>More</span>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-1" delay={0.55}>
          <Label text="Bio-Sync" />
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">{cache.bio_sync.sleep_duration}h</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg Sleep</span>
              </div>
              <div className="flex flex-col border-l border-border pl-4">
                <span className="text-2xl font-bold text-foreground">{cache.bio_sync.completion_volume}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg Tasks/Day</span>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{cache.bio_sync.correlationText}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row — Life Balance (4 Buckets Overview) */}
      <Card delay={0.6}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <Label text="Life Balance — 4 Buckets" />
            <p className="text-xs text-muted-foreground font-normal -mt-3">
              Weekly hour distribution across Income, Assets, Recovery, and Relationships
            </p>
          </div>
          {detailed?.bucketStats?.weakestBucket && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Focus: {BUCKET_META[detailed.bucketStats.weakestBucket].label}
            </span>
          )}
        </div>

        {detailed?.bucketStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {LIFE_BUCKETS.map((bucketKey) => {
                const meta = BUCKET_META[bucketKey];
                const hours = detailed.bucketStats.bucketHours[bucketKey] || 0;
                const pct = detailed.bucketStats.bucketPercentages[bucketKey] || 0;
                const isZero = hours === 0;

                return (
                  <div
                    key={bucketKey}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2",
                      isZero
                        ? "bg-muted/30 border-border opacity-70"
                        : cn("bg-glass", meta.borderClass)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold uppercase tracking-wider", meta.color)}>
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {hours}h
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, pct)}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className={cn("h-full rounded-full", isZero ? "bg-muted-foreground/30" : meta.bgClass.replace('/10', '/80'))}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{pct}% of assigned</span>
                        {isZero && <span className="text-amber-400 font-semibold">0h logged</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {detailed.bucketStats.unassignedHours > 0 && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Note: {detailed.bucketStats.unassignedHours}h of tasks in your planner don't have a Life Bucket tag yet. Edit your goals and habits to tag them.
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border">
            Assign Life Buckets to your goals and habits to view your weekly balance.
          </div>
        )}
      </Card>

    </div>
  );
};
