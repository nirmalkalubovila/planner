import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Link2, X } from 'lucide-react-native';
import { useSaveBucketActions } from '@llb/api';
import {
  CustomTask,
  DailyOutcomeItem,
  Goal,
  Habit,
  LifeBucket,
  WeeklyBucketActions,
  WeeklyPriorityItem,
  WeekUtils,
} from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptionPickerField, type PickerOption } from '@/components/ui/option-picker-field';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

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
  { id: 'p1', num: '01', label: 'Outcome 01', placeholder: 'e.g. Complete quarterly project deliverable...' },
  { id: 'p2', num: '02', label: 'Outcome 02', placeholder: 'e.g. Establish consistent deep-work routine...' },
  { id: 'p3', num: '03', label: 'Outcome 03', placeholder: 'e.g. Finalize client proposals and terms...' },
] as const;

const truncateText = (str: string, maxLen: number = 24) => (str && str.length > maxLen ? str.slice(0, maxLen) + '...' : str || '');

/** RN port of apps/web/.../planner/forms/sunday-focus-dialog.tsx. The
 * Radix `<select>` with `<optgroup>` becomes `OptionPickerField`'s grouped
 * list; everything else (the 2-step weekly/daily flow, save payload shape)
 * ports unchanged. */
export const SundayFocusDialog: React.FC<SundayFocusDialogProps> = (props) => (
  // Re-keyed on open so the body's state seeds itself from existingActions
  // in useState initializers rather than being pushed in by an effect.
  <SundayFocusDialogBody key={props.isOpen ? 'open' : 'closed'} {...props} />
);

/** Reads the stored bucket-actions blob, which comes in two shapes: the
 * current `{ p1, p2, p3 }` form, or an older map of arbitrary keys that
 * gets folded down to the first three non-empty entries. Pure, so it can
 * run straight from a useState initializer. */
function readWeeklyPriorities(existingActions: unknown): Record<string, WeeklyPriorityItem> {
  const raw = (existingActions || {}) as any;
  if (raw.p1 || raw.p2 || raw.p3) {
    return { p1: raw.p1 || { text: '' }, p2: raw.p2 || { text: '' }, p3: raw.p3 || { text: '' } };
  }
  const migrated: Record<string, WeeklyPriorityItem> = {};
  const entries = Object.entries(raw).filter(([k, v]: any) => k !== 'dailyWins' && !!v?.text?.trim());
  if (entries[0]) migrated.p1 = entries[0][1] as WeeklyPriorityItem;
  if (entries[1]) migrated.p2 = entries[1][1] as WeeklyPriorityItem;
  if (entries[2]) migrated.p3 = entries[2][1] as WeeklyPriorityItem;
  return migrated;
}

