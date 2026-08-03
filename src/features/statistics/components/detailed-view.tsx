import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Sparkles, Trophy, AlertTriangle, Target, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { DetailedAnalytics } from '../hooks/use-detailed-stats';
import { LIFE_BUCKETS, BUCKET_META, LifeBucket } from '@/types/time';

const GoldenSparkles = () => {
  const sparkles = Array.from({ length: 5 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {sparkles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-500/30"
          initial={{
            x: Math.random() * 80 + 10 + '%',
            y: '100%',
            scale: Math.random() * 0.4 + 0.4,
            opacity: 0
          }}
          animate={{
            y: '-10%',
            opacity: [0, 0.7, 0.7, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        >
          <Sparkles size={8 + Math.random() * 6} />
        </motion.div>
      ))}
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl bg-card/80 backdrop-blur-md border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{title}</h3>
          {count !== undefined && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn('text-muted-foreground transition-transform duration-300', open && 'rotate-180')}
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
  if (v > 80) return { text: 'text-intent-goal', stroke: 'stroke-intent-goal' };
  if (v > 50) return { text: 'text-intent-warning', stroke: 'stroke-intent-warning' };
  return { text: 'text-destructive', stroke: 'stroke-destructive' };
};

interface DetailedViewProps {
  data: DetailedAnalytics;
}

export const DetailedView: React.FC<DetailedViewProps> = ({ data }) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  // Map raw goals & habits by ID to extract bucket metadata easily
  const rawGoalsMap = React.useMemo(() => {
    const map = new Map<string, any>();
    (data.rawGoals || []).forEach(g => map.set(g.id || '', g));
    return map;
  }, [data.rawGoals]);

  const rawHabitsMap = React.useMemo(() => {
    const map = new Map<string, any>();
    (data.rawHabits || []).forEach(h => map.set(h.id || '', h));
    return map;
  }, [data.rawHabits]);

  // Executive Action Plan & Diagnosis
  const actionPlan = React.useMemo(() => {
    const steps: { title: string; desc: string; type: 'urgent' | 'action' | 'success' }[] = [];

    // Check 1: Unassigned bucket tasks
    if (data.bucketStats?.unassignedHours > 0) {
      steps.push({
        title: 'Tag Unassigned Hours',
        desc: `You have ${data.bucketStats.unassignedHours}h of scheduled tasks without a Life Bucket. Edit your goals/habits to categorize them.`,
        type: 'urgent',
      });
    }

    // Check 2: Neglected buckets
    if (data.bucketStats?.weakestBucket) {
      const wBucket = BUCKET_META[data.bucketStats.weakestBucket];
      const hours = data.bucketStats.bucketHours[data.bucketStats.weakestBucket] || 0;
      if (hours === 0) {
        steps.push({
          title: `Restore ${wBucket.label} Bucket`,
          desc: `${wBucket.label} has 0 hours allocated this week. Schedule at least one block in your weekly planner for ${wBucket.label.toLowerCase()}.`,
          type: 'urgent',
        });
      }
    }

    // Check 3: Weak habits
    const weakHabit = data.habits.find(h => h.consistency < 50);
    if (weakHabit) {
      steps.push({
        title: `Stabilize "${weakHabit.name}" Habit`,
        desc: `Consistency is at ${weakHabit.consistency}%. Set a fixed daily alarm and place it early in your schedule.`,
        type: 'action',
      });
    }

    // Check 4: Goals without milestones or low progress
    const stagnantGoal = data.goals.find(g => g.progress < 30 && g.totalMilestones === 0);
    if (stagnantGoal) {
      steps.push({
        title: `Break Down "${stagnantGoal.name}"`,
        desc: `Goal progress is at ${stagnantGoal.progress}% with 0 milestones. Add 2-3 target milestones to build velocity.`,
        type: 'action',
      });
    }

    // Fallback if everything is running smoothly
    if (steps.length === 0) {
      steps.push({
        title: 'Maintain Weekly Rhythm',
        desc: 'Your goals, habits, and balance are well aligned. Keep executing your scheduled planner blocks daily.',
        type: 'success',
      });
    }

    return steps.slice(0, 3);
  }, [data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Executive Feedback & Action Plan Section */}
      <div className="rounded-3xl bg-card/90 backdrop-blur-md border border-border p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">Actionable Execution Feedback</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Legacy Score: {data.trajectory?.total || 0}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actionPlan.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 text-xs",
                step.type === 'urgent'
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : step.type === 'action'
                    ? "bg-primary/10 border-primary/20 text-foreground"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              )}
            >
              <div className="flex items-center gap-2 font-bold">
                {step.type === 'urgent' && <ShieldAlert size={14} className="text-amber-400 shrink-0" />}
                {step.type === 'action' && <ArrowRight size={14} className="text-primary shrink-0" />}
                {step.type === 'success' && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                <span className="truncate">{step.title}</span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 1: Habits (Shrinked by default) */}
      <Panel title="Habits" count={data.habits.length} defaultOpen={false}>
        {data.habits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No habits created yet.</p>
        ) : (
          data.habits.map((habit, i) => {
            const raw = rawHabitsMap.get(habit.id);
            const bucket: LifeBucket | undefined = raw?.bucket;
            const bucketMeta = bucket ? BUCKET_META[bucket] : null;
            const c = getColor(habit.consistency);
            const isExpanded = expandedItemId === habit.id;

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex flex-col rounded-2xl bg-glass border border-border overflow-hidden transition-all"
              >
                <div
                  onClick={() => toggleExpand(habit.id)}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-accent/40 transition-colors"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{habit.name}</p>
                      {bucketMeta && (
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border", bucketMeta.badgeClass)}>
                          {bucketMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
                      <span>Streak: {habit.longestStreak}d</span>
                      <span>{habit.activeDays}/{habit.totalExpectedDays} days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs sm:text-sm font-bold', c.text)}>
                      {habit.consistency}%
                    </span>
                    <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/20 space-y-2 text-xs">
                    {raw?.purpose && (
                      <p className="text-muted-foreground italic">"{raw.purpose}"</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Time Window</span>
                        <span className="font-bold">{raw?.startTime || '06:00'} - {raw?.endTime || '07:00'}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Target Days</span>
                        <span className="font-bold">{(raw?.daysOfWeek || []).length || 7} days/week</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50 col-span-2 sm:col-span-1">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Life Bucket</span>
                        <span className={cn("font-bold", bucketMeta ? bucketMeta.color : "text-muted-foreground")}>
                          {bucketMeta ? bucketMeta.label : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </Panel>

      {/* Panel 2: Goals (Shrinked by default) */}
      <Panel title="Goals" count={data.goals.length} defaultOpen={false}>
        {data.goals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No goals created yet.</p>
        ) : (
          data.goals.map((goal, i) => {
            const raw = rawGoalsMap.get(goal.id);
            const bucket: LifeBucket | undefined = raw?.bucket;
            const bucketMeta = bucket ? BUCKET_META[bucket] : null;
            const isCompleted = goal.progress >= 100;
            const isExpanded = expandedItemId === goal.id;

            const cardClass = isCompleted
              ? goal.goalType === 'Week'
                ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.08)] relative overflow-hidden"
                : goal.goalType === 'Month'
                  ? "border-violet-500/30 bg-violet-500/5 shadow-[0_0_20px_rgba(139,92,246,0.12)] relative overflow-hidden"
                  : "border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_25px_rgba(234,179,8,0.15)] relative overflow-hidden"
              : "bg-glass border-border";

            const progressColor = isCompleted
              ? goal.goalType === 'Week'
                ? 'text-emerald-400'
                : goal.goalType === 'Month'
                  ? 'text-violet-400'
                  : 'text-yellow-400'
              : 'text-intent-goal';

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={cn("flex flex-col rounded-2xl border overflow-hidden transition-all", cardClass)}
              >
                {isCompleted && goal.goalType === 'Year' && <GoldenSparkles />}
                
                <div
                  onClick={() => toggleExpand(goal.id)}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-accent/40 transition-colors z-10 relative"
                >
                  {isCompleted ? (
                    <div className={cn(
                      "w-12 h-12 rounded-full border flex items-center justify-center shrink-0 z-10",
                      goal.goalType === 'Week' && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                      goal.goalType === 'Month' && "border-violet-500/30 bg-violet-500/10 text-violet-400",
                      goal.goalType === 'Year' && "border-yellow-500/35 bg-yellow-500/10 text-yellow-400"
                    )}>
                      {goal.goalType === 'Week' && <Check size={16} />}
                      {goal.goalType === 'Month' && <Sparkles size={16} />}
                      {goal.goalType === 'Year' && <Trophy size={16} />}
                    </div>
                  ) : (
                    <CircularProgress
                      value={goal.progress}
                      size={48}
                      strokeWidth={4}
                      color="stroke-intent-goal"
                      delay={0.2 + i * 0.04}
                      className="shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0 z-10 relative">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-xs sm:text-sm font-medium truncate", isCompleted ? progressColor : "text-foreground")}>
                        {goal.name}
                      </p>
                      {bucketMeta && (
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border", bucketMeta.badgeClass)}>
                          {bucketMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
                      <span>Milestones: {goal.completedMilestones}/{goal.totalMilestones}</span>
                      <span>Velocity: {goal.velocityMultiplier}x</span>
                      <span>Target: {goal.projectedCompletion}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 z-10 relative">
                    <span className={cn("text-xs sm:text-sm font-bold", progressColor)}>
                      {isCompleted
                        ? goal.goalType === 'Week'
                          ? '100% Met'
                          : goal.goalType === 'Month'
                            ? '100% Achieved'
                            : '100% Built'
                        : `${goal.progress}%`
                      }
                    </span>
                    <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/20 space-y-2 text-xs z-10 relative">
                    {raw?.purpose && (
                      <div className="bg-background/40 p-2.5 rounded-xl border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold mb-0.5">Purpose / Constraints</span>
                        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{raw.purpose}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Goal Type</span>
                        <span className="font-bold">{goal.goalType}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Start Date</span>
                        <span className="font-bold">{raw?.startDate || '-'}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">End Date</span>
                        <span className="font-bold">{raw?.endDate || '-'}</span>
                      </div>
                      <div className="bg-background/50 p-2 rounded-lg border border-border/50">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">Bucket</span>
                        <span className={cn("font-bold", bucketMeta ? bucketMeta.color : "text-muted-foreground")}>
                          {bucketMeta ? bucketMeta.label : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </Panel>

      {/* Panel 3: Weekly Execution (Shrinked by default) */}
      <Panel title="Weekly Execution" count={data.weeks.length} defaultOpen={false}>
        {data.weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No weekly plans recorded yet.</p>
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
                    <span className="text-muted-foreground w-16 sm:w-24 shrink-0 font-mono text-[10px] sm:text-[11px] truncate">{w.weekKey}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(w.efficiency, 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.02 }}
                        className="h-full rounded-full bg-intent-warning/60"
                      />
                    </div>
                    <span className="text-muted-foreground w-9 text-right font-medium">{w.efficiency}%</span>
                  </motion.div>
                ))}
            </div>
          </>
        )}
      </Panel>

      {/* Panel 4: Life Buckets Deep Analysis (Shrinked by default) */}
      <Panel title="Life Buckets Deep Analysis" count={4} defaultOpen={false}>
        <div className="space-y-5 pt-1">

          {/* Empty bucket warnings */}
          {Object.entries(data.emptyBucketStreaks || {}).some(([_, streak]) => streak >= 2) && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Bucket Neglect Warning</span>
              </div>
              {LIFE_BUCKETS.map((bucket) => {
                const streak = data.emptyBucketStreaks[bucket] || 0;
                if (streak < 2) return null;
                const meta = BUCKET_META[bucket];
                return (
                  <p key={bucket} className="text-xs text-amber-300/90 pl-5">
                    <strong>{meta.label}</strong> bucket has been empty for <span className="underline">{streak} consecutive weeks</span>.
                  </p>
                );
              })}
            </div>
          )}

          {/* Bucket Balance Scores */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">Bucket Health & Balance Scores</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LIFE_BUCKETS.map((bucketKey) => {
                const meta = BUCKET_META[bucketKey];
                const score = data.bucketBalanceScores?.[bucketKey] || 1;
                const hours = data.bucketStats?.bucketHours?.[bucketKey] || 0;

                return (
                  <div key={bucketKey} className={cn("p-3 rounded-2xl border flex flex-col justify-between space-y-1.5 bg-glass", meta.borderClass)}>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider truncate", meta.color)}>
                      {meta.label}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-foreground">{score}/10</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{hours}h this wk</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", meta.bgClass.replace('/10', '/80'))}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8-Week Bucket Trend */}
          {data.bucketHistory && data.bucketHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">8-Week Bucket Allocation Trend</span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {data.bucketHistory
                  .slice()
                  .sort((a, b) => (a.week > b.week ? -1 : 1))
                  .slice(0, 8)
                  .map((historyItem) => {
                    const total = historyItem.totalHours || 1;
                    return (
                      <div key={historyItem.week} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-muted-foreground font-bold">{historyItem.week}</span>
                          <span className="text-muted-foreground">{historyItem.totalHours}h total</span>
                        </div>
                        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted gap-0.5">
                          {LIFE_BUCKETS.map((bucketKey) => {
                            const hours = historyItem.hours[bucketKey] || 0;
                            if (hours === 0) return null;
                            const pct = Math.round((hours / total) * 100);
                            const meta = BUCKET_META[bucketKey];
                            return (
                              <div
                                key={bucketKey}
                                className={cn("h-full", meta.bgClass.replace('/10', '/90'))}
                                style={{ width: `${pct}%` }}
                                title={`${meta.label}: ${hours}h (${pct}%)`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Prompt for unassigned tasks */}
          {data.bucketStats?.unassignedHours > 0 && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
              You have <strong className="text-foreground">{data.bucketStats.unassignedHours}h</strong> of scheduled work without Life Buckets. Assigning buckets to your goals and habits gives you full clarity on where your life energy goes.
            </div>
          )}
        </div>
      </Panel>

    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-glass border border-border p-2 sm:p-3 text-center">
    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</p>
    <p className="text-base sm:text-lg font-black text-foreground">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{sub}</p>}
  </div>
);
