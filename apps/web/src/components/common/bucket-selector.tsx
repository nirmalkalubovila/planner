import React from 'react';
import { LIFE_BUCKETS, BUCKET_META, LifeBucket } from '@llb/core';
import { BUCKET_CLASSES } from '@/theme/bucket-classes';
import { Briefcase, Sparkles, HeartPulse, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BucketSelectorProps {
  value?: LifeBucket | null;
  onChange: (value: LifeBucket | null) => void;
  className?: string;
  /** When set the bucket cannot be cleared, and the label shows it is mandatory. */
  required?: boolean;
  /** Message shown under the options, e.g. when submit was attempted without a choice. */
  error?: string;
}

const BUCKET_ICONS: Record<LifeBucket, React.ReactNode> = {
  income: <Briefcase className="h-3.5 w-3.5" />,
  asset: <Sparkles className="h-3.5 w-3.5" />,
  recovery: <HeartPulse className="h-3.5 w-3.5" />,
  relational: <Users className="h-3.5 w-3.5" />,
};

export const BucketSelector: React.FC<BucketSelectorProps> = ({
  value,
  onChange,
  className,
  required,
  error,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Life Bucket{' '}
          {required
            ? <span className="text-primary">*</span>
            : <span className="text-xs text-muted-foreground font-normal">(Optional)</span>}
        </label>
        {value && !required && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground font-bold transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LIFE_BUCKETS.map((bucketKey) => {
          const meta = BUCKET_META[bucketKey];
          const classes = BUCKET_CLASSES[bucketKey];
          const isSelected = value === bucketKey;
          return (
            <button
              key={bucketKey}
              type="button"
              onClick={() => onChange(isSelected && !required ? null : bucketKey)}
              title={meta.description}
              className={cn(
                "flex items-start gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 text-left cursor-pointer",
                isSelected
                  ? cn("bg-accent border-foreground/30 shadow-sm", classes.color)
                  : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg shrink-0 border mt-0.5",
                isSelected ? classes.badgeClass : "bg-muted border-border text-muted-foreground"
              )}>
                {BUCKET_ICONS[bucketKey]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate tracking-tight font-bold">{meta.label}</span>
                <span className="text-[9px] text-muted-foreground font-normal line-clamp-1 opacity-80">
                  {meta.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
