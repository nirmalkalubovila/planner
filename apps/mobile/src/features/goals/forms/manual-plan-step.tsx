import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { ArrowRight, Calendar } from 'lucide-react-native';
import type { AIGeneratedPlanSlot, Goal } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';

interface ManualPlanStepProps {
  goal: Goal;
  onSave: (plans: AIGeneratedPlanSlot[]) => void;
  onBack: () => void;
}

export const ManualPlanStep: React.FC<ManualPlanStepProps> = ({ goal, onSave, onBack }) => {
  const [plans, setPlans] = useState<AIGeneratedPlanSlot[]>(
    goal.milestones?.map((m) => ({ date: m.targetDate, dayTask: '', description: '' })) || []
  );

  const updatePlan = (index: number, field: 'dayTask' | 'description', value: string) => {
    const next = [...plans];
    next[index] = { ...next[index], [field]: value };
    setPlans(next);
  };

  const isComplete = plans.every((p) => p.dayTask.trim() !== '');

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between pb-4 border-b border-border">
        <View>
          <Text className="text-xl font-black text-foreground">Craft Your Plan</Text>
          <Text variant="small">Define your core tasks for each milestone phase.</Text>
        </View>
      </View>

      <View className="gap-4">
        {plans.map((plan, index) => {
          const milestone = goal.milestones?.[index];
          return (
            <View key={index} className="p-4 rounded-2xl border-2 border-border/50 bg-card/50 gap-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-xs font-black text-primary">{index + 1}</Text>
                </View>
                <View>
                  <Text className="text-sm font-black uppercase tracking-wider text-foreground">
                    {milestone?.title || `Phase ${index + 1}`}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Calendar size={10} color="#a1a1aa" />
                    <Text variant="tiny" className="font-bold uppercase">
                      {plan.date}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="gap-2">
                <Text variant="tiny" className="text-primary/80 font-black uppercase">
                  Core Task Name
                </Text>
                <Input
                  value={plan.dayTask}
                  onChangeText={(v) => updatePlan(index, 'dayTask', v)}
                  placeholder="What is the main task for this milestone?"
                />
              </View>
              <View className="gap-2">
                <Text variant="tiny" className="text-primary/80 font-black uppercase">
                  Strategy & Details
                </Text>
                <TextInput
                  value={plan.description}
                  onChangeText={(v) => updatePlan(index, 'description', v)}
                  placeholder="Describe how you will achieve this..."
                  placeholderTextColor="#71717a"
                  multiline
                  textAlignVertical="top"
                  className="w-full min-h-[80px] rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground"
                  style={{ includeFontPadding: false }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {!isComplete && (
        <Text variant="small" className="text-destructive text-center font-bold">
          Please provide a task name for all milestone phases.
        </Text>
      )}

      <View className="flex-row gap-3">
        <Button variant="outline" onPress={onBack} className="flex-1">
          Back
        </Button>
        <Button onPress={() => onSave(plans)} disabled={!isComplete} className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-primary-foreground font-black text-xs">Save Master Plan</Text>
            <ArrowRight size={14} color="#000000" />
          </View>
        </Button>
      </View>
    </View>
  );
};
