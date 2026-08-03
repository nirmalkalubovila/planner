import React, { useState, useEffect } from 'react';
import { Target, Briefcase, Sparkles, HeartPulse, Users, Link2, X } from 'lucide-react';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { LIFE_BUCKETS, BUCKET_META, LifeBucket, WeeklyBucketActions } from '@/types/time';
import { Goal, Habit, CustomTask } from '@/types/global-types';
import { useSaveBucketActions } from '@/api/services/planner-service';
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

const BUCKET_ICONS: Record<LifeBucket, React.ReactNode> = {
  income: <Briefcase className="h-4 w-4 shrink-0" />,
  asset: <Sparkles className="h-4 w-4 shrink-0" />,
  recovery: <HeartPulse className="h-4 w-4 shrink-0" />,
  relational: <Users className="h-4 w-4 shrink-0" />,
};

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
  const [actions, setActions] = useState<WeeklyBucketActions>({});
  const saveBucketActions = useSaveBucketActions();

  useEffect(() => {
    if (isOpen) {
      setActions(existingActions || {});
    }
  }, [isOpen, existingActions]);

  const handleTextChange = (bucket: LifeBucket, text: string) => {
    setActions(prev => ({
      ...prev,
      [bucket]: {
        ...(prev[bucket] || {}),
        text,
      },
    }));
  };

  const handleLinkItem = (bucket: LifeBucket, selectedVal: string) => {
    if (!selectedVal) {
      setActions(prev => ({
        ...prev,
        [bucket]: {
          text: prev[bucket]?.text || '',
          linkedItemId: undefined,
          linkedItemType: undefined,
          linkedItemName: undefined,
        },
      }));
      return;
    }

    const [type, id] = selectedVal.split('::');
    let name = '';

    if (type === 'goal') {
      const g = goals.find(item => item.id === id);
      if (g) name = g.name;
    } else if (type === 'habit') {
      const h = habits.find(item => item.id === id);
      if (h) name = h.name;
    } else if (type === 'custom') {
      const t = customTasks.find(item => item.id === id);
      if (t) name = t.name;
    }

    setActions(prev => ({
      ...prev,
      [bucket]: {
        text: prev[bucket]?.text || name,
        linkedItemId: id,
        linkedItemType: type as 'goal' | 'habit' | 'custom',
        linkedItemName: name,
      },
    }));
  };

  const handleClearBucket = (bucket: LifeBucket) => {
    setActions(prev => {
      const updated = { ...prev };
      delete updated[bucket];
      return updated;
    });
  };

  const handleSave = async () => {
    await saveBucketActions.mutateAsync({
      week: currentWeek,
      bucketActions: actions,
    });
    onClose();
  };

  const totalSet = LIFE_BUCKETS.filter(b => !!actions[b]?.text?.trim()).length;

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button variant="ghost" size="sm" onClick={onClose} className="h-9 px-3 text-xs">
        Cancel
      </Button>
      <Button size="sm" onClick={handleSave} disabled={saveBucketActions.isPending} className="h-9 px-4 text-xs font-bold">
        {saveBucketActions.isPending ? 'Saving...' : 'Save Targets'}
      </Button>
    </div>
  );

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="This Week Main Priorities"
      subtitle={`${totalSet}/4 Priorities Set`}
      icon={Target}
      maxWidth="xl"
      footer={footer}
    >
      <div className="p-3 sm:p-4 space-y-3 max-w-full overflow-hidden">
        {LIFE_BUCKETS.map(bucketKey => {
          const meta = BUCKET_META[bucketKey];
          const currentAction = actions[bucketKey] || { text: '' };

          // Filter items tagged for this bucket OR untagged items
          const matchingGoals = goals.filter(g => !g.bucket || g.bucket === bucketKey);
          const matchingHabits = habits.filter(h => !h.bucket || h.bucket === bucketKey);
          const matchingTasks = customTasks.filter(t => !t.bucket || t.bucket === bucketKey);
          const hasItems = matchingGoals.length > 0 || matchingHabits.length > 0 || matchingTasks.length > 0;

          const selectedValue = currentAction.linkedItemId && currentAction.linkedItemType
            ? `${currentAction.linkedItemType}::${currentAction.linkedItemId}`
            : '';

          return (
            <div
              key={bucketKey}
              className={cn(
                "p-3 rounded-xl border transition-all space-y-2 bg-glass w-full max-w-full overflow-hidden",
                meta.borderClass
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1 rounded-lg border shrink-0", meta.badgeClass)}>
                    {BUCKET_ICONS[bucketKey]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={cn("text-xs font-bold uppercase tracking-wider block truncate", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-80 font-normal block truncate">
                      {meta.description}
                    </span>
                  </div>
                </div>

                {currentAction.text && (
                  <button
                    type="button"
                    onClick={() => handleClearBucket(bucketKey)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0 ml-1"
                    title="Clear bucket action"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown link item + Target Action Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <div className="min-w-0 w-full">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Link Item
                  </label>
                  <select
                    value={selectedValue}
                    onChange={e => handleLinkItem(bucketKey, e.target.value)}
                    className="w-full text-xs rounded-xl bg-background border border-border px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate max-w-full"
                  >
                    <option value="">-- Select Item --</option>

                    {matchingGoals.length > 0 && (
                      <optgroup label="Goals">
                        {matchingGoals.map(g => (
                          <option key={g.id} value={`goal::${g.id}`}>
                            Goal: {truncateText(g.name, 22)}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {matchingHabits.length > 0 && (
                      <optgroup label="Habits">
                        {matchingHabits.map(h => (
                          <option key={h.id} value={`habit::${h.id}`}>
                            Habit: {truncateText(h.name, 22)}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {matchingTasks.length > 0 && (
                      <optgroup label="Custom Tasks">
                        {matchingTasks.map(t => (
                          <option key={t.id} value={`custom::${t.id}`}>
                            Task: {truncateText(t.name, 22)}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {!hasItems && (
                      <option value="" disabled>
                        (No items tagged)
                      </option>
                    )}
                  </select>
                </div>

                {/* Target Action Text */}
                <div className="min-w-0 w-full">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Target Action
                  </label>
                  <input
                    type="text"
                    placeholder={`${meta.label} target...`}
                    value={currentAction.text || ''}
                    onChange={e => handleTextChange(bucketKey, e.target.value)}
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
    </StandardDialog>
  );
};
