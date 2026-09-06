import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Award, Calendar, Crown, Flame, Lock, Shield, Sparkles, Check, Zap } from 'lucide-react-native';
import { MILESTONE_STAGES, type MilestoneProgress, type MilestoneStage } from '@/lib/milestone-celebration';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { StageCelebrationModal } from './stage-celebration-modal';

interface MilestonesShowcaseProps {
  progress: MilestoneProgress;
  onShareMilestone?: (stage: MilestoneStage) => void;
}

const ICON_MAP: Record<MilestoneStage['iconName'], React.ComponentType<{ size?: number; color?: string }>> = {
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

export const MilestonesShowcase: React.FC<MilestonesShowcaseProps> = ({ progress, onShareMilestone }) => {
  const [selectedReplayStage, setSelectedReplayStage] = useState<MilestoneStage | null>(null);
  const { totalDaysExecuted, longestStreak, currentStreak, nextStage, progressToNext } = progress;
  const highestStreak = Math.max(currentStreak, longestStreak, totalDaysExecuted);

  return (
    <View className="bg-card/60 border border-border rounded-3xl p-4 gap-3.5">
      <View className="gap-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-xs font-black uppercase tracking-widest text-foreground">Consistency Milestones</Text>
          <Text className="text-muted-foreground/40">•</Text>
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color="#a1a1aa" />
            <Text variant="tiny" className="font-bold">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <Text className="text-muted-foreground/40">•</Text>
          <Text variant="tiny" className="font-mono font-bold">
            {totalDaysExecuted} Total Days
          </Text>
        </View>

        {!!nextStage && (
          <View className="flex-row items-center gap-2">
            <Text variant="tiny" className="uppercase font-black">
              Next: Stage {nextStage.stageNumber} ({SHORT_TITLES[nextStage.stageNumber]})
            </Text>
            <View className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${progressToNext}%` }} />
            </View>
            <Text variant="tiny" className="text-primary font-mono">
              {progressToNext}%
            </Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2 pb-1">
        {MILESTONE_STAGES.map((stage) => {
          const isUnlocked = highestStreak >= stage.days;
          const isCurrentTarget = nextStage?.id === stage.id;
          const StageIcon = ICON_MAP[stage.iconName] || Award;
          const shortTitle = SHORT_TITLES[stage.stageNumber] || stage.title;

          return (
            <Pressable
              key={stage.id}
              onPress={() => isUnlocked && setSelectedReplayStage(stage)}
              className={cn(
                'w-[100px] items-center justify-between rounded-2xl p-2.5 border',
                isUnlocked
                  ? 'bg-card/90 border-white/10'
                  : isCurrentTarget
                    ? 'bg-card/40 border-primary/30'
                    : 'bg-card/20 border-border/30 opacity-40'
              )}
            >
              <View
                className={cn(
                  'w-8 h-8 rounded-full items-center justify-center border',
                  isUnlocked ? 'bg-primary/15 border-primary/40' : isCurrentTarget ? 'bg-muted border-border' : 'bg-muted/30 border-border/20'
                )}
              >
                {isUnlocked ? <StageIcon size={14} color="#818cf8" /> : <Lock size={12} color="#71717a" />}
              </View>

              <View className="my-1.5 items-center gap-0.5 w-full">
                <Text className="text-sm font-black font-mono text-foreground text-center">{stage.days}d</Text>
                <Text variant="tiny" className="font-bold text-center" numberOfLines={1}>
                  {shortTitle}
                </Text>
              </View>

              <View className="w-full pt-1 border-t border-border/30 items-center">
                {isUnlocked ? (
                  <View className="flex-row items-center gap-0.5">
                    <Check size={10} color="#34d399" />
                    <Text variant="tiny" className="text-emerald-400 font-black uppercase">
                      Unlocked
                    </Text>
                  </View>
                ) : isCurrentTarget ? (
                  <Text variant="tiny" className="text-primary font-black font-mono">
                    {progressToNext}%
                  </Text>
                ) : (
                  <Text variant="tiny" className="font-bold">
                    Locked
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <StageCelebrationModal
        stage={selectedReplayStage}
        isOpen={!!selectedReplayStage}
        onClose={() => setSelectedReplayStage(null)}
        onShare={onShareMilestone}
        isReplay
      />
    </View>
  );
};
