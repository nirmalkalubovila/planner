import React from 'react';
import { Target, Link2 } from 'lucide-react';
import { WeeklyBucketActions, WeeklyPriorityItem } from '@llb/core';
import { cn } from '@/lib/utils';

interface BucketTargetsBarProps {
  bucketActions: WeeklyBucketActions;
  onOpenDialog: () => void;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01', label: 'Outcome 01' },
  { id: 'p2', num: '02', label: 'Outcome 02' },
  { id: 'p3', num: '03', label: 'Outcome 03' },
] as const;

export const BucketTargetsBar: React.FC<BucketTargetsBarProps> = ({
  bucketActions,
  onOpenDialog,
}) => {
  // Normalize priority items
  const actions: Record<string, WeeklyPriorityItem> = React.useMemo(() => {
    const raw = (bucketActions || {}) as any;
    if (raw.p1 || raw.p2 || raw.p3) return raw;
    const migrated: Record<string, WeeklyPriorityItem> = {};
    const entries = Object.entries(raw).filter(([_, v]: any) => !!v?.text?.trim());
    if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
    if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
    if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
    return migrated;
  }, [bucketActions]);

  const totalSet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/60 p-3 space-y-2.5 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="text-xs uppercase tracking-widest font-bold text-foreground">
            THIS WEEK
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
            Weekly Outcomes
          </span>
          <span className={cn(
            "text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border",
            totalSet > 0
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {totalSet}/3 Set
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDialog}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          {totalSet === 0 ? 'Define Outcomes' : 'Edit Outcomes'} →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {OUTCOME_SLOTS.map(slot => {
          const action = actions[slot.id];
          const hasText = !!action?.text?.trim();

          return (
            <div
              key={slot.id}
              onClick={onOpenDialog}
              className={cn(
                "p-2.5 rounded-xl border flex flex-col justify-between space-y-1.5 text-xs cursor-pointer transition-all hover:bg-accent/40 bg-card/40",
                hasText ? "border-border/80 hover:border-border" : "border-border/40 bg-muted/10 text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold min-w-0">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border bg-white/5 border-white/10 text-foreground">
                    {slot.num}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-foreground">
                    {slot.label}
                  </span>
                </div>
                {action?.linkedItemName && (
                  <span title={`Linked to ${action.linkedItemName}`}>
                    <Link2 size={11} className="text-primary opacity-80" />
                  </span>
                )}
              </div>

              <p className={cn(
                "text-[11px] truncate font-semibold",
                hasText ? "text-foreground" : "text-muted-foreground italic opacity-60"
              )}>
                {hasText && action?.text ? action.text : `No outcome set`}
              </p>

              {hasText && action?.linkedItemName && (
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono truncate border-t border-white/5 pt-0.5">
                  <span className="capitalize opacity-80">{action.linkedItemType || 'Linked'}:</span>
                  <span className="text-foreground font-semibold truncate">
                    {action.linkedItemName.replace(/^(Current State|Goal|Habit|Task):\s*/i, '').slice(0, 22)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
