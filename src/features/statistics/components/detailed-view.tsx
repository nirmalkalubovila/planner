import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';

const Panel: React.FC<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl bg-[#0a0c10]/80 backdrop-blur-md border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xs uppercase tracking-widest font-bold text-white/50">{title}</h3>
          {count !== undefined && (
            <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn('text-white/30 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getColor = (v: number) => {
  if (v > 80) return { text: 'text-emerald-400', stroke: 'stroke-emerald-400' };
  if (v > 50) return { text: 'text-amber-300', stroke: 'stroke-amber-400' };
  return { text: 'text-rose-400', stroke: 'stroke-rose-400' };
};

interface DetailedViewProps {
  data: DetailedAnalytics;
}

export const DetailedView: React.FC<DetailedViewProps> = ({ data }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    {/* Habits */}
    <Panel title="Habits" count={data.habits.length}>
      {data.habits.length === 0 ? (
        <p className="text-sm text-white/30 py-4">No habits created yet.</p>
      ) : (
        data.habits.map((habit, i) => {
          const c = getColor(habit.consistency);
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-white/[0.02] border border-white/5 p-3 sm:p-4"
            >
              <CircularProgress
                value={habit.consistency}
                size={48}
                strokeWidth={4}
                color={c.stroke}
                delay={0.2 + i * 0.04}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white/90 truncate">{habit.name}</p>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 text-[10px] sm:text-[11px] text-white/35">
                  <span>Streak: {habit.longestStreak}d</span>
                  <span>{habit.activeDays}/{habit.totalExpectedDays} days</span>
                </div>
              </div>
              <span className={cn('text-xs sm:text-sm font-bold shrink-0', c.text)}>
                {habit.consistency}%
              </span>
            </motion.div>
          );
        })
      )}
    </Panel>

    {/* Goals */}
    <Panel title="Goals" count={data.goals.length}>
      {data.goals.length === 0 ? (
        <p className="text-sm text-white/30 py-4">No goals created yet.</p>
      ) : (
        data.goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-white/[0.02] border border-white/5 p-3 sm:p-4"
          >
            <CircularProgress
              value={goal.progress}
              size={48}
              strokeWidth={4}
              color="stroke-emerald-400"
              delay={0.2 + i * 0.04}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white/90 truncate">{goal.name}</p>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 text-[10px] sm:text-[11px] text-white/35">
                <span>Milestones: {goal.completedMilestones}/{goal.totalMilestones}</span>
                <span>Velocity: {goal.velocityMultiplier}x</span>
                <span>Target: {goal.projectedCompletion}</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 shrink-0">{goal.progress}%</span>
          </motion.div>
        ))
      )}
    </Panel>

    {/* Week execution */}
    <Panel title="Weekly Execution" count={data.weeks.length} defaultOpen={false}>
      {data.weeks.length === 0 ? (
        <p className="text-sm text-white/30 py-4">No weekly plans recorded yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
            <StatBox label="Best Week" value={data.bestWeek ? `${data.bestWeek.efficiency}%` : '—'} sub={data.bestWeek?.weekKey} />
            <StatBox label="All-Time Avg" value={`${data.weekAverage}%`} />
            <StatBox label="Weeks Tracked" value={`${data.weeks.length}`} />
          </div>

          <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            {data.weeks
              .slice()
              .sort((a, b) => (a.weekKey > b.weekKey ? -1 : 1))
              .map((w, i) => (
                <motion.div
                  key={w.weekKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  className="flex items-center gap-3 text-xs py-1"
                >
                  <span className="text-white/25 w-16 sm:w-24 shrink-0 font-mono text-[10px] sm:text-[11px] truncate">{w.weekKey}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(w.efficiency, 100)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.02 }}
                      className="h-full rounded-full bg-amber-500/60"
                    />
                  </div>
                  <span className="text-white/40 w-9 text-right font-medium">{w.efficiency}%</span>
                </motion.div>
              ))}
          </div>
        </>
      )}
    </Panel>
  </div>
);

const StatBox: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-2 sm:p-3 text-center">
    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30 font-bold mb-1">{label}</p>
    <p className="text-base sm:text-lg font-black text-white/70">{value}</p>
    {sub && <p className="text-[10px] text-white/20 mt-0.5 font-mono">{sub}</p>}
  </div>
);
