// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/types/time` imports keep working unchanged.
//
// NOTE: BUCKET_META still embeds Tailwind class strings (bgClass,
// borderClass, badgeClass, color) inside @llb/core — that's a known
// Phase 3 cleanup (split into core meaning + @llb/tokens raw color +
// a per-app class map), not fixed here to keep this move behavior-neutral.
export {
  LIFE_BUCKETS,
  type LifeBucket,
  type BucketMeta,
  BUCKET_META,
  type WeeklyPriorityItem,
  type DailyOutcomeItem,
  type WeeklyBucketActionsData,
  type WeeklyBucketAction,
  type WeeklyBucketActions,
} from '@llb/core';
