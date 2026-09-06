import React, { useState } from 'react';
import { View } from 'react-native';
import { Sparkles, Target } from 'lucide-react-native';
import { AIGeneratedPlanSlot, Goal } from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptionPickerField } from '@/components/ui/option-picker-field';
import { Text } from '@/components/ui/typography';

interface GoalToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeGoals: Goal[];
  selectedGoalId: string;
  setSelectedGoalId: (id: string) => void;
  onAllocate: (goalId: string, hours: number) => void;
}

const findNextActiveSlot = (goal: Goal): AIGeneratedPlanSlot | null => {
  if (!goal.plans) return null;

  const traverse = (slots: AIGeneratedPlanSlot[]): AIGeneratedPlanSlot | null => {
    for (const slot of slots) {
      const isCompleted = goal.milestones?.find(m => m.targetDate === slot.date)?.completed;
      if (!isCompleted) {
        if (slot.subPlans && slot.subPlans.length > 0) {
          const activeSub = traverse(slot.subPlans);
          if (activeSub) return activeSub;
        }
        return slot;
      }
    }
    return null;
  };

  const sortedPlans = goal.plans.slice().sort((a, b) => a.date.localeCompare(b.date));
  return traverse(sortedPlans);
};

/** RN port of apps/web/.../planner/forms/goal-tool-dialog.tsx.
 *
 * The hours field used to be blanked by an effect on open / goal change;
 * re-keying the body on those two values remounts it to an empty field
 * instead, which is the same thing without a setState from an effect. */
export const GoalToolDialog: React.FC<GoalToolDialogProps> = (props) => (
  <GoalToolDialogBody
    key={`${props.isOpen ? 'open' : 'closed'}:${props.selectedGoalId ?? ''}`}
    {...props}
  />
);

const GoalToolDialogBody: React.FC<GoalToolDialogProps> = ({
  isOpen,
  onClose,
  activeGoals,
  selectedGoalId,
  setSelectedGoalId,
  onAllocate,
}) => {
  const [hours, setHours] = useState<string>('');

  const activeGoal = activeGoals.find(g => g.id === selectedGoalId);
  const nextSlot = activeGoal ? findNextActiveSlot(activeGoal) : null;

  const handleAllocate = () => {
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0 || h % 0.5 !== 0) return;
    onAllocate(selectedGoalId, h);
  };

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Goal Strategy"
      icon={Target}
      footer={
        <View className="gap-3">
          <Button disabled={!selectedGoalId || !hours} onPress={handleAllocate} className="rounded-xl h-12">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#0a0a0a" />
              <Text className="text-primary-foreground font-bold">Auto-Allocate Time Blocks</Text>
            </View>
          </Button>
          <Button variant="ghost" onPress={onClose} className="rounded-xl h-11">
            Cancel
          </Button>
        </View>
      }
    >
      <View className="p-5 gap-6">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase font-bold ml-1">
            Select Goal to Focus On
          </Text>
          <OptionPickerField
            value={selectedGoalId}
            onValueChange={setSelectedGoalId}
            emptyOptionLabel="-- Choose Goal --"
            title="Select a goal"
            options={activeGoals.map(g => ({ value: g.id || '', label: g.title || g.name }))}
          />
        </View>

        {!!activeGoal && (
          <View className="bg-primary/5 rounded-xl p-4 border border-primary/10 gap-3">
            <View>
              <Text className="font-bold text-sm mb-1">Next Pending Phase:</Text>
              <Text className="text-sm font-medium text-primary">{nextSlot ? nextSlot.dayTask : activeGoal.title || activeGoal.name}</Text>
              <Text variant="tiny" className="mt-0.5">
                {nextSlot?.date ? `Target: ${nextSlot.date}` : `Overall Goal: ${activeGoal.purpose}`}
              </Text>
            </View>
            <View className="gap-1.5 pt-2 border-t border-primary/10">
              <Text variant="tiny" className="uppercase font-bold">
                Hours to Allocate this week
              </Text>
              <Input
                keyboardType="decimal-pad"
                value={hours}
                onChangeText={setHours}
                placeholder="e.g. 5 or 5.5"
                className="text-sm font-medium h-10"
              />
              <View className="flex-row justify-between items-center mt-1">
                <Text variant="tiny">Accepts integers or half-hours (e.g., 2.5)</Text>
                {!!nextSlot?.estimatedHours && (
                  <Text variant="tiny" className="font-semibold text-emerald-500">
                    AI: {nextSlot.estimatedHours} hrs
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </StandardDialog>
  );
};
