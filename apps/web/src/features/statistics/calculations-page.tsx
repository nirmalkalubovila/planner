import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  BUCKET_FULL_SCORE_SHARE,
  GOAL_VELOCITY_CAP,
  HABIT_WINDOW_DAYS,
  LIFE_TRAJECTORY_WEIGHTS,
  MILESTONE_STAGES,
  TOTAL_WEEK_HOURS,
} from '@llb/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Every number below comes from the same constants the analytics engine uses, so this guide cannot drift from the app.
const pct = (n: number) => `${Math.round(n * 100)}%`;
const FULL_BUCKET_HOURS = Math.round(TOTAL_WEEK_HOURS * BUCKET_FULL_SCORE_SHARE);
const STAGE_DAYS = MILESTONE_STAGES.map((s) => s.days);

interface Accent {
  text: string;
  tile: string;
}

const ACCENTS = {
  primary: { text: 'text-primary', tile: 'bg-primary/10 border-primary/20 text-primary' },
  goal: { text: 'text-intent-goal', tile: 'bg-intent-goal/10 border-intent-goal/20 text-intent-goal' },
  habit: { text: 'text-intent-habit', tile: 'bg-intent-habit/10 border-intent-habit/20 text-intent-habit' },
  warning: { text: 'text-intent-warning', tile: 'bg-intent-warning/10 border-intent-warning/20 text-intent-warning' },
} satisfies Record<string, Accent>;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

interface Row {
  label: string;
  value: React.ReactNode;
  /** Colours the value with the card's accent (used for the final result of a formula). */
  result?: boolean;
}

interface CardProps {
  num: string;
  title: string;
  summary: string;
  accent: Accent;
  formulaTitle: string;
  rows: Row[];
  note?: string;
}

const CalcCard: React.FC<CardProps> = ({ num, title, summary, accent, formulaTitle, rows, note }) => (
  <motion.div variants={itemVariants} className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 flex flex-col">
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border font-mono text-xs font-bold', accent.tile)}>
          {num}
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{summary}</p>
      <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{formulaTitle}</span>
        <dl className="text-xs space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="font-mono font-bold text-foreground shrink-0">{r.label}</dt>
              <dd className={cn('font-mono sm:text-right', r.result ? cn('font-bold', accent.text) : 'text-muted-foreground')}>{r.value}</dd>
            </div>
          ))}
        </dl>
        {note && <p className="text-[10px] text-muted-foreground leading-normal pt-1.5 border-t border-border">{note}</p>}
      </div>
    </div>
  </motion.div>
);

