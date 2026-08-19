import { WeekUtils } from '@/utils/week';

export interface MilestoneStage {
  id: string;
  stageNumber: number;
  days: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: 'sparkles' | 'flame' | 'zap' | 'trophy' | 'crown' | 'award' | 'shield';
  accentColor: string; // Tailwind-compatible or subtle glow color
}

export const MILESTONE_STAGES: MilestoneStage[] = [
  {
    id: 'stage-7d',
    stageNumber: 1,
    days: 7,
    title: 'The Spark of Consistency',
    subtitle: '7-Day Consistent Streak',
    description: 'You have shown up and executed for 7 consecutive days. The spark of discipline is ignited.',
    iconName: 'sparkles',
    accentColor: '#f59e0b', // Amber / Gold
  },
  {
    id: 'stage-15d',
    stageNumber: 2,
    days: 15,
    title: 'The Momentum Accelerator',
    subtitle: '15-Day Consistent Streak',
    description: 'Two weeks of unbroken execution. Daily action is no longer effortful; it has become momentum.',
    iconName: 'flame',
    accentColor: '#f97316', // Warm Amber-Orange
  },
  {
    id: 'stage-30d',
    stageNumber: 3,
    days: 30,
    title: 'The Habit Lock',
    subtitle: '30-Day Consistent Streak (1 Month)',
    description: '30 continuous days of execution. Your habits have transformed from routines into your true identity.',
    iconName: 'zap',
    accentColor: '#eab308', // Gold
  },
  {
    id: 'stage-60d',
    stageNumber: 4,
    days: 60,
    title: 'The Master Builder',
    subtitle: '60-Day Consistent Streak (2 Months)',
    description: 'Two full months of relentless execution. You are building systems that stand the test of time.',
    iconName: 'award',
    accentColor: '#10b981', // Emerald
  },
  {
    id: 'stage-90d',
    stageNumber: 5,
    days: 90,
    title: 'The Unstoppable Legacy',
    subtitle: '90-Day Consistent Streak (1 Quarter)',
    description: 'A full quarter of flawless execution. You have built an unstoppable trajectory of compounding excellence.',
    iconName: 'trophy',
    accentColor: '#8b5cf6', // Violet
  },
  {
    id: 'stage-180d',
    stageNumber: 6,
    days: 180,
    title: 'The Sovereign Architect',
    subtitle: '180-Day Consistent Streak (6 Months)',
    description: 'Half a year of mastery. Less than 1% of builders reach this pinnacle of personal discipline.',
    iconName: 'shield',
    accentColor: '#06b6d4', // Cyan
  },
  {
    id: 'stage-365d',
    stageNumber: 7,
    days: 365,
    title: 'The Monumental Century',
    subtitle: '365-Day Consistent Streak (1 Year)',
    description: 'One complete year of living your legacy. Your daily actions have become a monument to human excellence.',
    iconName: 'crown',
    accentColor: '#f59e0b', // Gold Crown
  },
];

export interface MilestoneProgress {
  totalDaysExecuted: number;
  currentStreak: number;
  longestStreak: number;
  currentStage: MilestoneStage | null;
  nextStage: MilestoneStage | null;
  progressToNext: number; // 0 - 100
  daysToNext: number;
  unlockedStages: MilestoneStage[];
}

/**
 * Computes total number of distinct days executed where at least 1 task was completed
 */
export function computeTotalDaysExecuted(completedMap: Record<string, string[]>): number {
  return Object.values(completedMap).filter(tasks => Array.isArray(tasks) && tasks.length > 0).length;
}

/**
 * Computes the current active streak and longest streak of consecutive days with executions
 */
export function computeStreakMetrics(completedMap: Record<string, string[]>): {
  currentStreak: number;
  longestStreak: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check up to past 400 days to calculate continuous streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streakStillActive = true;

  // First check if today has completed tasks
  const todayWeek = WeekUtils.getWeekFromDate(today);
  const todayDayNum = today.getDay() === 0 ? 7 : today.getDay();
  const todayDayStr = `${todayWeek}-${todayDayNum}`;
  const hasCompletedToday = (completedMap[todayDayStr]?.length ?? 0) > 0;

  // If today is not completed yet, streak can continue from yesterday
  const startOffset = hasCompletedToday ? 0 : 1;

  for (let i = startOffset; i < 400; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const weekKey = WeekUtils.getWeekFromDate(d);
    const dayNum = d.getDay() === 0 ? 7 : d.getDay();
    const dayStr = `${weekKey}-${dayNum}`;
    const completedCount = completedMap[dayStr]?.length ?? 0;

    if (completedCount > 0) {
      if (streakStillActive) {
        currentStreak++;
      }
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      streakStillActive = false;
      tempStreak = 0;
    }
  }

  // Also include today in longest streak if completed
  if (hasCompletedToday) {
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Computes full milestone stage analytics from user's completed tasks map
 */
export function computeMilestoneProgress(completedMap: Record<string, string[]>): MilestoneProgress {
  const totalDaysExecuted = computeTotalDaysExecuted(completedMap);
  const { currentStreak, longestStreak } = computeStreakMetrics(completedMap);

  // Use highest streak or total days executed benchmark (users can qualify by current or longest streak)
  const qualifyingDays = Math.max(currentStreak, longestStreak, totalDaysExecuted);

  const unlockedStages = MILESTONE_STAGES.filter(stage => qualifyingDays >= stage.days);
  const currentStage = unlockedStages.length > 0 ? unlockedStages[unlockedStages.length - 1] : null;
  const nextStage = MILESTONE_STAGES.find(stage => qualifyingDays < stage.days) || null;

  let progressToNext = 100;
  let daysToNext = 0;

  if (nextStage) {
    const prevDays = currentStage ? currentStage.days : 0;
    const targetRange = nextStage.days - prevDays;
    const progressIntoStage = Math.max(0, qualifyingDays - prevDays);
    progressToNext = Math.min(100, Math.round((progressIntoStage / targetRange) * 100));
    daysToNext = Math.max(0, nextStage.days - qualifyingDays);
  }

  return {
    totalDaysExecuted,
    currentStreak,
    longestStreak,
    currentStage,
    nextStage,
    progressToNext,
    daysToNext,
    unlockedStages,
  };
}

// ---------------------------------------------------------------------------
// LocalStorage celebration tracking helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'llb_celebrated_milestones_';

export function getCelebratedMilestoneIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
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
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(existing));
    }
  } catch {}
}

/**
 * Checks if there is any unlocked milestone that has not yet been celebrated by this user
 */
export function getPendingMilestoneToCelebrate(
  completedMap: Record<string, string[]>,
  userId: string
): MilestoneStage | null {
  const { unlockedStages } = computeMilestoneProgress(completedMap);
  if (unlockedStages.length === 0) return null;

  const celebrated = getCelebratedMilestoneIds(userId);
  // Find highest unlocked stage not yet celebrated
  for (let i = unlockedStages.length - 1; i >= 0; i--) {
    const stage = unlockedStages[i];
    if (!celebrated.includes(stage.id)) {
      return stage;
    }
  }
  return null;
}
