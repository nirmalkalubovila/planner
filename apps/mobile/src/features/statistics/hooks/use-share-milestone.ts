import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { toast, type MilestoneStage } from '@llb/core';

interface ShareTarget {
  stage: MilestoneStage;
  totalDaysExecuted: number;
  currentStreak: number;
}

/** Captures the off-screen <MilestoneShareCard/> and hands it to the native
 * share sheet together with a caption — matching web's
 * `shareToSocial(blob, "I reached ${stage.title} (${stage.days} days
 * consistent) on Legacy Life Builder!")`. expo-sharing (used in an earlier
 * pass) has no message/text field at all — it can only hand off a bare
 * file — which is exactly why the caption was silently missing.
 * react-native-share's `Share.open` accepts a local file `url` and a
 * `message` together in one native share sheet call, the same combined
 * image+text share every social app expects. */
export function useShareMilestone() {
  const cardRef = useRef<View>(null);
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const [sharing, setSharing] = useState(false);

  const shareMilestone = (stage: MilestoneStage, totalDaysExecuted: number, currentStreak: number) => {
    setTarget({ stage, totalDaysExecuted, currentStreak });
  };

  // Called once the off-screen card has mounted with the new target (see
  // the timeout wiring in the component that renders <MilestoneShareCard/>).
  // useCallback so its identity only changes with `target`/`sharing`: the
  // caller schedules this on a timeout from an effect, and an identity that
  // changed every render would keep cancelling and rescheduling that
  // timeout instead of ever letting it fire.
  const captureAndShare = useCallback(async () => {
    if (!cardRef.current || !target || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const message = `I reached ${target.stage.title} (${target.stage.days} days consistent) on Legacy Life Builder!`;
      await Share.open({ url: uri, message, type: 'image/png', failOnCancel: false });
    } catch (err: any) {
      // react-native-share rejects on user-cancel even with failOnCancel:false
      // in some OS share-sheet flows — don't surface that as an error.
      if (err?.message !== 'User did not share') {
        toast.error(err?.message || 'Could not generate the share card.');
      }
    } finally {
      setSharing(false);
      setTarget(null);
    }
  }, [target, sharing]);

  return { cardRef, target, sharing, shareMilestone, captureAndShare };
}
