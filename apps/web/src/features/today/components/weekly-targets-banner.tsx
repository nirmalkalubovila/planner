import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeeklyBucketActions, WeeklyPriorityItem } from '@llb/core';

interface WeeklyTargetsBannerProps {
  bucketActions: WeeklyBucketActions;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01' },
  { id: 'p2', num: '02' },
  { id: 'p3', num: '03' },
] as const;

const formatLinkedTitle = (name?: string) =>
  name ? name.replace(/^(Current State|Goal|Habit|Task):\s*/i, '').trim() : '';

export const WeeklyTargetsBanner: React.FC<WeeklyTargetsBannerProps> = ({ bucketActions }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize weekly outcome items
  const raw = (bucketActions || {}) as any;
  const actions: Record<string, WeeklyPriorityItem> = React.useMemo(() => {
    if (raw.p1 || raw.p2 || raw.p3) return raw;
    const migrated: Record<string, WeeklyPriorityItem> = {};
    const entries = Object.entries(raw).filter(([k, v]: any) => k !== 'dailyWins' && !!v?.text?.trim());
    if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
    if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
    if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
    return migrated;
  }, [raw]);

  const setSlots = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim());

  const handleOpenPlanner = () => {
    navigate('/planner', { state: { openOutcomes: true } });
  };

  return (
    <div className="rounded-xl bg-card/60 backdrop-blur-md border border-border/60 mb-4 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            This Week's Priorities
          </span>
          <span className="text-[10px] font-mono font-bold text-foreground">{setSlots.length}/3</span>
        </span>
        <span className="text-[11px] font-bold text-primary">{isExpanded ? 'Hide' : 'Show'}</span>
      </button>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-0.5 space-y-2 border-t border-white/10 bg-black/20">
          {setSlots.length > 0 ? (
            <>
              {setSlots.map(slot => {
                const action = actions[slot.id];

                return (
                  <div
                    key={slot.id}
                    className="px-3 py-2.5 rounded-lg border border-border/70 bg-card/50 space-y-1 first:mt-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-primary shrink-0 pt-1">{slot.num}</span>
                      <span className="text-sm font-bold text-foreground leading-snug tracking-tight break-words min-w-0 flex-1">
                        {action?.text}
                      </span>
                    </div>

                    {action?.linkedItemName && (
                      <div className="text-[10px] text-muted-foreground font-mono pl-[26px] break-words">
                        <span className="capitalize">{action.linkedItemType || 'item'}:</span>{' '}
                        <span className="text-foreground/80">{formatLinkedTitle(action.linkedItemName)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleOpenPlanner}
                  className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Choose up to three outcomes that define this week.</p>
              <button
                type="button"
                onClick={handleOpenPlanner}
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
              >
                Set Outcomes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
