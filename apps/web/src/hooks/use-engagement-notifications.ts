import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGetWeekPlan } from '@llb/api';
import { useGetHabits } from '@llb/api';
import { useGetCompletedTasks } from '@llb/api';
import { WeekUtils, dayKey, notificationKey } from '@llb/core';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@llb/notifications';

/**
 * Client-side engagement notifications for when the app is open.
 * - Midday Check-In: Between 12:00-14:00 (opt-in, off by default)
 * - Habit Streak Risk: At 18:00
 *
 * Both are Tier 2 and sit near the bottom of the priority order, so on a
 * busy day they yield their slot to a goal deadline or a digest rather
 * than crowding it out. Dedupe reads the store's shownKeys through the
 * canonical key builder instead of this hook's own localStorage scheme.
 */
export function useEngagementNotifications() {
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
    if (!userId || !preferences.enabled) return;

    const checkEngagement = () => {
      const now = new Date();
      const today = dayKey(now);
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const { shownKeys, deletedKeys } = useNotificationStore.getState();

      const alreadyHandled = (key: string) =>
        shownKeys.includes(key) || deletedKeys.includes(key);

      // --- 1. Midday Check-In (12:00-14:00, opt-in) ---
      if (preferences.middayCheckin === true) {
        const isMidday = currentH >= 12 && currentH < 14;
        const dedupKey = notificationKey('midday_checkin', today);

        if (isMidday && !alreadyHandled(dedupKey)) {
          const totalTaskCount = tasks.length;
          const completedCount = (completedTasks || []).filter(id =>
            tasks.some(t => t.id === id)
          ).length;
          const remaining = totalTaskCount - completedCount;

          if (totalTaskCount > 0 && remaining > 0) {
            addNotification({
              type: 'midday_checkin',
              title: 'Midday Check-In',
              body: `${completedCount}/${totalTaskCount} done, ${remaining} to go. Keep the momentum.`,
              actionUrl: '/today',
              dedupKey,
            });
          }
        }
      }

      // --- 2. Habit Streak Risk (18:00-18:05) ---
      if (preferences.habitStreakRisk !== false) {
        const isEvening = currentH === 18 && currentM >= 0 && currentM < 5;
        const dedupKey = notificationKey('habit_streak_risk', today);

        if (isEvening && !alreadyHandled(dedupKey)) {
          const habitTasks = tasks.filter(t => t.type === 'habit');
          const habitCompletedCount = habitTasks.filter(t =>
            (completedTasks || []).includes(t.id)
          ).length;

          if (habitTasks.length > 0 && habitCompletedCount === 0) {
            addNotification({
              type: 'habit_streak_risk',
              title: 'Habit Streak at Risk',
              body: `${habitTasks.length} habit${habitTasks.length !== 1 ? 's' : ''} still untouched today.`,
              actionUrl: '/today',
              dedupKey,
            });
          }
        }
      }
    };

    // Check on load, then every minute
    checkEngagement();
    const interval = setInterval(checkEngagement, 60_000);

    return () => clearInterval(interval);
  }, [userId, tasks, completedTasks, habits, preferences, addNotification]);
}
