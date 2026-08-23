// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/utils/bucket-engine` imports keep working unchanged.
export {
  TOTAL_WEEK_HOURS,
  type BucketStats,
  type WeeklyBucketHistory,
  resolveSlotBucket,
  calculateWeekBucketHours,
  detectEmptyBucketStreaks,
  calculateBucketBalanceScores,
} from '@llb/core';
