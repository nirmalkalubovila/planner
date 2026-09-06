import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronDown, Clock, Edit2, Sparkles, Trash2, Trophy } from 'lucide-react-native';
import { BUCKET_META, calculateGoalProgress, type Goal, type GridState } from '@llb/core';
import { BUCKET_CLASSES } from '@/theme/bucket-classes';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import { GoalProgressBar } from './goal-progress-bar';
import { MasterActionPlan } from './master-action-plan';

interface GoalCardProps {
  goal: Goal;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  weekPlan?: GridState;
  completedDays?: Record<string, string[]>;
  currentWeek?: string;
  onUpdateGoal?: (goal: Goal) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  weekPlan,
  completedDays,
  currentWeek,
  onUpdateGoal,
}) => {
  const hasPlan = !!(goal.plans && goal.plans.length > 0);
  const milestones = goal.milestones || [];

  const { weeklyTasks, progressPercentage, completedWeeklyTasksCount, totalAllocatedHours } = useMemo(() => {
    let weeklyTasksList: { id: string; dayStr: string; name: string; time: string; dayName: string }[] = [];

    if (weekPlan && currentWeek) {
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < 48; s++) {
          const content = weekPlan[`${d}-${s}`];
          const isGoalTask = content && content.type === 'goal' && (content as any).goalId === goal.id;
          if (isGoalTask) {
            const startSlot = s;
            let endSlot = s;
            while (endSlot < 47) {
              const nextContent = weekPlan[`${d}-${endSlot + 1}`];
              const isNextGoalTask =
                nextContent && nextContent.type === 'goal' && (nextContent as any).goalId === goal.id && nextContent.name === content.name;
              if (isNextGoalTask) endSlot++;
              else break;
            }
            const startH = Math.floor(startSlot / 2);
            const startM = (startSlot % 2) * 30;
            const startTimeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
            const endH = Math.floor((endSlot + 1) / 2);
            const endM = ((endSlot + 1) % 2) * 30;
            const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            weeklyTasksList.push({
              id: `goal-${content.name}-${startSlot}`,
              dayStr: `${currentWeek}-${d + 1}`,
              name: content.name,
              dayName: DAYS[d],
              time: `${startTimeStr} - ${endTimeStr}`,
            });
            s = endSlot;
          }
        }
      }
    }

    const tasksWithStatus = weeklyTasksList.map((task) => ({
      ...task,
      isCompleted: !!(completedDays && completedDays[task.dayStr] && completedDays[task.dayStr].includes(task.id)),
    }));
    const completedWeekly = tasksWithStatus.filter((t) => t.isCompleted).length;
    const progressOverride = calculateGoalProgress(goal, currentWeek, weekPlan, completedDays);

    let totalSlotsCount = 0;
    if (weekPlan && currentWeek) {
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < 48; s++) {
          const content = weekPlan[`${d}-${s}`];
          if (content && content.type === 'goal' && (content as any).goalId === goal.id) totalSlotsCount++;
        }
      }
    }

    return {
      weeklyTasks: tasksWithStatus,
      progressPercentage: progressOverride,
      completedWeeklyTasksCount: completedWeekly,
      totalAllocatedHours: totalSlotsCount * 0.5,
    };
  }, [goal, weekPlan, completedDays, currentWeek]);

  const isCompleted = progressPercentage >= 100;
  const toneColor =
    goal.goalType === 'Week' ? '#34d399' : goal.goalType === 'Month' ? '#a78bfa' : '#facc15';
  const intensityOpacity = milestones.length > 0 ? Math.max(0.4, progressPercentage / 100) : 0.4;

  return (
    <View className="w-full">
      <View
        className={cn(
          'rounded-2xl border overflow-hidden flex-row',
          isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card'
        )}
      >
        <View className="w-1" style={{ backgroundColor: isCompleted ? toneColor : '#6366f1', opacity: intensityOpacity }} />

        <View className="flex-1 p-4 gap-2.5">
          <View className="flex-row items-start justify-between">
            <View className="flex-row flex-wrap items-center gap-1.5 flex-1 pr-2">
              <View className="bg-primary/15 border border-primary/20 px-1.5 py-0.5 rounded">
                <Text variant="tiny" className="text-primary font-black uppercase">
                  {goal.goalType}
                </Text>
              </View>
              {goal.bucket && BUCKET_META[goal.bucket] && (
                <View className={cn('px-1.5 py-0.5 rounded border', BUCKET_CLASSES[goal.bucket].badgeClass)}>
                  <Text variant="tiny" className={cn('font-black uppercase', BUCKET_CLASSES[goal.bucket].color)}>
                    {BUCKET_META[goal.bucket].label}
                  </Text>
                </View>
              )}
              {hasPlan && (
                <View className="bg-intent-goal-muted border border-intent-goal/20 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                  <Check size={8} color="#34d399" />
                  <Text variant="tiny" className="text-intent-goal font-black uppercase">
                    Plan
                  </Text>
                </View>
              )}
              {weeklyTasks.length > 0 && (
                <View className="bg-indigo-500/15 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                  <Text variant="tiny" className="text-indigo-400 font-black uppercase">
                    {completedWeeklyTasksCount}/{weeklyTasks.length} Done
                  </Text>
                </View>
              )}
              {totalAllocatedHours > 0 && (
                <View className="bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <Text variant="tiny" className="text-emerald-400 font-black uppercase">
                    {totalAllocatedHours}h Allocated
                  </Text>
                </View>
              )}
              {isCompleted && (
                <View className="px-1.5 py-0.5 rounded flex-row items-center gap-0.5 bg-emerald-500/20 border border-emerald-500/30">
                  {goal.goalType === 'Year' ? (
                    <Trophy size={8} color="#facc15" />
                  ) : goal.goalType === 'Month' ? (
                    <Sparkles size={8} color="#a78bfa" />
                  ) : (
                    <Check size={8} color="#34d399" />
                  )}
                  <Text variant="tiny" className="font-black uppercase text-emerald-400">
                    {goal.goalType === 'Week' ? 'Week Objective Met' : goal.goalType === 'Month' ? 'Month Goal Achieved' : 'Yearly Legacy Built'}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row gap-1">
              <Pressable onPress={() => goal.id && onToggle(goal.id)} className="h-7 w-7 items-center justify-center rounded-lg">
                <ChevronDown size={13} color="#a1a1aa" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
              </Pressable>
              {!isCompleted && (
                <Pressable onPress={() => onEdit(goal)} className="h-7 w-7 items-center justify-center rounded-lg">
                  <Edit2 size={13} color="#a1a1aa" />
                </Pressable>
              )}
              <Pressable onPress={() => goal.id && onDelete(goal.id)} className="h-7 w-7 items-center justify-center rounded-lg">
                <Trash2 size={13} color="#a1a1aa" />
              </Pressable>
            </View>
          </View>

          <Text
            className={cn('font-bold text-[15px]', isCompleted ? 'text-emerald-400' : 'text-foreground')}
            numberOfLines={1}
          >
            {goal.title || goal.name}
          </Text>

          {!!goal.name && (
            <Text variant="small" numberOfLines={2}>
              {goal.name.length > 100 ? `${goal.name.substring(0, 100)}...` : goal.name}
            </Text>
          )}

          <View className="flex-row items-center gap-1.5">
            <CalendarIcon size={10} color="#a1a1aa" />
            <Text variant="tiny">{goal.startDate ? format(parseISO(goal.startDate), 'MMM d') : 'N/A'}</Text>
            <Text variant="tiny">→</Text>
            <Text variant="tiny">End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d') : 'N/A'}</Text>
          </View>

          <GoalProgressBar milestones={milestones} progressPercentage={progressPercentage} startDate={goal.startDate} />
        </View>
      </View>

      {isExpanded && (
        <View className="mt-1 rounded-2xl border border-border bg-muted/30 overflow-hidden">
          {weeklyTasks.length > 0 && (
            <View className="p-4 border-b border-border gap-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text variant="tiny" className="text-primary font-bold uppercase tracking-widest">
                  This Week&apos;s Tasks
                </Text>
                <Text variant="tiny" className="font-bold">
                  {completedWeeklyTasksCount} / {weeklyTasks.length}
                </Text>
              </View>
              {weeklyTasks.map((task, idx) => (
                <View
                  key={idx}
                  className={cn(
                    'p-3 rounded-lg border',
                    task.isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-card border-border'
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={cn('text-xs font-semibold flex-1', task.isCompleted ? 'text-muted-foreground' : 'text-foreground')}
                      numberOfLines={1}
                    >
                      {task.name}
                    </Text>
                    {task.isCompleted && <Check size={12} color="#34d399" />}
                  </View>
                  <View className="flex-row items-center gap-1 mt-1">
                    <CalendarIcon size={10} color="#a1a1aa" />
                    <Text variant="tiny" className="uppercase font-bold">
                      {task.dayName}
                    </Text>
                    <Clock size={10} color="#a1a1aa" />
                    <Text variant="tiny" className="uppercase font-bold">
                      {task.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <MasterActionPlan goal={goal} onUpdate={onUpdateGoal} />
        </View>
      )}
    </View>
  );
};
