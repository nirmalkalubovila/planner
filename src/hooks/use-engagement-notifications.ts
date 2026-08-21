import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';

const STORAGE_KEY_MIDDAY = 'llb-midday-checkin';
const STORAGE_KEY_STREAK_RISK = 'llb-habit-streak-risk';

/**
 * Client-side engagement notifications for when the app is open.
 * - Midday Check-In: Between 12:00-14:00 (once/day, userId-scoped)
 * - Habit Streak Risk: At 18:00 (once/day, userId-scoped)
 * All localStorage keys are scoped per-user.
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
      const today = now.toDateString();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // --- 1. Midday Check-In (12:00-14:00) ---
      if (preferences.middayCheckin !== false) {
        const isMidday = currentH >= 12 && currentH < 14;
        const lastMidday = localStorage.getItem(`${STORAGE_KEY_MIDDAY}-${userId}`);

        if (isMidday && lastMidday !== today) {
          const totalTaskCount = tasks.length;
          const completedCount = (completedTasks || []).filter(id =>
            tasks.some(t => t.id === id)
          ).length;
          const remaining = totalTaskCount - completedCount;

          // Only send if there are tasks and not all completed
          if (totalTaskCount > 0 && remaining > 0) {
            localStorage.setItem(`${STORAGE_KEY_MIDDAY}-${userId}`, today);

            const title = 'Midday Check-In';
            const body = `You've completed ${completedCount}/${totalTaskCount} tasks so far. ${remaining} remaining -- keep the momentum going!`;
            const dedupKey = `midday-checkin-${today}`;

            sendNotification(title, {
              body,
              url: '/today',
              tag: 'midday-checkin',
              notificationType: 'midday_checkin',
            }, preferences);

            addNotification({
              type: 'midday_checkin',
              title,
              body,
              actionUrl: '/today',
              dedupKey,
            });
          }
        }
      }

      // --- 2. Habit Streak Risk (18:00-18:05) ---
      if (preferences.habitStreakRisk !== false) {
        const isEvening = currentH === 18 && currentM >= 0 && currentM < 5;
        const lastStreakRisk = localStorage.getItem(`${STORAGE_KEY_STREAK_RISK}-${userId}`);

        if (isEvening && lastStreakRisk !== today) {
          // Count habit tasks scheduled for today
          const habitTasks = tasks.filter(t => t.type === 'habit');
          const habitCompletedCount = habitTasks.filter(t =>
            (completedTasks || []).includes(t.id)
          ).length;

          // Only send if user has habits but none completed today
          if (habitTasks.length > 0 && habitCompletedCount === 0) {
            localStorage.setItem(`${STORAGE_KEY_STREAK_RISK}-${userId}`, today);

            const title = 'Habit Streak at Risk';
            const body = `Your streak might break today -- you still have ${habitTasks.length} habit${habitTasks.length !== 1 ? 's' : ''} to complete.`;
            const dedupKey = `habit-streak-risk-${today}`;

            sendNotification(title, {
              body,
              url: '/today',
              tag: 'habit-streak-risk',
              notificationType: 'habit_streak_risk',
            }, preferences);

            addNotification({
              type: 'habit_streak_risk',
              title,
              body,
              actionUrl: '/today',
              dedupKey,
            });
          }
        }
      }
    };

    // Check on load, then every 30 seconds
    checkEngagement();
    const interval = setInterval(checkEngagement, 30_000);

    return () => clearInterval(interval);
  }, [userId, tasks, completedTasks, habits, preferences, addNotification]);
}
