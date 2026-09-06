import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Percent, Target, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StatsCalculationsPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="flex flex-col w-full max-w-[1000px] mx-auto px-4 py-8 sm:py-12 space-y-8 pb-20 select-none">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/statistics')}
            variant="ghost"
            size="icon"
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

      {/* Intro Note explaining 100% execution specific doubt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card/40 backdrop-blur-md p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Understanding Your Performance</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our analytics engine runs an aggregate assessment of your planned goals, habits, and execution schedules to compute an accurate reading of your daily momentum. Read below to understand how each metric is calculated.
        </p>

        {/* Highlighted explanation on 100% Week Execution */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl border border-intent-warning/20 bg-intent-warning/5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-intent-warning flex items-center gap-2">
            <Zap size={14} className="animate-pulse" /> Why can Week Execution show 100%?
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Week Execution represents the efficiency ratio of completed tasks relative to planned tasks. 
            If you set out to execute <span className="font-semibold text-foreground">5 planned tasks</span> in your planner grid and mark <span className="font-semibold text-foreground">5 or more completed</span> on the Today page, your efficiency reaches <span className="font-bold text-intent-warning">100%</span>. 
            Execution tracks your consistency in accomplishing what you plan, and is capped at 100% to reflect optimal focus without rewarding over-scheduling.
          </p>
        </div>
      </motion.div>

      {/* Grid of Calculations */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Card 1: Life Trajectory Score */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-foreground">
                <Activity size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Life Trajectory Score</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your overall score is a weighted index representing the health of your long-term vision, short-term habits, and immediate task execution.
            </p>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Weighted Formula</span>
              <div className="flex flex-col gap-1.5 text-xs font-mono font-bold text-foreground">
                <div className="flex justify-between items-center text-intent-goal">
                  <span>Goal Progress (40% Weight)</span>
                  <span>Score × 0.40</span>
                </div>
                <div className="flex justify-between items-center text-intent-habit">
                  <span>Habit Strength (35% Weight)</span>
                  <span>Score × 0.35</span>
                </div>
                <div className="flex justify-between items-center text-intent-warning">
                  <span>Week Execution (25% Weight)</span>
                  <span>Score × 0.25</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Goal Progress */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-intent-goal/10 border border-intent-goal/20 text-intent-goal">
                <Target size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Goal Progress</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Measures completion rates of active goals based on their milestones, scaled by your velocity relative to your target end date.
            </p>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Formula & Components</span>
              <div className="text-xs font-mono text-foreground space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold">Base Progress:</span>
                  <span className="text-muted-foreground">(Done / Total Milestones) × 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Time Velocity:</span>
                  <span className="text-muted-foreground">Progress % vs Elapsed Time %</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                  <span>Weighted Score:</span>
                  <span className="text-intent-goal">Base % × Velocity Multiplier</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Habit Strength */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-intent-habit/10 border border-intent-habit/20 text-intent-habit">
                <Percent size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Habit Strength</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Consistency is calculated over a rolling 30-day window, tracking completed repetitions specifically on the days of the week scheduled.
            </p>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Consistency Formula</span>
              <div className="flex justify-between items-center text-xs font-mono font-bold text-foreground">
                <span>Habit Consistency</span>
                <span className="text-intent-habit">(Active Days / Expected Days) × 100</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal mt-1.5">
                * Expected days only count dates within the 30-day window where the habit was explicitly scheduled.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Week Execution */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-intent-warning/10 border border-intent-warning/20 text-intent-warning">
                <Zap size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Week Execution</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Evaluates how well you execute your schedule by comparing the actual completed tasks vs. the unique planned blocks.
            </p>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Efficiency Formula</span>
              <div className="flex justify-between items-center text-xs font-mono font-bold text-foreground">
                <span>Weekly Efficiency</span>
                <span className="text-intent-warning">(Completed / Unique Planned) × 100</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal mt-1.5">
                * Planned blocks represent unique goals or custom task sessions on the planner grid, grouping consecutive slots together. Capped at 100%.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