export const StatsCalculationsPage: React.FC = () => {
  const navigate = useNavigate();
  const w = LIFE_TRAJECTORY_WEIGHTS;

  return (
    <div className="flex flex-col w-full max-w-[1000px] mx-auto px-4 py-8 sm:py-12 space-y-8 pb-20 select-none">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/statistics')}
            variant="ghost"
            size="icon"
            aria-label="Back to statistics"
            className="rounded-full h-9 w-9 bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground leading-none">Calculations Guide</h2>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mt-1.5 tracking-tight">How Your Analytics Work</h1>
          </div>
        </div>
      </div>

      {/* Intro, with the question people ask most */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card/40 backdrop-blur-md p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Understanding Your Performance</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every score is built from what you plan and what you tick off on Today. Nothing is estimated. Here is exactly how each one is worked out.
        </p>

        <div className="mt-6 p-4 sm:p-5 rounded-2xl border border-intent-warning/20 bg-intent-warning/5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-intent-warning">Why can Week Execution show 100%?</h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Week Execution is the blocks you tick in a week divided by the unique blocks planned in your grid. Plan{' '}
            <span className="font-semibold text-foreground">5 blocks</span> and tick{' '}
            <span className="font-semibold text-foreground">5 or more</span>, and it reads{' '}
            <span className="font-bold text-intent-warning">100%</span>. Every tick counts, habits included, and the score is capped at 100%, so extra ticks never push it higher.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <CalcCard
          num="01"
          title="Life Trajectory Score"
          accent={ACCENTS.primary}
          summary="One score for the health of your goals, habits, execution and balance."
          formulaTitle="Weighted formula"
          rows={[
            { label: `Goal Progress (${pct(w.goal)})`, value: `Average × ${w.goal.toFixed(2)}` },
            { label: `Habit Strength (${pct(w.habit)})`, value: `Average × ${w.habit.toFixed(2)}` },
            { label: `Week Execution (${pct(w.execution)})`, value: `Average × ${w.execution.toFixed(2)}` },
            { label: `Life Balance (${pct(w.balance)})`, value: `Score × ${w.balance.toFixed(2)}` },
            { label: 'Trajectory', value: 'Sum of the four, rounded', result: true },
          ]}
          note="Each part is capped at 100 before it is weighted."
        />

        <CalcCard
          num="02"
          title="Goal Progress"
          accent={ACCENTS.goal}
          summary="How far along a goal is, measured against its own timeline."
          formulaTitle="Formula & components"
          rows={[
            { label: 'Progress', value: '(Days passed ÷ Total days) × 100', result: true },
            { label: 'Total days', value: 'Start date to end date' },
            { label: 'Milestones', value: 'Reached when marked done, or when progress passes their point on the line' },
            { label: 'Velocity', value: `Milestones reached ÷ Time elapsed, capped at ${GOAL_VELOCITY_CAP}×` },
          ]}
          note="With goal blocks in this week's plan, days passed run to the start of this week plus 7 days × the share of those blocks you completed. Without any, it is the days passed so far. So a new long goal starts near 0% and climbs steadily."
        />

        <CalcCard
          num="03"
          title="Habit Strength"
          accent={ACCENTS.habit}
          summary={`Consistency over a rolling ${HABIT_WINDOW_DAYS}-day window, on the days each habit is scheduled.`}
          formulaTitle="Consistency formula"
          rows={[
            { label: 'Consistency', value: '(Days done ÷ Scheduled days) × 100', result: true },
            { label: 'Scheduled days', value: `Days in the last ${HABIT_WINDOW_DAYS} that match the habit's weekdays` },
            { label: 'Days done', value: 'The habit was ticked on Today' },
            { label: 'Longest streak', value: 'Most scheduled days in a row that were done' },
          ]}
          note="The overall Habit Strength is the average across all your habits."
        />

        <CalcCard
          num="04"
          title="Week Execution"
          accent={ACCENTS.warning}
          summary="How much of what you planned you actually did."
          formulaTitle="Efficiency formula"
          rows={[
            { label: 'Efficiency', value: '(Ticked ÷ Unique planned) × 100', result: true },
            { label: 'Unique planned', value: 'Each unbroken run of the same task on a day counts once' },
            { label: 'Ticked', value: 'Every block you tick on Today that week' },
            { label: 'Overall', value: 'Average of every week that has planned blocks' },
          ]}
          note="Capped at 100%."
        />

        <CalcCard
          num="05"
          title="Life Balance"
          accent={ACCENTS.primary}
          summary="Whether your week is spread across income, assets, recovery and relationships."
          formulaTitle="Balance formula"
          rows={[
            { label: 'Bucket score', value: `(Bucket hours ÷ ${FULL_BUCKET_HOURS}h) × 10, up to 10` },
            { label: 'Balance', value: 'Average of the four bucket scores × 10', result: true },
            { label: 'Hours', value: "This week's plan, grouped by life bucket" },
          ]}
          note={`${FULL_BUCKET_HOURS}h is ${pct(BUCKET_FULL_SCORE_SHARE)} of the ${TOTAL_WEEK_HOURS}-hour week. Sleep and your planning session count as Recovery. Tasks with no bucket are left out and shown as unassigned.`}
        />

        <CalcCard
          num="06"
          title="Streaks & Milestones"
          accent={ACCENTS.warning}
          summary="Consistency over time. A day counts when you tick at least one block."
          formulaTitle="How stages unlock"
          rows={[
            { label: 'Current streak', value: 'Days in a row up to today, or up to yesterday while today is still open' },
            { label: 'Longest streak', value: 'Your best run of days in a row' },
            { label: 'Stages', value: `${STAGE_DAYS.slice(0, -1).join(', ')} and ${STAGE_DAYS[STAGE_DAYS.length - 1]} days`, result: true },
          ]}
          note="You qualify with the highest of your current streak, longest streak and total days executed."
        />
      </motion.div>
    </div>
  );
};
