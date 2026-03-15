import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { UserStatsCache } from '../hooks/use-user-stats';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';

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
      'bg-[#0a0c10]/80 backdrop-blur-md border border-white/10',
      className,
    )}
  >
    {children}
  </motion.div>
);

const Label: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs uppercase tracking-widest font-bold text-white/40 mb-4">{text}</p>
);

interface SummaryViewProps {
  cache: UserStatsCache;
  detailed: DetailedAnalytics | undefined;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ cache, detailed }) => {
  const trajectory = detailed?.trajectory;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-primary/20';
    if (count === 2) return 'bg-primary/40';
    if (count === 3) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Hero — Life Trajectory with circular gauge */}
      <Card className="items-center justify-center py-6 sm:py-10" delay={0.1}>
        <Label text="Life Trajectory Score" />
        <CircularProgress
          value={trajectory?.total ?? 0}
          size={130}
          strokeWidth={10}
          color="stroke-emerald-400"
          delay={0.2}
        />
        {trajectory && (
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-[11px] sm:text-xs text-white/40 font-medium mt-4 sm:mt-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Goals {trajectory.goalScore}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Habits {trajectory.habitScore}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Execution {trajectory.executionScore}%
            </span>
          </div>
        )}
      </Card>

      {/* Row — Three circular progress cards: Goals / Habits / Execution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goals */}
        <Card className="items-center" delay={0.2}>
          <Label text="Goal Progress" />
          <CircularProgress
            value={detailed?.bestGoal?.progress ?? cache.top_goal.progress}
            size={90}
            strokeWidth={7}
            color="stroke-emerald-400"
            label={detailed?.bestGoal?.name ?? cache.top_goal.name}
            sublabel="Top Active Goal"
            delay={0.3}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-white/5 w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-white/30 font-bold">All Goals Avg</p>
              <p className="text-lg font-black text-emerald-400/80 mt-1">{detailed.goalAverage}%</p>
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
            color="stroke-blue-400"
            label={detailed?.bestHabit?.name ?? '—'}
            sublabel="Strongest Habit"
            delay={0.4}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-white/5 w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-white/30 font-bold">All Habits Avg</p>
              <p className="text-lg font-black text-blue-400/80 mt-1">{detailed.habitAverage}%</p>
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
            color="stroke-amber-400"
            label={detailed?.bestWeek?.weekKey ?? '—'}
            sublabel="Best Week"
            delay={0.5}
          />
          {detailed && (
            <div className="mt-4 pt-3 border-t border-white/5 w-full text-center">
              <p className="text-[11px] uppercase tracking-wider text-white/30 font-bold">All-Time Avg</p>
              <p className="text-lg font-black text-amber-400/80 mt-1">{detailed.weekAverage}%</p>
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
            <div className="flex justify-end items-center gap-2 text-xs text-white/30 font-medium font-mono select-none">
              <span>Less</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-sm bg-white/5" />
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
                <span className="text-2xl font-bold text-white">{cache.bio_sync.sleep_duration}h</span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Avg Sleep</span>
              </div>
              <div className="flex flex-col border-l border-white/5 pl-4">
                <span className="text-2xl font-bold text-white">{cache.bio_sync.completion_volume}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Avg Tasks/Day</span>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-xs text-white/50 leading-relaxed">{cache.bio_sync.correlationText}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grade + Top Goal row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="items-center justify-center" delay={0.6}>
          <Label text="Consistency Grade" />
          <div className="relative">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 select-none">
              {cache.consistency_grade}
            </span>
            <div className="absolute inset-0 bg-primary opacity-15 blur-[40px] -z-10 rounded-full" />
          </div>
        </Card>

        <Card className="md:col-span-2" delay={0.65}>
          <Label text="Top Goal Velocity" />
          <div className="flex items-center gap-4 sm:gap-6">
            <CircularProgress
              value={cache.top_goal.progress}
              size={70}
              strokeWidth={6}
              color="stroke-primary"
              delay={0.7}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">{cache.top_goal.name}</p>
              <p className="text-xs text-white/40 mt-1">
                Projected: {cache.top_goal.projected_completion}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
