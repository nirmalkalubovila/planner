// Mirrors apps/web/src/utils/milestone-engine.ts's shim: the stage data and
// pure progress math live in @llb/core; only the "has this milestone been
// celebrated yet" tracking is platform-local (MMKV via the kv port here,
// localStorage there).
import { kv, computeMilestoneProgress, type MilestoneStage } from '@llb/core';

export {
  type MilestoneStage,
  type MilestoneProgress,
  MILESTONE_STAGES,
  computeTotalDaysExecuted,
  computeStreakMetrics,
  computeMilestoneProgress,
} from '@llb/core';

const STORAGE_KEY_PREFIX = 'llb_celebrated_milestones_';

export function getCelebratedMilestoneIds(userId: string): string[] {
  try {
    const raw = kv.persistent.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markMilestoneAsCelebrated(userId: string, milestoneId: string): void {
  try {
    const existing = getCelebratedMilestoneIds(userId);
    if (!existing.includes(milestoneId)) {
      existing.push(milestoneId);
      kv.persistent.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(existing));
    }
  } catch {
    /* ignore */
  }
}

export function getPendingMilestoneToCelebrate(
  completedMap: Record<string, string[]>,
  userId: string
): MilestoneStage | null {
  const { unlockedStages } = computeMilestoneProgress(completedMap);
  if (unlockedStages.length === 0) return null;

  const celebrated = getCelebratedMilestoneIds(userId);
  for (let i = unlockedStages.length - 1; i >= 0; i--) {
    const stage = unlockedStages[i];
    if (!celebrated.includes(stage.id)) return stage;
  }
  return null;
}