const SundayFocusDialogBody: React.FC<SundayFocusDialogProps> = ({
  isOpen,
  onClose,
  currentWeek,
  existingActions,
  goals,
  habits,
  customTasks,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [actions, setActions] = useState<Record<string, WeeklyPriorityItem>>(() =>
    readWeeklyPriorities(existingActions)
  );
  const [dailyWins, setDailyWins] = useState<Record<string, DailyOutcomeItem>>(
    () => ((existingActions || {}) as any).dailyWins || {}
  );
  const saveBucketActions = useSaveBucketActions();

  const currentDayStr = WeekUtils.getCurrentDay();
  const weekDays = React.useMemo(() => WeekUtils.getDaysForWeek(currentWeek), [currentWeek]);

  const linkOptions: PickerOption[] = React.useMemo(() => {
    const opts: PickerOption[] = [];
    goals.forEach(g => opts.push({ value: `goal::${g.id}`, label: `Goal: ${truncateText(g.name, 24)}`, group: 'Goals' }));
    habits.forEach(h => opts.push({ value: `habit::${h.id}`, label: `Habit: ${truncateText(h.name, 24)}`, group: 'Habits' }));
    customTasks.forEach(t => opts.push({ value: `custom::${t.id}`, label: `Task: ${truncateText(t.name, 24)}`, group: 'Custom Tasks' }));
    return opts;
  }, [goals, habits, customTasks]);

  const handleWeeklyTextChange = (slotId: string, text: string) => {
    setActions(prev => ({ ...prev, [slotId]: { ...(prev[slotId] || { text: '' }), text } }));
  };

  const handleWeeklyLinkItem = (slotId: string, selectedVal: string) => {
    if (!selectedVal) {
      setActions(prev => ({
        ...prev,
        [slotId]: { text: prev[slotId]?.text || '', linkedItemId: undefined, linkedItemType: undefined, linkedItemName: undefined, bucket: undefined },
      }));
      return;
    }
    const [type, id] = selectedVal.split('::');
    let name = '';
    let bucket: LifeBucket | undefined;
    if (type === 'goal') {
      const g = goals.find(item => item.id === id);
      if (g) { name = g.name; bucket = g.bucket as LifeBucket; }
    } else if (type === 'habit') {
      const h = habits.find(item => item.id === id);
      if (h) { name = h.name; bucket = h.bucket as LifeBucket; }
    } else if (type === 'custom') {
      const t = customTasks.find(item => item.id === id);
      if (t) { name = t.name; bucket = t.bucket as LifeBucket; }
    }
    setActions(prev => ({
      ...prev,
      [slotId]: { text: prev[slotId]?.text || name, linkedItemId: id, linkedItemType: type as 'goal' | 'habit' | 'custom', linkedItemName: name, bucket },
    }));
  };

  const handleClearWeeklySlot = (slotId: string) => {
    setActions(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
  };

  const handleDailyTextChange = (dayStr: string, text: string) => {
    setDailyWins(prev => ({ ...prev, [dayStr]: { ...(prev[dayStr] || { text: '' }), text } }));
  };

  const handleDailyContributesTo = (dayStr: string, outcomeKey: string) => {
    setDailyWins(prev => ({ ...prev, [dayStr]: { ...(prev[dayStr] || { text: '' }), contributesToKey: outcomeKey || undefined } }));
  };

  const handleClearDailySlot = (dayStr: string) => {
    setDailyWins(prev => {
      const updated = { ...prev };
      delete updated[dayStr];
      return updated;
    });
  };

  const handleSaveAll = async () => {
    await saveBucketActions.mutateAsync({ week: currentWeek, bucketActions: { ...actions, dailyWins } });
    onClose();
  };

  const totalWeeklySet = OUTCOME_SLOTS.filter(s => !!actions[s.id]?.text?.trim()).length;
  const totalDailySet = weekDays.filter((_, idx) => !!dailyWins[`${currentWeek}-${idx + 1}`]?.text?.trim()).length;

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Weekly Outcomes (Step 1/2)' : 'Daily Outcomes (Step 2/2)'}
      subtitle={step === 1 ? `What 1-3 outcomes matter most this week?` : `One primary outcome per day`}
      footer={
        <View className="gap-2.5">
          <Text variant="tiny" className="font-mono text-center">
            {step === 1 ? `${totalWeeklySet}/3 Outcomes` : `${totalDailySet}/7 Days Set`}
          </Text>
          <View className="flex-row items-center justify-end gap-2">
            {step === 2 && (
              <Button variant="ghost" size="sm" onPress={() => setStep(1)} className="px-3">
                <View className="flex-row items-center gap-1">
                  <ChevronLeft size={14} color="#e4e4e7" />
                  <Text variant="small">Back</Text>
                </View>
              </Button>
            )}
            <Button variant="ghost" size="sm" onPress={onClose} className="px-3">
              Cancel
            </Button>
            {step === 1 ? (
              <>
                <Button variant="outline" size="sm" onPress={handleSaveAll} disabled={saveBucketActions.isPending} className="px-3">
                  Save Weekly Only
                </Button>
                <Button size="sm" onPress={() => setStep(2)} className="px-3.5">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-primary-foreground text-xs font-bold">Step 2</Text>
                    <ChevronRight size={14} color="#0a0a0a" />
                  </View>
                </Button>
              </>
            ) : (
              <Button size="sm" onPress={handleSaveAll} disabled={saveBucketActions.isPending} className="px-4">
                {saveBucketActions.isPending ? 'Saving...' : 'Save All Outcomes'}
              </Button>
            )}
          </View>
        </View>
      }
    >
      <View className="p-3 gap-4">
        <View className="flex-row gap-2 border-b border-border/50 pb-3">
          <Pressable
            onPress={() => setStep(1)}
            className={cn('px-3 py-1.5 rounded-xl border', step === 1 ? 'bg-primary/15 border-primary/30' : 'border-transparent')}
          >
            <Text className={cn('text-xs font-bold', step === 1 && 'text-primary')}>Weekly ({totalWeeklySet}/3)</Text>
          </Pressable>
          <Pressable
            onPress={() => setStep(2)}
            className={cn('px-3 py-1.5 rounded-xl border', step === 2 ? 'bg-primary/15 border-primary/30' : 'border-transparent')}
          >
            <Text className={cn('text-xs font-bold', step === 2 && 'text-primary')}>Daily ({totalDailySet}/7)</Text>
          </Pressable>
        </View>

        {step === 1 && (
          <View className="gap-3">
            <View className="p-3 rounded-xl bg-card/60 border border-border/50">
              <Text variant="small">
                Define <Text className="text-foreground font-bold">1 to 3 pivotal outcomes</Text> that define a successful week.
              </Text>
            </View>

            {OUTCOME_SLOTS.map(slot => {
              const currentAction = actions[slot.id] || { text: '' };
              const selectedValue = currentAction.linkedItemId && currentAction.linkedItemType ? `${currentAction.linkedItemType}::${currentAction.linkedItemId}` : '';
              return (
                <View key={slot.id} className="p-3 rounded-xl border border-border/60 gap-2.5 bg-card/40">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text variant="tiny" className="font-mono font-bold px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-foreground">
                        {slot.num}
                      </Text>
                      <Text className="text-xs font-bold uppercase tracking-wider">{slot.label}</Text>
                    </View>
                    {!!currentAction.text && (
                      <Pressable onPress={() => handleClearWeeklySlot(slot.id)}>
                        <X size={14} color="#a1a1aa" />
                      </Pressable>
                    )}
                  </View>

                  <OptionPickerField
                    value={selectedValue}
                    onValueChange={v => handleWeeklyLinkItem(slot.id, v)}
                    options={linkOptions}
                    emptyOptionLabel="-- Link Goal, Habit, or Task --"
                    title="Link an item"
                  />

                  <Input
                    placeholder={slot.placeholder}
                    value={currentAction.text || ''}
                    onChangeText={t => handleWeeklyTextChange(slot.id, t)}
                    className="text-xs h-10"
                  />

                  {!!currentAction.linkedItemName && (
                    <View className="flex-row items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-md">
                      <Link2 size={11} color="#e4e4e7" />
                      <Text variant="tiny" numberOfLines={1}>
                        Linked {currentAction.linkedItemType}: {currentAction.linkedItemName}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <ScrollView style={{ maxHeight: 460 }} contentContainerClassName="gap-2.5">
            <View className="p-3 rounded-xl bg-card/60 border border-border/50">
              <Text variant="small">
                For each day, define <Text className="text-foreground font-bold">exactly 1 primary outcome</Text> and link it to a weekly outcome.
              </Text>
            </View>

            {weekDays.map((date, idx) => {
              const dayStr = `${currentWeek}-${idx + 1}`;
              const dayWin = dailyWins[dayStr] || { text: '' };
              const isToday = currentDayStr === dayStr;
              const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const contributesOptions: PickerOption[] = [
                { value: 'p1', label: `01 ${actions.p1?.text?.trim() ? `(${truncateText(actions.p1.text.trim(), 20)})` : 'Weekly Outcome 01'}` },
                { value: 'p2', label: `02 ${actions.p2?.text?.trim() ? `(${truncateText(actions.p2.text.trim(), 20)})` : 'Weekly Outcome 02'}` },
                { value: 'p3', label: `03 ${actions.p3?.text?.trim() ? `(${truncateText(actions.p3.text.trim(), 20)})` : 'Weekly Outcome 03'}` },
                { value: 'standalone', label: 'Standalone Day Focus' },
              ];

              return (
                <View key={dayStr} className={cn('p-3 rounded-xl border gap-2 bg-card/40', isToday ? 'border-primary/40 bg-primary/5' : 'border-border/60')}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Calendar size={13} color={isToday ? '#e4e4e7' : '#a1a1aa'} />
                      <Text className={cn('text-xs font-bold', isToday && 'font-extrabold')}>{formattedDate}</Text>
                      {isToday && (
                        <View className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                          <Text style={{ fontSize: 9 }} className="text-primary font-bold uppercase">
                            Today
                          </Text>
                        </View>
                      )}
                    </View>
                    {!!dayWin.text && (
                      <Pressable onPress={() => handleClearDailySlot(dayStr)}>
                        <X size={14} color="#a1a1aa" />
                      </Pressable>
                    )}
                  </View>

                  <Input
                    placeholder="e.g. Draft initial project outline..."
                    value={dayWin.text || ''}
                    onChangeText={t => handleDailyTextChange(dayStr, t)}
                    className="text-xs h-10"
                  />

                  <OptionPickerField
                    value={dayWin.contributesToKey || ''}
                    onValueChange={v => handleDailyContributesTo(dayStr, v)}
                    options={contributesOptions}
                    emptyOptionLabel="-- Contributes to... --"
                    title="Contributes to"
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </StandardDialog>
  );
};
