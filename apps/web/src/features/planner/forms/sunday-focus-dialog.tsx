import React, { useState, useEffect } from 'react';
import { Link2, X } from 'lucide-react';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { LifeBucket, WeeklyBucketActions, WeeklyPriorityItem } from '@llb/core';
import { Goal, Habit, CustomTask } from '@llb/core';
import { useSaveBucketActions } from '@llb/api';

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
  const [actions, setActions] = useState<Record<string, WeeklyPriorityItem>>({});
  const saveBucketActions = useSaveBucketActions();

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, existingActions]);

  // Weekly Outcome Handlers
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

  // Daily outcomes are no longer edited here; carry any stored ones through
  // so saving the weekly outcomes never wipes them.
  const handleSave = async () => {
    const existingDailyWins = (existingActions as any)?.dailyWins;
    await saveBucketActions.mutateAsync({
      week: currentWeek,
      bucketActions: existingDailyWins ? { ...actions, dailyWins: existingDailyWins } : { ...actions },
    });
    onClose();
  };

  const totalWeeklySet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;

  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
      <span className="text-[11px] font-mono text-muted-foreground">{totalWeeklySet}/3 Outcomes</span>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-9 px-3 text-xs">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saveBucketActions.isPending}
          className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground"
        >
          {saveBucketActions.isPending ? 'Saving...' : 'Save Outcomes'}
        </Button>
      </div>
    </div>
  );

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Outcomes"
      subtitle="What 1 to 3 outcomes matter most this week?"
      maxWidth="xl"
      footer={footer}
    >
      <div className="p-3 sm:p-4 space-y-4 max-w-full overflow-hidden">
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
      </div>
    </StandardDialog>
  );
};
