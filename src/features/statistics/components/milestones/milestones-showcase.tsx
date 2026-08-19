import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Sparkles, 
  Flame, 
  Zap, 
  Award, 
  Crown, 
  Shield, 
  Lock, 
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  MILESTONE_STAGES, 
  type MilestoneStage, 
  type MilestoneProgress 
} from '@/utils/milestone-engine';
import { StageCelebrationModal } from './stage-celebration-modal';

interface MilestonesShowcaseProps {
  progress: MilestoneProgress;
  onShareMilestone?: (stage: MilestoneStage) => void;
}

const ICON_MAP = {
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,
  award: Award,
  trophy: Award,
  shield: Shield,
  crown: Crown,
};

const SHORT_TITLES: Record<number, string> = {
  1: 'Spark',
  2: 'Momentum',
  3: 'Habit Lock',
  4: 'Mastery',
  5: 'Unstoppable',
  6: 'Architect',
  7: 'Century',
};

export const MilestonesShowcase: React.FC<MilestonesShowcaseProps> = ({
  progress,
  onShareMilestone,
}) => {
  const [selectedReplayStage, setSelectedReplayStage] = useState<MilestoneStage | null>(null);

  const { totalDaysExecuted, longestStreak, currentStreak, nextStage, progressToNext } = progress;
  const highestStreak = Math.max(currentStreak, longestStreak, totalDaysExecuted);

  return (
    <div className="bg-card/60 border border-border rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-3.5">
      {/* Clean Single-Line Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
            Consistency Milestones
          </h3>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Calendar size={12} className="text-primary" />
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-xs font-mono font-bold text-foreground">
            {totalDaysExecuted} Total Days
          </span>
        </div>

        {/* Next Stage Target */}
        {nextStage && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-[10px] uppercase tracking-wider font-black text-muted-foreground">
            <span>Next: Stage {nextStage.stageNumber} ({SHORT_TITLES[nextStage.stageNumber]})</span>
            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <span className="text-primary font-mono">{progressToNext}%</span>
          </div>
        )}
      </div>

      {/* 7-Stage Milestone Progression Line */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none sm:grid sm:grid-cols-7">
        {MILESTONE_STAGES.map((stage, idx) => {
          const isUnlocked = highestStreak >= stage.days;
          const isCurrentTarget = nextStage?.id === stage.id;
          const StageIcon = ICON_MAP[stage.iconName] || Award;
          const shortTitle = SHORT_TITLES[stage.stageNumber] || stage.title;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={() => isUnlocked && setSelectedReplayStage(stage)}
              className={cn(
                'min-w-[100px] sm:min-w-0 flex-1 flex flex-col items-center justify-between text-center rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 group relative select-none',
                isUnlocked
                  ? 'bg-card/90 border-white/10 hover:border-primary/40 hover:bg-card shadow-sm cursor-pointer'
                  : isCurrentTarget
                  ? 'bg-card/40 border-primary/30 ring-1 ring-primary/20 shadow-sm'
                  : 'bg-card/20 border-border/30 opacity-40'
              )}
            >
              {/* Icon Node */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border transition-all',
                  isUnlocked
                    ? 'bg-primary/15 text-primary border-primary/40 group-hover:scale-105'
                    : isCurrentTarget
                    ? 'bg-muted text-foreground border-border'
                    : 'bg-muted/30 text-muted-foreground/40 border-border/20'
                )}
              >
                {isUnlocked ? (
                  <StageIcon size={14} className="text-primary" />
                ) : (
                  <Lock size={12} />
                )}
              </div>

              {/* Days & Short Title */}
              <div className="my-1.5 space-y-0.5 w-full">
                <span className="text-xs sm:text-sm font-black font-mono text-foreground block leading-tight">
                  {stage.days}d
                </span>
                <span className="text-[10px] font-bold text-muted-foreground block truncate">
                  {shortTitle}
                </span>
              </div>

              {/* Status Badge */}
              <div className="w-full pt-1 border-t border-border/30 flex items-center justify-center">
                {isUnlocked ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-0.5">
                    <Check size={10} /> Unlocked
                  </span>
                ) : isCurrentTarget ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary font-mono">
                    {progressToNext}%
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground/40">
                    Locked
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Replay Celebration Modal */}
      {selectedReplayStage && (
        <StageCelebrationModal
          stage={selectedReplayStage}
          isOpen={true}
          onClose={() => setSelectedReplayStage(null)}
          onShare={onShareMilestone}
          isReplay={true}
        />
      )}
    </div>
  );
};

