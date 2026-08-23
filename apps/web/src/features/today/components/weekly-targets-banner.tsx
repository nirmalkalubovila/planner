import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Pencil, Plus } from 'lucide-react';
import { WeeklyBucketActions, WeeklyPriorityItem, DailyOutcomeItem } from '@llb/core';
import { cn } from '@/lib/utils';

interface WeeklyTargetsBannerProps {
  bucketActions: WeeklyBucketActions;
  currentDayStr?: string;
}

const OUTCOME_SLOTS = [
  { id: 'p1', num: '01', label: 'Outcome 01' },
  { id: 'p2', num: '02', label: 'Outcome 02' },
  { id: 'p3', num: '03', label: 'Outcome 03' },
] as const;

const formatLinkedTitle = (name?: string, maxLen: number = 28) => {
  if (!name) return '';
  const cleaned = name.replace(/^(Current State|Goal|Habit|Task):\s*/i, '').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned;
};

export const WeeklyTargetsBanner: React.FC<WeeklyTargetsBannerProps> = ({
  bucketActions,
  currentDayStr,
}) => {
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

  const totalWeeklySet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;

  // Extract Today's Day Outcome
  const todayWin: DailyOutcomeItem | undefined = currentDayStr && raw.dailyWins
    ? raw.dailyWins[currentDayStr]
    : undefined;
  const hasTodayWin = !!todayWin?.text?.trim();

  const handleOpenPlanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/planner', { state: { openOutcomes: true } });
  };

  return (
    <div className="rounded-xl bg-card/60 backdrop-blur-md border border-border/60 transition-all mb-4 overflow-hidden shadow-sm">
      {/* 1. Compressed Single-Line Bar (Always Visible) */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-3.5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground shrink-0">
            TODAY'S OUTCOME:
          </span>

          {hasTodayWin && todayWin ? (
            <span className="text-base sm:text-lg font-black text-foreground tracking-tight truncate min-w-0">
              {todayWin.text}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/70 italic truncate">
              No outcome defined for today
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-foreground hidden xs:inline">
            Week: {totalWeeklySet}/3
          </span>

          <button
            type="button"
            onClick={handleOpenPlanner}
            title={hasTodayWin ? "Edit Outcomes" : "Set Outcomes"}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            {hasTodayWin ? <Pencil size={13} /> : <Plus size={14} />}
          </button>

          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* 2. Expandable Details (Only shown when user opens) */}
      {isExpanded && (
        <div className="px-3.5 py-3 border-t border-white/10 space-y-2.5 bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
              This Week's Outcomes ({totalWeeklySet}/3)
            </span>
          </div>

          {totalWeeklySet > 0 ? (
            <div className={cn(
              "grid gap-2",
              totalWeeklySet === 1 ? "grid-cols-1" : totalWeeklySet === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
            )}>
              {OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).map(slot => {
                const action = actions[slot.id];

                return (
                  <div
                    key={slot.id}
                    onClick={handleOpenPlanner}
                    className="px-3 py-2 rounded-lg border border-border/70 hover:border-border transition-all flex flex-col justify-center space-y-1 bg-card/50 cursor-pointer"
                  >
                    {/* Line 1: 01 + Outcome focal text */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-foreground shrink-0">
                        {slot.num}
                      </span>
                      <span className="text-base font-extrabold text-foreground leading-snug tracking-tight truncate flex-1">
                        {action?.text}
                      </span>
                    </div>

                    {/* Line 2: Linked Goal: [Text] */}
                    {action?.linkedItemName && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono truncate pl-0.5">
                        <span className="capitalize opacity-80 shrink-0">Linked {action.linkedItemType || 'item'}:</span>
                        <span className="text-foreground/90 font-medium truncate">
                          {formatLinkedTitle(action.linkedItemName, 26)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              onClick={handleOpenPlanner}
              className="px-3 py-2 rounded-lg border border-dashed border-border/50 text-center text-xs italic text-muted-foreground hover:text-foreground cursor-pointer transition-all bg-background/20"
            >
              No weekly outcomes defined yet. <span className="text-primary font-bold not-italic hover:underline">+ Define in Planner</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
