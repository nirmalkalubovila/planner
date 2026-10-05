import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link2, X } from 'lucide-react-native';
import { useSaveBucketActions } from '@llb/api';
import {
  CustomTask,
  Goal,
  Habit,
  LifeBucket,
  WeeklyBucketActions,
  WeeklyPriorityItem,
} from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptionPickerField, type PickerOption } from '@/components/ui/option-picker-field';
import { Text } from '@/components/ui/typography';

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
 * list; everything else ports unchanged. */
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
  const [actions, setActions] = useState<Record<string, WeeklyPriorityItem>>(() =>
    readWeeklyPriorities(existingActions)
  );
  const saveBucketActions = useSaveBucketActions();

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

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Outcomes"
      subtitle="What 1 to 3 outcomes matter most this week?"
      footer={
        <View className="gap-2.5">
          <Text variant="tiny" className="font-mono text-center">
            {totalWeeklySet}/3 Outcomes
          </Text>
          <View className="flex-row items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onPress={onClose} className="px-3">
              Cancel
            </Button>
            <Button size="sm" onPress={handleSave} disabled={saveBucketActions.isPending} className="px-4">
              {saveBucketActions.isPending ? 'Saving...' : 'Save Outcomes'}
            </Button>
          </View>
        </View>
      }
    >
      <View className="p-3 gap-4">
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
      </View>
    </StandardDialog>
  );
};
