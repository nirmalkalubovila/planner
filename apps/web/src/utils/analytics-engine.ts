// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/utils/analytics-engine` imports keep working unchanged.
export {
  type GoalAnalysis,
  type HabitAnalysis,
  type WeekExecution,
  type LifeTrajectoryScore,
  calculateGoalProgress,
  analyzeGoal,
  analyzeAllGoals,
  analyzeHabit,
  analyzeAllHabits,
  getWeekKeyFromDisplay,
  analyzeWeekExecution,
  analyzeAllWeeks,
  computeLifeTrajectory,
} from '@llb/core';
