import React, { useState, useEffect } from 'react';
import { Link2, X, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { LifeBucket, WeeklyBucketActions, WeeklyPriorityItem, DailyOutcomeItem } from '@/types/time';
import { Goal, Habit, CustomTask } from '@/types/global-types';
import { useSaveBucketActions } from '@/api/services/planner-service';
import { WeekUtils } from '@/utils/week-utils';
import { cn } from '@/lib/utils';

interface SundayFocusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: string;
  existingActions: WeeklyBucketActions;
  goals: Goal[];
  habits: Habit[];
  customTasks: CustomTask[];
}

const OUTCOME_SLOTS = [
  {
    id: 'p1',
    num: '01',
    label: 'Outcome 01',
    placeholder: 'e.g. Complete quarterly project deliverable...',
  },
  {
    id: 'p2',
    num: '02',
    label: 'Outcome 02',
    placeholder: 'e.g. Establish consistent deep-work routine...',
  },
  {
    id: 'p3',
    num: '03',
    label: 'Outcome 03',
    placeholder: 'e.g. Finalize client proposals and terms...',
  },
] as const;

const truncateText = (str: string, maxLen: number = 24) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
};

export const SundayFocusDialog: React.FC<SundayFocusDialogProps> = ({
  isOpen,
  onClose,
  currentWeek,
  existingActions,
  goals,
  habits,
  customTasks,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [actions, setActions] = useState<Record<string, WeeklyPriorityItem>>({});
  const [dailyWins, setDailyWins] = useState<Record<string, DailyOutcomeItem>>({});
  const saveBucketActions = useSaveBucketActions();

  const currentDayStr = WeekUtils.getCurrentDay();
  const weekDays = React.useMemo(() => {
    return WeekUtils.getDaysForWeek(currentWeek);
  }, [currentWeek]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const raw = (existingActions || {}) as any;
      if (raw.p1 || raw.p2 || raw.p3) {
        setActions({
          p1: raw.p1 || { text: '' },
          p2: raw.p2 || { text: '' },
          p3: raw.p3 || { text: '' },
        });
      } else {
        const migrated: Record<string, WeeklyPriorityItem> = {};
        const entries = Object.entries(raw).filter(([k, v]: any) => k !== 'dailyWins' && !!v?.text?.trim());
        if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
        if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
        if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
        setActions(migrated);
      }

      setDailyWins(raw.dailyWins || {});
    }
  }, [isOpen, existingActions]);

  // Step 1: Weekly Outcome Handlers
  const handleWeeklyTextChange = (slotId: string, text: string) => {
    setActions(prev => ({
      ...prev,
      [slotId]: {
        ...(prev[slotId] || { text: '' }),
        text,
      },
    }));
  };

  const handleWeeklyLinkItem = (slotId: string, selectedVal: string) => {
    if (!selectedVal) {
      setActions(prev => ({
        ...prev,
        [slotId]: {
          text: prev[slotId]?.text || '',
          linkedItemId: undefined,
          linkedItemType: undefined,
          linkedItemName: undefined,
          bucket: undefined,
        },
      }));
      return;
    }

    const [type, id] = selectedVal.split('::');
    let name = '';
    let bucket: LifeBucket | undefined;

    if (type === 'goal') {
      const g = goals.find(item => item.id === id);
      if (g) {
        name = g.name;
        bucket = g.bucket as LifeBucket;
      }
    } else if (type === 'habit') {
      const h = habits.find(item => item.id === id);
      if (h) {
        name = h.name;
        bucket = h.bucket as LifeBucket;
      }
    } else if (type === 'custom') {
      const t = customTasks.find(item => item.id === id);
      if (t) {
        name = t.name;
        bucket = t.bucket as LifeBucket;
      }
    }

    setActions(prev => ({
      ...prev,
      [slotId]: {
        text: prev[slotId]?.text || name,
        linkedItemId: id,
        linkedItemType: type as 'goal' | 'habit' | 'custom',
        linkedItemName: name,
        bucket,
      },
    }));
  };

  const handleClearWeeklySlot = (slotId: string) => {
    setActions(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
  };

  // Step 2: Daily Outcome Handlers
  const handleDailyTextChange = (dayStr: string, text: string) => {
    setDailyWins(prev => ({
      ...prev,
      [dayStr]: {
        ...(prev[dayStr] || { text: '' }),
        text,
      },
    }));
  };

  const handleDailyContributesTo = (dayStr: string, outcomeKey: string) => {
    setDailyWins(prev => ({
      ...prev,
      [dayStr]: {
        ...(prev[dayStr] || { text: '' }),
        contributesToKey: outcomeKey || undefined,
      },
    }));
  };

  const handleClearDailySlot = (dayStr: string) => {
    setDailyWins(prev => {
      const updated = { ...prev };
      delete updated[dayStr];
      return updated;
    });
  };

  // Save Payload (Weekly Outcomes + Daily Outcomes)
  const handleSaveAll = async () => {
    await saveBucketActions.mutateAsync({
      week: currentWeek,
      bucketActions: {
        ...actions,
        dailyWins,
      },
    });
    onClose();
  };

  const totalWeeklySet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;
  const totalDailySet = weekDays.filter((_, idx) => {
    const dayStr = `${currentWeek}-${idx + 1}`;
    return !!dailyWins[dayStr]?.text?.trim();
  }).length;

  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-muted-foreground">
          {step === 1 ? `${totalWeeklySet}/3 Outcomes` : `${totalDailySet}/7 Days Set`}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        {step === 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <ChevronLeft size={14} /> Back
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onClose} className="h-9 px-3 text-xs">
          Cancel
        </Button>

        {step === 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAll}
              disabled={saveBucketActions.isPending}
              className="h-9 px-3 text-xs font-semibold border-white/10"
            >
              Save Weekly Only
            </Button>
            <Button
              size="sm"
              onClick={() => setStep(2)}
              className="h-9 px-3.5 text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5"
            >
              Step 2: Daily Outcomes <ChevronRight size={14} />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saveBucketActions.isPending}
            className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground"
          >
            {saveBucketActions.isPending ? 'Saving...' : 'Save All Outcomes'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Weekly Outcomes (Step 1/2)" : "Daily Outcomes (Step 2/2)"}
      subtitle={
        step === 1
          ? "What 3 outcomes matter most this week? (Choose 1 to 3)"
          : "What is the ONE outcome that makes each day meaningful?"
      }
      maxWidth="xl"
      footer={footer}
    >
      <div className="p-3 sm:p-4 space-y-4 max-w-full overflow-hidden">
        {/* Step Indicator Tabs */}
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              step === 1
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40"
            )}
          >
            <span className="font-mono text-[10px] opacity-80">01</span>
            Weekly Outcomes ({totalWeeklySet}/3)
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              step === 2
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40"
            )}
          >
            <span className="font-mono text-[10px] opacity-80">02</span>
            Daily Outcomes ({totalDailySet}/7)
          </button>
        </div>

        {/* STEP 1: Weekly Outcomes */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-card/60 border border-border/50 text-xs text-muted-foreground leading-relaxed">
              Define <strong className="text-foreground">1 to 3 pivotal outcomes</strong> that define a successful week. You don't have to fill all 3 if only 1 genuinely matters.
            </div>

            {OUTCOME_SLOTS.map((slot) => {
              const currentAction = actions[slot.id] || { text: '' };
              const selectedValue = currentAction.linkedItemId && currentAction.linkedItemType
                ? `${currentAction.linkedItemType}::${currentAction.linkedItemId}`
                : '';

              return (
                <div
                  key={slot.id}
                  className="p-3 rounded-xl border border-border/60 hover:border-border transition-all space-y-2.5 bg-card/40 w-full max-w-full overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-foreground">
                        {slot.num}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {slot.label}
                      </span>
                    </div>

                    {currentAction.text && (
                      <button
                        type="button"
                        onClick={() => handleClearWeeklySlot(slot.id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0 ml-1"
                        title="Clear outcome"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown link item + Target Action Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <div className="min-w-0 w-full">
                      <select
                        value={selectedValue}
                        onChange={e => handleWeeklyLinkItem(slot.id, e.target.value)}
                        className="w-full text-xs rounded-xl bg-background border border-border px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate max-w-full"
                      >
                        <option value="">-- Link Goal, Habit, or Task --</option>

                        {goals.length > 0 && (
                          <optgroup label="Goals">
                            {goals.map(g => (
                              <option key={g.id} value={`goal::${g.id}`}>
                                Goal: {truncateText(g.name, 24)}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {habits.length > 0 && (
                          <optgroup label="Habits">
                            {habits.map(h => (
                              <option key={h.id} value={`habit::${h.id}`}>
                                Habit: {truncateText(h.name, 24)}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {customTasks.length > 0 && (
                          <optgroup label="Custom Tasks">
                            {customTasks.map(t => (
                              <option key={t.id} value={`custom::${t.id}`}>
                                Task: {truncateText(t.name, 24)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Target Action Text */}
                    <div className="min-w-0 w-full">
                      <input
                        type="text"
                        placeholder={slot.placeholder}
                        value={currentAction.text || ''}
                        onChange={e => handleWeeklyTextChange(slot.id, e.target.value)}
                        className="w-full text-xs rounded-xl bg-background border border-border px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate"
                      />
                    </div>
                  </div>

                  {/* Linked Status pill */}
                  {currentAction.linkedItemName && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-md w-full max-w-full overflow-hidden">
                      <Link2 size={11} className="text-primary shrink-0" />
                      <span className="truncate">Linked {currentAction.linkedItemType}: <strong className="text-foreground">{currentAction.linkedItemName}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: Daily Outcomes (7 Days) */}
        {step === 2 && (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-card/60 border border-border/50 text-xs text-muted-foreground leading-relaxed">
              For each day, define <strong className="text-foreground">exactly 1 primary outcome</strong> and select which weekly outcome it advances.
            </div>

            {weekDays.map((date, idx) => {
              const dayStr = `${currentWeek}-${idx + 1}`;
              const dayWin = dailyWins[dayStr] || { text: '' };
              const isToday = currentDayStr === dayStr;
              const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div
                  key={dayStr}
                  className={cn(
                    "p-3 rounded-xl border transition-all space-y-2 bg-card/40",
                    isToday ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/60 hover:border-border"
                  )}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar size={13} className={cn("shrink-0", isToday ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-bold truncate", isToday ? "text-foreground font-extrabold" : "text-foreground")}>
                        {formattedDate}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                          Today
                        </span>
                      )}
                    </div>

                    {dayWin.text && (
                      <button
                        type="button"
                        onClick={() => handleClearDailySlot(dayStr)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0 ml-1"
                        title="Clear day outcome"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Input + Contribution Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 w-full">
                    {/* Primary Outcome Text */}
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="e.g. Draft initial project outline..."
                        value={dayWin.text || ''}
                        onChange={e => handleDailyTextChange(dayStr, e.target.value)}
                        className="w-full text-xs rounded-xl bg-background border border-border px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate"
                      />
                    </div>

                    {/* Contributes To Selector - ALWAYS shows all 3 weekly outcomes */}
                    <div className="sm:col-span-5">
                      <select
                        value={dayWin.contributesToKey || ''}
                        onChange={e => handleDailyContributesTo(dayStr, e.target.value)}
                        className="w-full text-xs rounded-xl bg-background border border-border px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate"
                      >
                        <option value="">-- Contributes to... --</option>
                        <option value="p1">
                          01 {actions.p1?.text?.trim() ? `(${truncateText(actions.p1.text.trim(), 20)})` : 'Weekly Outcome 01'}
                        </option>
                        <option value="p2">
                          02 {actions.p2?.text?.trim() ? `(${truncateText(actions.p2.text.trim(), 20)})` : 'Weekly Outcome 02'}
                        </option>
                        <option value="p3">
                          03 {actions.p3?.text?.trim() ? `(${truncateText(actions.p3.text.trim(), 20)})` : 'Weekly Outcome 03'}
                        </option>
                        <option value="standalone">Standalone Day Focus</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StandardDialog>
  );
};
