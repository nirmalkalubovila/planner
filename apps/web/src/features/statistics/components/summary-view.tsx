import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, Moon, HeartHandshake, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import { WeekUtils } from '@llb/core';
import type { UserStatsCache } from '../hooks/use-user-stats';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';
import { LIFE_BUCKETS, BUCKET_META, type LifeBucket } from '@llb/core';
import { MilestonesShowcase } from './milestones/milestones-showcase';
import { generateMilestoneInsightCard } from '@llb/core';
import { INSIGHT_THEMES } from './insights/insight-themes';
import { renderShareCardToCanvas } from './insights/share-card-renderer';
import { shareToSocial, downloadShareImage, copyToClipboard } from '@/utils/share-utils';
import { toast } from '@llb/core';
import type { MilestoneStage } from '@/utils/milestone-engine';

const BUCKET_VESSEL_CONFIG: Record<LifeBucket, {
  label: string;
  icon: React.ElementType;
  accentText: string;
  accentBorder: string;
  liquidBg: string;
  liquidBorder: string;
}> = {
  income: {
    label: 'Income-Producing',
    icon: Briefcase,
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20 group-hover:border-emerald-500/40',
    liquidBg: 'bg-gradient-to-t from-emerald-600/30 via-emerald-500/20 to-emerald-400/30',
    liquidBorder: 'border-emerald-400/50',
  },
  asset: {
    label: 'Asset-Building',
    icon: TrendingUp,
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/20 group-hover:border-violet-500/40',
    liquidBg: 'bg-gradient-to-t from-violet-600/30 via-violet-500/20 to-violet-400/30',
    liquidBorder: 'border-violet-400/50',
  },
  recovery: {
    label: 'Recovery',
    icon: Moon,
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/20 group-hover:border-sky-500/40',
    liquidBg: 'bg-gradient-to-t from-sky-600/30 via-sky-500/20 to-sky-400/30',
    liquidBorder: 'border-sky-400/50',
  },
  relational: {
    label: 'Relational',
    icon: HeartHandshake,
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/20 group-hover:border-amber-500/40',
    liquidBg: 'bg-gradient-to-t from-amber-600/30 via-amber-500/20 to-amber-400/30',
    liquidBorder: 'border-amber-400/50',
  },
};

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
  const milestoneProgress = detailed?.milestoneProgress;

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

  const handleShareMilestone = async (stage: MilestoneStage) => {
    try {
      const totalDays = milestoneProgress?.totalDaysExecuted ?? 0;
      const streak = milestoneProgress?.currentStreak ?? 0;
      const cardData = generateMilestoneInsightCard(stage, totalDays, streak);
      const theme = INSIGHT_THEMES[3]; // Midnight Gold theme matching LLB
      const blob = await renderShareCardToCanvas(cardData, theme, 'story');
      const shared = await shareToSocial(blob, `I reached ${stage.title} (${stage.days} days consistent) on Legacy Life Builder!`);
      if (shared) {
        toast.success('Shared milestone card!');
      } else {
        const copied = await copyToClipboard(blob);
        downloadShareImage(blob, `legacy-milestone-stage-${stage.stageNumber}.png`);
        if (copied) {
          toast.success('Card copied to clipboard & downloaded!');
        } else {
          toast.success('Downloaded milestone share card!');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not generate milestone share card');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Row — Legacy Life Score (Centered & Bigger) + Consistency Grade + Global Rank */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Consistency Grade */}
        <Card className="items-center justify-center text-center" delay={0.1}>
          <Label text="Consistency Grade" />
          <div className="relative">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/40 select-none">
              {cache.consistency_grade}
            </span>
            <div className="absolute inset-0 bg-primary opacity-15 blur-[40px] -z-10 rounded-full" />
          </div>
          <div className="mt-4 flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Based on 30-Day Activity
            </span>
            {milestoneProgress && (
              <span className="text-[10px] font-bold text-muted-foreground/80 mt-0.5">
                {milestoneProgress.totalDaysExecuted} Total Days • {milestoneProgress.currentStreak}d Streak
              </span>
            )}
          </div>
        </Card>

        {/* Hero — Your Legacy Life Score (Centered & Prominent) */}
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

      {/* Row — Four circular progress cards: Goals / Habits / Execution / Balance (2x2 Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* Life Balance */}
        <Card className="items-center" delay={0.5}>
          <Label text="Life Balance" />
          <CircularProgress
            value={
              detailed?.bucketBalanceScores
                ? Math.round((Object.values(detailed.bucketBalanceScores).reduce((a, b) => a + b, 0) / 4) * 10)
                : 50
            }
            size={90}
            strokeWidth={7}
            color="stroke-violet-400"
            label={
              detailed?.bucketStats?.weakestBucket
                ? `Focus: ${BUCKET_META[detailed.bucketStats.weakestBucket].label}`
                : 'Balanced'
            }
            sublabel="Bucket Health"
            delay={0.6}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-border w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">4 Buckets Avg</p>
              <p className="text-lg font-black text-violet-400 mt-1">
                {Math.round((Object.values(detailed.bucketBalanceScores || {}).reduce((a, b) => a + b, 0) / 4) * 10)}%
              </p>
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

      {/* Row — Life Balance (Single Unified Master Bucket with 4 Color Layers) */}
      <Card delay={0.6}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              Life Balance
            </h3>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Calendar size={12} className="text-primary" />
              {WeekUtils.formatWeekDisplay(currentWeek)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
              {detailed?.bucketStats?.totalAllocatedHours || 0}h / 168h ({Math.round(((detailed?.bucketStats?.totalAllocatedHours || 0) / 168) * 100)}%)
            </span>
          </div>
        </div>

        {detailed?.bucketStats ? (
          <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-8">
            {/* The Single Master Glass Bucket Vessel */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 sm:w-36 h-56 rounded-3xl bg-black/60 border-2 border-white/15 p-1 flex flex-col-reverse overflow-hidden backdrop-blur-md shadow-inner">
                {/* Measurement Guide Ticks */}
                <div className="absolute right-2 top-[25%] text-[8px] font-mono text-muted-foreground/40 select-none z-10 pointer-events-none">
                  126h
                </div>
                <div className="absolute right-2 top-[50%] text-[8px] font-mono text-muted-foreground/40 select-none z-10 pointer-events-none">
                  84h
                </div>
                <div className="absolute right-2 top-[75%] text-[8px] font-mono text-muted-foreground/40 select-none z-10 pointer-events-none">
                  42h
                </div>

                {/* 1. Income Layer (Bottom) */}
                {(detailed.bucketStats.bucketHours.income || 0) > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${detailed.bucketStats.bucketPercentages.income}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="w-full bg-gradient-to-t from-emerald-600/60 to-emerald-400/50 border-t border-emerald-300/40 relative rounded-b-2xl flex items-center justify-center"
                    title={`Income-Producing: ${detailed.bucketStats.bucketHours.income}h (${detailed.bucketStats.bucketPercentages.income}%)`}
                  >
                    <span className="text-[10px] font-mono font-black text-emerald-100 drop-shadow-sm">
                      {detailed.bucketStats.bucketPercentages.income >= 8 ? `${detailed.bucketStats.bucketHours.income}h` : ''}
                    </span>
                  </motion.div>
                )}

                {/* 2. Asset Layer */}
                {(detailed.bucketStats.bucketHours.asset || 0) > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${detailed.bucketStats.bucketPercentages.asset}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className="w-full bg-gradient-to-t from-violet-600/60 to-violet-400/50 border-t border-violet-300/40 relative flex items-center justify-center"
                    title={`Asset-Building: ${detailed.bucketStats.bucketHours.asset}h (${detailed.bucketStats.bucketPercentages.asset}%)`}
                  >
                    <span className="text-[10px] font-mono font-black text-violet-100 drop-shadow-sm">
                      {detailed.bucketStats.bucketPercentages.asset >= 8 ? `${detailed.bucketStats.bucketHours.asset}h` : ''}
                    </span>
                  </motion.div>
                )}

                {/* 3. Recovery Layer */}
                {(detailed.bucketStats.bucketHours.recovery || 0) > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${detailed.bucketStats.bucketPercentages.recovery}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className="w-full bg-gradient-to-t from-sky-600/60 to-sky-400/50 border-t border-sky-300/40 relative flex items-center justify-center"
                    title={`Recovery: ${detailed.bucketStats.bucketHours.recovery}h (${detailed.bucketStats.bucketPercentages.recovery}%)`}
                  >
                    <span className="text-[10px] font-mono font-black text-sky-100 drop-shadow-sm">
                      {detailed.bucketStats.bucketPercentages.recovery >= 8 ? `${detailed.bucketStats.bucketHours.recovery}h` : ''}
                    </span>
                  </motion.div>
                )}

                {/* 4. Relational Layer (Top) */}
                {(detailed.bucketStats.bucketHours.relational || 0) > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${detailed.bucketStats.bucketPercentages.relational}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                    className="w-full bg-gradient-to-t from-amber-600/60 to-amber-400/50 border-t border-amber-300/50 relative flex items-center justify-center"
                    title={`Relational: ${detailed.bucketStats.bucketHours.relational}h (${detailed.bucketStats.bucketPercentages.relational}%)`}
                  >
                    <span className="text-[10px] font-mono font-black text-amber-100 drop-shadow-sm">
                      {detailed.bucketStats.bucketPercentages.relational >= 8 ? `${detailed.bucketStats.bucketHours.relational}h` : ''}
                    </span>
                  </motion.div>
                )}

                {/* Glass Reflection Highlight */}
                <div className="absolute inset-y-0 left-2 w-1.5 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-full pointer-events-none z-10" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                168h Master Bucket
              </span>
            </div>

            {/* Right Side: 4 Clean Volume Breakdown Cards */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LIFE_BUCKETS.map((bucketKey) => {
                const config = BUCKET_VESSEL_CONFIG[bucketKey];
                const hours = detailed.bucketStats.bucketHours[bucketKey] || 0;
                const pct = detailed.bucketStats.bucketPercentages[bucketKey] || 0;
                const isZero = hours === 0;

                return (
                  <div
                    key={bucketKey}
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 bg-card/60 backdrop-blur-sm",
                      isZero
                        ? "border-border/40 opacity-50"
                        : cn("border-white/10 hover:border-white/20", config.accentBorder)
                    )}
                  >
                    <div>
                      <span className={cn("text-xs font-black uppercase tracking-wider block", isZero ? "text-muted-foreground" : config.accentText)}>
                        {config.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {hours}h ({pct}% of week)
                      </span>
                    </div>

                    <span className="text-base font-mono font-black text-foreground">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border">
            Assign Life Buckets to your goals and habits to view your weekly balance.
          </div>
        )}
      </Card>

      {/* Consistency Milestone Stages & Replay Section (Placed after all core stats) */}
      {milestoneProgress && (
        <MilestonesShowcase
          progress={milestoneProgress}
          onShareMilestone={handleShareMilestone}
        />
      )}

    </div>
  );
};
