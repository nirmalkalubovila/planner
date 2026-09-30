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
    color: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    badgeClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  },
  asset: {
    color: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-500/10',
    borderClass: 'border-fuchsia-500/20',
    badgeClass: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
  },
  recovery: {
    color: 'text-teal-400',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/20',
    badgeClass: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  },
  relational: {
    color: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
    badgeClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
};
