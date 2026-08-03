import React, { useState } from 'react';
import { Compass, ChevronDown, Briefcase, Sparkles, HeartPulse, Users, Link2 } from 'lucide-react';
import { LIFE_BUCKETS, BUCKET_META, LifeBucket, WeeklyBucketActions } from '@/types/time';
import { cn } from '@/lib/utils';

interface WeeklyTargetsBannerProps {
  bucketActions: WeeklyBucketActions;
}

const BUCKET_ICONS: Record<LifeBucket, React.ReactNode> = {
  income: <Briefcase className="h-3 w-3" />,
  asset: <Sparkles className="h-3 w-3" />,
  recovery: <HeartPulse className="h-3 w-3" />,
  relational: <Users className="h-3 w-3" />,
};

export const WeeklyTargetsBanner: React.FC<WeeklyTargetsBannerProps> = ({ bucketActions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalSet = LIFE_BUCKETS.filter(b => !!bucketActions[b]?.text?.trim()).length;
  if (totalSet === 0) return null;

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur-md border border-border p-3.5 space-y-2 mb-5">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Compass size={14} />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-foreground block">
              This Week Main Priorities
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              4-Bucket Life Focus
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {totalSet}/4 Targets Set
          </span>
          <ChevronDown
            size={14}
            className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-border/50">
          {LIFE_BUCKETS.map(bucketKey => {
            const meta = BUCKET_META[bucketKey];
            const action = bucketActions[bucketKey];
            const hasText = !!action?.text?.trim();

            if (!hasText) return null;

            return (
              <div
                key={bucketKey}
                className={cn(
                  "p-2.5 rounded-xl border flex flex-col justify-between space-y-1 text-xs bg-glass",
                  meta.borderClass
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

                <p className="text-[11px] font-semibold text-foreground truncate">
                  {action?.text}
                </p>

                {action?.linkedItemName && (
                  <p className="text-[9px] text-muted-foreground font-mono truncate">
                    Linked {action?.linkedItemType}: <strong>{action.linkedItemName}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
