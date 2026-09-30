import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { useDetailedAnalytics } from '@/features/statistics/hooks/use-detailed-stats';
import { 
  getPendingMilestoneToCelebrate, 
  type MilestoneStage 
} from '@/utils/milestone-engine';
import { StageCelebrationModal } from '@/features/statistics/components/milestones/stage-celebration-modal';
import { useReportActions } from '@/features/statistics/hooks/use-report-actions';
import { LegacyInsightPopup } from '@/features/insights/legacy-insight-popup';

export const StageCelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
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

  const { downloadPdf, shareImage } = useReportActions(profile?.fullName, detailed);

  return (
    <>
      {children}

      <LegacyInsightPopup
        suppress={!!celebratingStage}
        ready={!!detailed}
        consistent={(detailed?.milestoneProgress?.currentStreak ?? 0) >= 7}
      />

      {celebratingStage && (
        <StageCelebrationModal
          stage={celebratingStage}
          isOpen={true}
          onClose={() => setCelebratingStage(null)}
          onDownloadReport={downloadPdf}
          onShareImage={shareImage}
        />
      )}
    </>
  );
};
