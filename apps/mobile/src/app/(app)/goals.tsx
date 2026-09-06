import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import { randomUUID } from 'expo-crypto';
import { Plus, Target, Trophy } from 'lucide-react-native';
import {
  useCreateGoal,
  useDeleteGoal,
  useGetGoals,
  useGetWeekCompletedTasks,
  useGetWeekPlan,
  useUpdateGoal,
} from '@llb/api';
import { calculateGoalProgress, toast, WeekUtils, type Goal, type Milestone } from '@llb/core';

import { AILoadingPopup } from '@/components/common/ai-loading-popup';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from '@/components/ui/typography';
import { GoalCard } from '@/features/goals/components/goal-card';
import { MilestoneStrategyDialog } from '@/features/goals/components/strategy-choice-dialog';
import { AIGenerationStep } from '@/features/goals/forms/ai-generation-step';
import { GoalDefinitionForm, type GoalFormValues } from '@/features/goals/forms/goal-definition-form';
import { ManualPlanStep } from '@/features/goals/forms/manual-plan-step';
import { useAiPlanGeneration } from '@/features/goals/hooks/use-ai-plan-generation';
import { useAuth } from '@/contexts/auth-context';

function buildMilestones(values: GoalFormValues): { milestones: Milestone[]; endDate: string } {
  const start = parseISO(values.startDate);
  let end = start;
  const milestones: Milestone[] = [];
  for (let i = 1; i <= (values.durationValue || 1); i++) {
    let milestoneDate = new Date(start);
    let title = '';
    if (values.goalType === 'Week') {
      milestoneDate = addWeeks(start, i);
      title = `End of Week ${i}`;
    } else if (values.goalType === 'Month') {
      milestoneDate = addMonths(start, i);
      title = `End of Month ${i}`;
    } else if (values.goalType === 'Year') {
      milestoneDate = addYears(start, i);
      title = `End of Year ${i}`;
    }
    end = milestoneDate;
    milestones.push({ id: randomUUID(), title, targetDate: format(milestoneDate, 'yyyy-MM-dd'), completed: false });
  }
  return { milestones, endDate: format(end, 'yyyy-MM-dd') };
}

/** Port of apps/web/src/features/goals/goals-page.tsx. See
 * features/goals/components/master-action-plan.tsx for the one deliberate
 * scope cut (the recursive AI Year->Month->Week drill-down). Everything
 * else — goal creation, AI plan generation via the same `generate-ai-plan`
 * edge function, manual planning, progress tracking — is fully wired. */
