export const LIFE_BUCKETS = ['income', 'asset', 'recovery', 'relational'] as const;
export type LifeBucket = typeof LIFE_BUCKETS[number];

export interface BucketMeta {
  label: string;
  description: string;
}

// Presentational fields (color/bgClass/borderClass/badgeClass Tailwind
// strings) moved to apps/web/src/theme/bucket-classes.ts — shared code
// must not embed web-only class strings. See also BUCKET_TONE below for
// the raw color each bucket maps to, for non-Tailwind consumers (canvas
// renderers, native gradients).
export const BUCKET_META: Record<LifeBucket, BucketMeta> = {
  income: {
    label: 'Income-Producing',
    description: 'Your job, paid work, client projects',
  },
  asset: {
    label: 'Asset-Building',
    description: 'Skills, content, learning, side projects',
  },
  recovery: {
    label: 'Recovery',
    description: 'Sleep, rest, exercise, health',
  },
  relational: {
    label: 'Relational',
    description: 'Family, friends, real human connection',
  },
};

export interface BucketTone {
  name: string;
  hex: string;
}

/** Raw color per bucket, independent of any styling system. */
export const BUCKET_TONE: Record<LifeBucket, BucketTone> = {
  income: { name: 'emerald', hex: '#34d399' },
  asset: { name: 'violet', hex: '#a78bfa' },
  recovery: { name: 'sky', hex: '#38bdf8' },
  relational: { name: 'amber', hex: '#fbbf24' },
};

export interface WeeklyPriorityItem {
  text: string;
  linkedItemId?: string;
  linkedItemType?: 'goal' | 'habit' | 'custom';
  linkedItemName?: string;
  bucket?: LifeBucket;
}

export interface DailyOutcomeItem {
  text: string;
  contributesToKey?: string;
  linkedItemId?: string;
  linkedItemType?: 'goal' | 'habit' | 'custom';
  linkedItemName?: string;
  completed?: boolean;
}

export interface WeeklyBucketActionsData {
  p1?: WeeklyPriorityItem;
  p2?: WeeklyPriorityItem;
  p3?: WeeklyPriorityItem;
  dailyWins?: Record<string, DailyOutcomeItem>;
  [key: string]: any;
}

export type WeeklyBucketAction = WeeklyPriorityItem;
export type WeeklyBucketActions = WeeklyBucketActionsData | Partial<Record<LifeBucket, WeeklyPriorityItem>>;

