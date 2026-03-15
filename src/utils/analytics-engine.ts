import type { Goal, Habit, Milestone } from '@/types/global-types';
import type { GridState } from '@/types/planner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalAnalysis {
  id: string;
  name: string;
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  velocityMultiplier: number;
  projectedCompletion: string;
  weightedScore: number;
}

export interface HabitAnalysis {
  id: string;
  name: string;
  consistency: number;
  longestStreak: number;
  activeDays: number;
  totalExpectedDays: number;
}

export interface WeekExecution {
  weekKey: string;
  planned: number;
  completed: number;
  efficiency: number;
}

export interface LifeTrajectoryScore {
  total: number;
  goalScore: number;
  habitScore: number;
  executionScore: number;
}

// ---------------------------------------------------------------------------
// Goal helpers
// ---------------------------------------------------------------------------

function computeVelocityMultiplier(goal: Goal): number {
  if (!goal.endDate) return 1;
  const now = Date.now();
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.endDate).getTime();
  if (end <= start) return 1;

  const elapsed = Math.max(0, now - start);
  const total = end - start;
  const timeRatio = elapsed / total;

  const milestones = goal.milestones ?? [];
  const done = milestones.filter(m => m.completed).length;
  const progressRatio = milestones.length > 0 ? done / milestones.length : 0;

  if (timeRatio === 0) return 1;
  const velocity = progressRatio / timeRatio;
  return Math.min(velocity, 2);
}

export function analyzeGoal(goal: Goal): GoalAnalysis {
  const milestones = goal.milestones ?? [];
  const done = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;
  const velocity = computeVelocityMultiplier(goal);

  return {
    id: goal.id ?? '',
    name: goal.name,
    progress,
    completedMilestones: done,
    totalMilestones: milestones.length,
    velocityMultiplier: Math.round(velocity * 100) / 100,
    projectedCompletion: goal.endDate
      ? new Date(goal.endDate).toLocaleDateString()
      : 'TBD',
    weightedScore: milestones.length > 0
      ? (done / milestones.length) * velocity * 100
      : 0,
  };
}

export function analyzeAllGoals(goals: Goal[]): {
  analyses: GoalAnalysis[];
  average: number;
  best: GoalAnalysis | null;
} {
  const analyses = goals.map(analyzeGoal);
  const average =
    analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.weightedScore, 0) / analyses.length)
      : 0;
  const best = analyses.length > 0
    ? analyses.reduce((a, b) => (a.weightedScore >= b.weightedScore ? a : b))
    : null;
  return { analyses, average, best };
}

// ---------------------------------------------------------------------------
// Habit helpers
// ---------------------------------------------------------------------------

function computeHabitConsistency(
  habit: Habit,
  completedMap: Record<string, string[]>,
): { consistency: number; longestStreak: number; activeDays: number; totalExpectedDays: number } {
  const daysOfWeek = habit.daysOfWeek ?? [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  const dayNameToIndex: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const activeDayIndices = new Set(daysOfWeek.map(d => dayNameToIndex[d]).filter(v => v !== undefined));

  const today = new Date();
  const windowDays = 30;
  let expectedDays = 0;
  let completedDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  const habitId = habit.id ?? '';

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dayOfWeek = d.getDay();
    if (!activeDayIndices.has(dayOfWeek)) continue;

    expectedDays++;
    const dateStr = d.toISOString().split('T')[0];
    const dayTasks = completedMap[dateStr] ?? [];
    const wasCompleted = dayTasks.includes(habitId) || dayTasks.includes(`habit-${habitId}`);

    if (wasCompleted) {
      completedDays++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const consistency = expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;

  return { consistency, longestStreak, activeDays: completedDays, totalExpectedDays: expectedDays };
}

export function analyzeHabit(
  habit: Habit,
  completedMap: Record<string, string[]>,
): HabitAnalysis {
  const { consistency, longestStreak, activeDays, totalExpectedDays } = computeHabitConsistency(habit, completedMap);
  return {
    id: habit.id ?? '',
    name: habit.name,
    consistency,
    longestStreak,
    activeDays,
    totalExpectedDays,
  };
}

export function analyzeAllHabits(
  habits: Habit[],
  completedMap: Record<string, string[]>,
): {
  analyses: HabitAnalysis[];
  average: number;
  best: HabitAnalysis | null;
} {
  const analyses = habits.map(h => analyzeHabit(h, completedMap));
  const average =
    analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.consistency, 0) / analyses.length)
      : 0;
  const best = analyses.length > 0
    ? analyses.reduce((a, b) => (a.consistency >= b.consistency ? a : b))
    : null;
  return { analyses, average, best };
}

// ---------------------------------------------------------------------------
// Execution / week plan helpers
// ---------------------------------------------------------------------------

export function analyzeWeekExecution(
  weekKey: string,
  state: GridState,
  completedMap: Record<string, string[]>,
): WeekExecution {
  const planned = Object.keys(state).length;

  let completed = 0;
  for (const taskIds of Object.values(completedMap)) {
    completed += taskIds.length;
  }

  const efficiency = planned > 0 ? Math.round((completed / planned) * 100) : 0;
  return { weekKey, planned, completed, efficiency: Math.min(efficiency, 100) };
}

export function analyzeAllWeeks(
  weekPlans: { week: string; state: GridState }[],
  completedMap: Record<string, string[]>,
): {
  weeks: WeekExecution[];
  average: number;
  best: WeekExecution | null;
} {
  const weeks = weekPlans.map(wp => analyzeWeekExecution(wp.week, wp.state, completedMap));
  const withPlanned = weeks.filter(w => w.planned > 0);
  const average =
    withPlanned.length > 0
      ? Math.round(withPlanned.reduce((s, w) => s + w.efficiency, 0) / withPlanned.length)
      : 0;
  const best = withPlanned.length > 0
    ? withPlanned.reduce((a, b) => (a.efficiency >= b.efficiency ? a : b))
    : null;
  return { weeks, average, best };
}

// ---------------------------------------------------------------------------
// Ultimate Life Trajectory Score
// ---------------------------------------------------------------------------

const GOAL_WEIGHT = 0.40;
const HABIT_WEIGHT = 0.35;
const EXECUTION_WEIGHT = 0.25;

export function computeLifeTrajectory(
  goalAvg: number,
  habitAvg: number,
  executionAvg: number,
): LifeTrajectoryScore {
  const goalScore = Math.min(goalAvg, 100) * GOAL_WEIGHT;
  const habitScore = Math.min(habitAvg, 100) * HABIT_WEIGHT;
  const executionScore = Math.min(executionAvg, 100) * EXECUTION_WEIGHT;
  const total = Math.round(goalScore + habitScore + executionScore);

  return { total, goalScore: Math.round(goalScore), habitScore: Math.round(habitScore), executionScore: Math.round(executionScore) };
}
