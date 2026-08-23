// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/utils/insights-engine` imports keep working unchanged.
export {
  extractCustomTasksFromPlans,
  type InsightCardData,
  generateWeeklyInsights,
  generateMonthlyInsights,
  type SystemWin,
  generateWeeklyWins,
  generateMonthlyWins,
  generateMilestoneInsightCard,
} from '@llb/core';