export default function GoalsScreen() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [strategyPendingData, setStrategyPendingData] = useState<Goal | null>(null);
  const [showAiLoader, setShowAiLoader] = useState(false);

  const { generating, tempPlan, generatePlan, clearTempPlan } = useAiPlanGeneration(user);

  // `showAiLoader` covers the gap between the user picking the AI strategy
  // and `generating` actually flipping true; once it has, the optimistic
  // flag hands off (the popup below is open on either). Written as React's
  // documented "adjust state while rendering" pattern rather than an
  // effect — an effect here would render one frame with both flags set
  // before correcting itself.
  const [prevGenerating, setPrevGenerating] = useState(generating);
  if (generating !== prevGenerating) {
    setPrevGenerating(generating);
    if (generating && showAiLoader) setShowAiLoader(false);
  }

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<GoalFormValues | null>(null);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: goals = [], isLoading } = useGetGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const currentWeek = WeekUtils.getCurrentWeek();
  const { data: weekPlan } = useGetWeekPlan(currentWeek);
  const currentWeekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => `${currentWeek}-${i + 1}`), [currentWeek]);
  const { data: completedDays } = useGetWeekCompletedTasks(currentWeekDays);

  const closeDialog = () => {
    setIsFormOpen(false);
    setActiveGoal(null);
    setStep(1);
    clearTempPlan();
  };

  const toggleGoal = (id: string) => setExpandedGoals((prev) => ({ ...prev, [id]: !prev[id] }));

  const openNewGoal = () => {
    setActiveGoal(null);
    setStep(1);
    clearTempPlan();
    setIsFormOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setActiveGoal(goal);
    setStep(1);
    clearTempPlan();
    setIsFormOpen(true);
  };

  const isEditing = !!activeGoal?.id;

  const executeDirectSave = (values: GoalFormValues) => {
    if (!activeGoal?.id) return;
    const { milestones, endDate } = buildMilestones(values);
    updateGoal.mutate(
      { ...activeGoal, ...values, endDate, milestones },
      { onSuccess: () => { closeDialog(); toast.success('Goal updated successfully'); } }
    );
  };

  const executeDefinitionSubmit = (values: GoalFormValues) => {
    const { milestones, endDate } = buildMilestones(values);
    const goalData: Goal = { ...values, endDate, milestones, plans: activeGoal?.plans || [] };
    if (activeGoal?.id) goalData.id = activeGoal.id;
    setStrategyPendingData(goalData);
    setShowStrategyDialog(true);
  };

  const onDefinitionSubmit = (values: GoalFormValues, mode: 'save' | 'replan' = 'replan') => {
    if (activeGoal?.id) {
      if (mode === 'save') executeDirectSave(values);
      else {
        setPendingValues(values);
        setShowConfirm(true);
      }
    } else {
      executeDefinitionSubmit(values);
    }
  };

  const handleStrategySelect = (type: 'ai' | 'manual') => {
    if (!strategyPendingData) return;
    setShowStrategyDialog(false);
    if (type === 'ai') setShowAiLoader(true);

    const mutation = isEditing ? updateGoal : createGoal;
    mutation.mutate(strategyPendingData, {
      onSuccess: (data: Goal) => {
        setActiveGoal(data);
        if (type === 'ai') {
          setStep(2);
          generatePlan(data);
        } else {
          setStep(3);
        }
      },
      onError: () => setShowAiLoader(false),
    });
  };

  const handleGeneratePlan = async () => {
    if (!activeGoal) return;
    await generatePlan(activeGoal);
  };

  const handleConfirmPlan = () => {
    if (!activeGoal || !tempPlan) return;
    updateGoal.mutate(
      { ...activeGoal, plans: tempPlan },
      {
        onSuccess: () => {
          closeDialog();
          toast.success('Goal added to your planner', { description: 'AI action plan saved' });
        },
        onError: (err: any) => toast.error('DB Error: ' + err.message),
      }
    );
  };

  const dialogTitle = step === 1 ? (isEditing ? 'Edit Goal' : 'New Goal') : step === 2 ? 'AI Plan Preview' : 'Manual Plan';
  const dialogSubtitle = step === 1 ? 'Set up your goal' : step === 2 ? 'Review your AI-generated roadmap' : 'Define milestones manually';

  const { activeGoals, completedGoals } = useMemo(() => {
    const active: Goal[] = [];
    const completed: Goal[] = [];
    goals.forEach((goal: Goal) => {
      const progress = calculateGoalProgress(goal, currentWeek, weekPlan, completedDays);
      (progress >= 100 ? completed : active).push(goal);
    });
    return { activeGoals: active, completedGoals: completed };
  }, [goals, weekPlan, completedDays, currentWeek]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <View className="flex-row items-end justify-between px-4 pt-4 pb-4 border-b border-border">
        <View className="gap-2">
          <Text variant="tiny" className="uppercase tracking-[0.3em] font-bold">
            Goal Matrix
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-1 w-12 bg-primary/40 rounded-full" />
            <Text variant="tiny" className="font-black uppercase">
              {goals.length} STRATEGIC OBJECTIVES
            </Text>
          </View>
        </View>
        <Pressable onPress={openNewGoal} className="h-10 w-10 items-center justify-center rounded-full active:bg-accent">
          <Plus size={26} strokeWidth={2.5} color="#e4e4e7" />
        </Pressable>
      </View>

      {isLoading ? (
        <PageLoader />
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-4">
          {goals.length === 0 ? (
            <View className="items-center py-24 px-6">
              <Target size={64} color="#3f3f46" strokeWidth={1} />
              <Text className="text-xl font-bold text-muted-foreground mt-6">Matrix Inactive</Text>
              <Text variant="muted" className="text-center mt-3">
                Initialize a strategic objective to begin legacy construction.
              </Text>
              <Pressable onPress={openNewGoal} className="mt-6">
                <Text variant="tiny" className="text-primary font-bold uppercase tracking-widest">
                  + Begin Definition
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isExpanded={!!expandedGoals[goal.id!]}
                  onToggle={toggleGoal}
                  onEdit={handleEdit}
                  onDelete={(id) => { setGoalIdToDelete(id); setShowDeleteConfirm(true); }}
                  weekPlan={weekPlan || {}}
                  completedDays={completedDays || {}}
                  currentWeek={currentWeek}
                  onUpdateGoal={(updated) => updateGoal.mutate(updated)}
                />
              ))}

              {completedGoals.length > 0 && (
                <>
                  <View className="flex-row items-center gap-3 pt-2">
                    <View className="flex-1 h-px bg-border" />
                    <View className="flex-row items-center gap-1.5">
                      <Trophy size={12} color="#34d399" />
                      <Text variant="tiny" className="font-black uppercase">
                        Completed ({completedGoals.length})
                      </Text>
                    </View>
                    <View className="flex-1 h-px bg-border" />
                  </View>
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isExpanded={!!expandedGoals[goal.id!]}
                      onToggle={toggleGoal}
                      onEdit={handleEdit}
                      onDelete={(id) => { setGoalIdToDelete(id); setShowDeleteConfirm(true); }}
                      weekPlan={weekPlan || {}}
                      completedDays={completedDays || {}}
                      currentWeek={currentWeek}
                      onUpdateGoal={(updated) => updateGoal.mutate(updated)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      <StandardDialog isOpen={isFormOpen} onClose={closeDialog} title={dialogTitle} subtitle={dialogSubtitle} icon={Target}>
        {step === 1 ? (
          <GoalDefinitionForm
            key={activeGoal?.id || 'new'}
            isEditing={isEditing}
            initialValues={
              activeGoal
                ? {
                    title: activeGoal.title || activeGoal.name,
                    name: activeGoal.name,
                    goalType: activeGoal.goalType,
                    purpose: activeGoal.purpose || '',
                    startDate: activeGoal.startDate,
                    durationValue: activeGoal.milestones?.length || 1,
                    bucket: activeGoal.bucket,
                  }
                : {}
            }
            onSubmit={onDefinitionSubmit}
          />
        ) : step === 2 ? (
          <View className="p-5">
            <AIGenerationStep
              onGenerate={handleGeneratePlan}
              generating={generating}
              previewPlan={tempPlan}
              onConfirm={handleConfirmPlan}
              onCancelPreview={() => { clearTempPlan(); setStep(1); }}
            />
          </View>
        ) : activeGoal ? (
          <View className="p-5">
            <ManualPlanStep
              goal={activeGoal}
              onBack={() => setStep(1)}
              onSave={(plans) => {
                updateGoal.mutate(
                  { ...activeGoal, plans },
                  {
                    onSuccess: () => {
                      closeDialog();
                      toast.success('Goal added to your planner', { description: 'Manual action plan saved' });
                    },
                  }
                );
              }}
            />
          </View>
        ) : null}
      </StandardDialog>

      <MilestoneStrategyDialog isOpen={showStrategyDialog} onClose={() => setShowStrategyDialog(false)} onSelect={handleStrategySelect} />

      <AILoadingPopup isOpen={showAiLoader || generating} />

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => pendingValues && executeDefinitionSubmit(pendingValues)}
        title="Update Goal?"
        description="Editing this goal will reset the current plan. You'll need to regenerate it."
        confirmText="Continue"
      />
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (goalIdToDelete) {
            deleteGoal.mutate(goalIdToDelete);
            setGoalIdToDelete(null);
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete Goal?"
        description="This will permanently delete this goal and all its plans. This can't be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </SafeAreaView>
  );
}
