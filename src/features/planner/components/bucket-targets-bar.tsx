import React from 'react';
import { Target, Briefcase, Sparkles, HeartPulse, Users, Link2 } from 'lucide-react';
import { LIFE_BUCKETS, BUCKET_META, LifeBucket, WeeklyBucketActions } from '@/types/time';
import { cn } from '@/lib/utils';

interface BucketTargetsBarProps {
  bucketActions: WeeklyBucketActions;
  onOpenDialog: () => void;
}

const BUCKET_ICONS: Record<LifeBucket, React.ReactNode> = {
  income: <Briefcase className="h-3 w-3" />,
  asset: <Sparkles className="h-3 w-3" />,
  recovery: <HeartPulse className="h-3 w-3" />,
  relational: <Users className="h-3 w-3" />,
};

export const BucketTargetsBar: React.FC<BucketTargetsBarProps> = ({
  bucketActions,
  onOpenDialog,
}) => {
  const totalSet = LIFE_BUCKETS.filter(b => !!bucketActions[b]?.text?.trim()).length;

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-md border border-border p-3 space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="text-xs uppercase tracking-widest font-bold text-foreground">
            Sunday 4-Bucket Targets
          </span>
          <span className={cn(
            "text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border",
            totalSet === 4
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {totalSet}/4 Set
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDialog}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          {totalSet === 0 ? 'Set Targets' : 'Edit Targets'} →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {LIFE_BUCKETS.map(bucketKey => {
          const meta = BUCKET_META[bucketKey];
          const action = bucketActions[bucketKey];
          const hasText = !!action?.text?.trim();

          return (
            <div
              key={bucketKey}
              onClick={onOpenDialog}
              className={cn(
                "p-2.5 rounded-xl border flex flex-col justify-between space-y-1 text-xs cursor-pointer transition-all hover:bg-accent/40",
                hasText ? meta.borderClass : "border-border/60 bg-muted/20 text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <div className={cn("p-1 rounded-md border", meta.badgeClass)}>
                    {BUCKET_ICONS[bucketKey]}
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-wider", meta.color)}>
                    {meta.label}
                  </span>
                </div>
                {action?.linkedItemName && (
                  <span title={`Linked to ${action.linkedItemName}`}>
                    <Link2 size={11} className="text-primary opacity-80" />
                  </span>
                )}
              </div>

              <p className={cn(
                "text-[11px] truncate font-medium",
                hasText ? "text-foreground" : "text-muted-foreground italic opacity-60"
              )}>
                {hasText && action?.text ? action.text : `No ${meta.label.toLowerCase()} target set`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
