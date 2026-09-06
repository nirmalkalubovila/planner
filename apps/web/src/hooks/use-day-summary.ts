import { useEffect } from 'react';
import { useGetWeekPlan } from '@llb/api';
import { useGetHabits } from '@llb/api';
import { useGetCompletedTasks } from '@llb/api';
import { WeekUtils, dayKey, isStale, notificationKey } from '@llb/core';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@llb/notifications';
import { useAuth } from '@/contexts/auth-context';

/**
 * The evening digest — one reflective notification at bedtime that closes
 * out the day.
 *
 * This absorbed the per-task overdue alerts that used to fire on a 60s
 * poll throughout the afternoon. Nagging each task as its end time passed
 * produced a stream of interruptions about work the user could already
 * see on the Today screen; one honest summary at the end of the day says
 * the same thing once, at a moment when it's actually actionable.
 */
export function useDaySummary() {
  const { user } = useAuth();
  const userId = user?.id;
  const currentWeek = WeekUtils.getCurrentWeek();
  const currentDayStr = WeekUtils.getCurrentDay();
  const dayIdx = parseInt(currentDayStr.split('-')[2]) - 1;

  const { data: weekPlan } = useGetWeekPlan(currentWeek);
  const { data: habits } = useGetHabits();
  const { data: completedTasks } = useGetCompletedTasks(currentDayStr);

  const { tasks } = useTodayTasks(weekPlan, habits, dayIdx, completedTasks);

  const preferences = useNotificationStore((s) => s.preferences);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!userId || !preferences.enabled || !preferences.quietHoursStart) return;
    if (preferences.daySummary === false && (preferences.overdueTasks ?? preferences.taskReminders) === false) return;
    if (!weekPlan || !habits) return; // Wait for data

    const checkSleepTime = () => {
      const now = new Date();
      const today = dayKey(now);
      const dedupKey = notificationKey('day_summary', today);

      const { shownKeys, deletedKeys } = useNotificationStore.getState();
      if (shownKeys.includes(dedupKey) || deletedKeys.includes(dedupKey)) return;

      const [sleepH, sleepM] = preferences.quietHoursStart.split(':').map(Number);
      const intendedAt = new Date(now);
      intendedAt.setHours(sleepH, sleepM, 0, 0);

      if (now.getTime() < intendedAt.getTime()) return; // not bedtime yet
      // Opening the app at 3am shouldn't replay last night's summary.
      if (isStale('day_summary', intendedAt, now)) return;

      const totalTasks = tasks.length;
      const completedCount = (completedTasks || []).filter(id =>
        tasks.some(t => t.id === id)
      ).length;
      const missed = totalTasks - completedCount;

      let title = 'Reflect & Recharge';
      let body = '';

      if (totalTasks === 0) {
        title = 'Peaceful Evening';
        body = 'Nothing was scheduled today. Rest is part of the work — sleep well.';
      } else if (completedCount === totalTasks) {
        title = 'A Masterclass Day';
        body = `All ${completedCount}/${totalTasks} tasks done. Your discipline is compounding. Rest deeply.`;
      } else if (completedCount >= totalTasks / 2) {
        title = 'Proud of Your Progress';
        body = `${completedCount}/${totalTasks} done, ${missed} left unfinished. Brick by brick. Sleep well and recharge.`;
      } else {
        title = 'Tomorrow is a New Canvas';
        body = `${completedCount}/${totalTasks} done, ${missed} went uncompleted. Productivity has seasons — forgive the list and sleep peacefully.`;
      }

      addNotification({
        type: 'day_summary',
        title,
        body,
        actionUrl: '/statistics',
        dedupKey,
      });
    };

    checkSleepTime();
    const interval = setInterval(checkSleepTime, 60_000);

    return () => clearInterval(interval);
  }, [userId, weekPlan, habits, tasks, completedTasks, preferences, addNotification]);
}
