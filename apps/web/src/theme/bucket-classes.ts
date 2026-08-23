import type { LifeBucket } from '@llb/core';

// Tailwind presentation for each life bucket. This is web-only styling
// paired with @llb/core's BUCKET_META (label/description, meaning only)
// and BUCKET_TONE (raw color, for non-Tailwind consumers). These are the
// exact class strings BUCKET_META used to carry directly — moved here so
// @llb/core stays framework-agnostic, with zero visual change on web.
export interface BucketClasses {
  color: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}

export const BUCKET_CLASSES: Record<LifeBucket, BucketClasses> = {
  income: {
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  asset: {
    color: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/20',
    badgeClass: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
  recovery: {
    color: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    badgeClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  },
  relational: {
    color: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
};
