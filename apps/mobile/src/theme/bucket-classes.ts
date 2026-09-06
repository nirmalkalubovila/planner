import type { LifeBucket } from '@llb/core';

// Mobile's own presentation for each life bucket — mirrors
// apps/web/src/theme/bucket-classes.ts exactly (same Tailwind color
// families, same shades) so both apps read as the same brand. Paired with
// @llb/core's BUCKET_META (label/description) and @llb/tokens' BUCKET_TONE
// (raw hex, for non-NativeWind consumers like a future share-card render).
export interface BucketClasses {
  color: string;
  badgeClass: string;
}

export const BUCKET_CLASSES: Record<LifeBucket, BucketClasses> = {
  income: {
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  asset: {
    color: 'text-violet-400',
    badgeClass: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
  recovery: {
    color: 'text-sky-400',
    badgeClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  },
  relational: {
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
};
