import React from 'react';
import { Pressable, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Clock } from 'lucide-react-native';
import {
  useGetCompletedTasks,
  useGetHabits,
  useGetWeekBucketActions,
  useGetWeekPlan,
  useToggleCompletedTask,
} from '@llb/api';
import { WeekUtils } from '@llb/core';

import { Text } from '@/components/ui/typography';
import { ActiveTheme } from '@/features/today/components/active-theme';
import { WeeklyTargetsBanner } from '@/features/today/components/weekly-targets-banner';
import { useTodayTasks, type TaskItem } from '@/features/today/hooks/use-today-tasks';
import { cn } from '@/lib/cn';

const TYPE_BADGE_CLASSES: Record<string, string> = {
  habit: 'bg-blue-500/10 border-blue-500/20',
  goal: 'bg-purple-500/10 border-purple-500/20',
  custom: 'bg-amber-500/10 border-amber-500/20',
};
const TYPE_BADGE_TEXT: Record<string, string> = {
  habit: 'text-blue-400/80',
  goal: 'text-purple-400/80',
  custom: 'text-amber-400/80',
};

/** Port of apps/web/src/features/today/today-page.tsx — the real Today
 * feature (replacing the Phase 5 vertical-slice placeholder): the derived
 * task list from goals/habits/the week plan, the weekly-outcome banner, and
 * one of 8 gamified daily "themes" chosen by a stable per-day hash. */
export default function TodayScreen() {
  const currentWeek = WeekUtils.getCurrentWeek();
  const currentDayStr = WeekUtils.getCurrentDay();
  const dayIdx = parseInt(currentDayStr.split('-')[2], 10) - 1;

  const { data: weekPlan } = useGetWeekPlan(currentWeek);
  const { data: bucketActions = {} } = useGetWeekBucketActions(currentWeek);
  const { data: habits } = useGetHabits();
  const { data: completedTasks } = useGetCompletedTasks(currentDayStr);
  const toggleTask = useToggleCompletedTask();

  const { tasks, pointsData } = useTodayTasks(weekPlan, habits, dayIdx, completedTasks);

  const handleToggle = (taskId: string) => toggleTask.mutate({ dayStr: currentDayStr, taskId });
  const isTaskCompleted = (taskId: string) => (completedTasks || []).includes(taskId);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <FlatList<TaskItem>
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-3"
        ListHeaderComponent={
          <View className="gap-4 mb-1">
            <View className="flex-row items-end justify-between pb-4 border-b border-border">
              {/* Same eyebrow + rule + sub-label shape every other screen
                  header uses (Statistics' "PERFORMANCE / STATISTICS",
                  Profile's "PROFILE / SETTINGS"). */}
              <View className="gap-2 flex-1 min-w-0">
                <Text variant="tiny" className="uppercase tracking-[0.3em] font-bold" numberOfLines={1}>
                  Today&apos;s Schedule
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-1 w-12 bg-primary/40 rounded-full" />
                  <Text variant="tiny" className="font-black uppercase">
                    {tasks.length} TASKS
                  </Text>
                </View>
              </View>
              {tasks.length > 0 && (
                <View className="flex-row items-center gap-1.5 bg-muted border border-border px-2.5 py-1.5 rounded-lg">
                  <Text className="text-xs font-bold text-foreground">{(completedTasks || []).length}</Text>
                  <Text variant="tiny">/</Text>
                  <Text variant="tiny" className="font-bold">
                    {tasks.length}
                  </Text>
                </View>
              )}
            </View>

            <WeeklyTargetsBanner bucketActions={bucketActions} currentDayStr={currentDayStr} />

            {tasks.length > 0 && (
              <ActiveTheme
                completedPoints={pointsData.completedPoints}
                totalPoints={pointsData.totalPoints}
                completedTasksCount={(completedTasks || []).length}
                totalTasksCount={tasks.length}
                currentDayStr={currentDayStr}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-24 px-6">
            <Clock size={64} color="#3f3f46" strokeWidth={1} />
            <Text className="text-xl font-bold text-muted-foreground mt-6">No Tasks for Today</Text>
            <Text variant="muted" className="text-center mt-3">
              Your schedule is clear. Use the Week Planner to architect your legacy.
            </Text>
          </View>
        }
        renderItem={({ item: task }) => {
          const completed = isTaskCompleted(task.id);
          return (
            <Pressable
              onPress={() => handleToggle(task.id)}
              className={cn(
                'flex-row items-center justify-between p-4 rounded-2xl border',
                completed
                  ? 'bg-muted/30 border-border opacity-50'
                  : task.isReminder
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-card border-border'
              )}
            >
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                {completed ? (
                  <View
                    className={cn(
                      'w-6 h-6 rounded-full items-center justify-center border',
                      task.isReminder ? 'bg-rose-500/10 border-rose-500/30' : 'bg-intent-goal-muted border-intent-goal/30'
                    )}
                  >
                    <Check size={14} color={task.isReminder ? '#f43f5e' : '#34d399'} />
                  </View>
                ) : (
                  <View className={cn('w-6 h-6 rounded-full border-2 items-center justify-center', task.isReminder ? 'border-rose-500/40' : 'border-border')} />
                )}
                <View className="flex-1 min-w-0">
                  <Text className={cn('font-bold text-sm', completed && 'text-muted-foreground line-through')} numberOfLines={1}>
                    {task.name}
                  </Text>
                  {!!task.description && (
                    <Text variant="small" className={cn('mt-0.5', completed && 'line-through')} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Clock size={11} color={task.isReminder ? '#fb7185' : '#a1a1aa'} />
                    <Text variant="tiny" className="uppercase font-bold">
                      {task.isReminder ? `At ${task.startTime}` : `${task.startTime} - ${task.endTime}`}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                className={cn(
                  'px-2 py-0.5 rounded-md border ml-2',
                  task.isReminder ? 'bg-rose-500/10 border-rose-500/20' : TYPE_BADGE_CLASSES[task.type] || 'border-border'
                )}
              >
                <Text
                  variant="tiny"
                  className={cn('font-black uppercase', task.isReminder ? 'text-rose-400/80' : TYPE_BADGE_TEXT[task.type])}
                >
                  {task.isReminder ? 'reminder' : task.type}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
