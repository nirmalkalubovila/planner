export const LIFE_BUCKETS = ['income', 'asset', 'recovery', 'relational'] as const;
export type LifeBucket = typeof LIFE_BUCKETS[number];

export interface BucketMeta {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  description: string;
}

export const BUCKET_META: Record<LifeBucket, BucketMeta> = {
  income: {
    label: 'Income-Producing',
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    description: 'Your job, paid work, client projects',
  },
  asset: {
    label: 'Asset-Building',
    color: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/20',
    badgeClass: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    description: 'Skills, content, learning, side projects',
  },
  recovery: {
    label: 'Recovery',
    color: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    badgeClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    description: 'Sleep, rest, exercise, health',
  },
  relational: {
    label: 'Relational',
    color: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    description: 'Family, friends, real human connection',
  },
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

