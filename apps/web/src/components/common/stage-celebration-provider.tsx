import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDetailedAnalytics } from '@/features/statistics/hooks/use-detailed-stats';
import { 
  getPendingMilestoneToCelebrate, 
  type MilestoneStage 
} from '@/utils/milestone-engine';
import { StageCelebrationModal } from '@/features/statistics/components/milestones/stage-celebration-modal';
import { generateMilestoneInsightCard } from '@/utils/insights-engine';
import { INSIGHT_THEMES } from '@/features/statistics/components/insights/insight-themes';
import { renderShareCardToCanvas } from '@/features/statistics/components/insights/share-card-renderer';
import { shareToSocial, downloadShareImage, copyToClipboard } from '@/utils/share-utils';
import { toast } from 'sonner';

export const StageCelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: detailed } = useDetailedAnalytics(!!user?.id);
  const [celebratingStage, setCelebratingStage] = useState<MilestoneStage | null>(null);

  // Automatically check if user unlocked a new milestone that hasn't been celebrated
  useEffect(() => {
    if (!user?.id || !detailed?.completedMap) return;

    const pending = getPendingMilestoneToCelebrate(detailed.completedMap, user.id);
    if (pending && !celebratingStage) {
      // Small timeout for smooth entry
      const timer = setTimeout(() => {
        setCelebratingStage(pending);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, detailed?.completedMap, celebratingStage]);

  const handleShare = async (stage: MilestoneStage) => {
    try {
      const totalDays = detailed?.milestoneProgress?.totalDaysExecuted ?? 0;
      const streak = detailed?.milestoneProgress?.currentStreak ?? 0;
      const cardData = generateMilestoneInsightCard(stage, totalDays, streak);
      const theme = INSIGHT_THEMES[3]; // Midnight Gold
      const blob = await renderShareCardToCanvas(cardData, theme, 'story');
      const shared = await shareToSocial(blob, `I just reached ${stage.title} (${stage.days} days consistent) on Legacy Life Builder!`);
      
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
    <>
      {children}

      {celebratingStage && (
        <StageCelebrationModal
          stage={celebratingStage}
          isOpen={true}
          onClose={() => setCelebratingStage(null)}
          onShare={handleShare}
        />
      )}
    </>
  );
};
