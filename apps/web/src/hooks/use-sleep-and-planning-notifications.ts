import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import { dayKey, notificationKey } from '@llb/core';

function getDayNumber(dayName: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName.toLowerCase()] ?? 0;
}

/**
 * Bedtime and weekly-planning reminders.
 *
 * The wake-up ("Good Morning!") notification that used to live here is
 * gone: the server's morning digest already greets the user and adds the
 * day's agenda, and having both meant two near-identical notifications in
 * the same minute — plus two more from the cron function. The morning is
 * now one message with one owner.
 *
 * Dedupe no longer uses this hook's own localStorage keys either. It reads
 * the store's shownKeys with the canonical key builder, so the in-app entry
 * and the server's push agree on what "already sent" means.
 */
export function useSleepAndPlanningNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const { profile } = useUserProfile(user);
  const preferences = useNotificationStore((s) => s.preferences);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!userId || !preferences.enabled || !profile) return;

    const checkTimeAndNotify = () => {
      const now = new Date();
      const today = dayKey(now);
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const { shownKeys, deletedKeys } = useNotificationStore.getState();

      const alreadyHandled = (key: string) =>
        shownKeys.includes(key) || deletedKeys.includes(key);

      // ─── Bedtime ───
      if (preferences.sleepNotifications !== false) {
        const sleepStart = profile.sleepStart || '22:00';
        const [sleepH, sleepM] = sleepStart.split(':').map(Number);
        const isSleepTime = currentH === sleepH && currentM >= sleepM && currentM < sleepM + 5;
        const dedupKey = notificationKey('sleep_start', today);

        if (isSleepTime && !alreadyHandled(dedupKey)) {
          addNotification({
            type: 'sleep_start',
            title: 'Bedtime Reminder',
            body: "It's time to sleep. Wind down and get some rest!",
            actionUrl: '/today',
            dedupKey,
          });
        }
      }

      // ─── Weekly planning session ───
      if (preferences.weeklyPlanning !== false) {
        const planDayNum = getDayNumber(profile.planDay || 'Sunday');
        const planTime = profile.planStartTime || '21:00';
        const [planH, planM] = planTime.split(':').map(Number);

        const isPlanDay = now.getDay() === planDayNum;
        const isPlanTime = currentH === planH && currentM >= planM && currentM < planM + 5;
        const dedupKey = notificationKey('weekly_planning', today);

        if (isPlanDay && isPlanTime && !alreadyHandled(dedupKey)) {
          addNotification({
            type: 'weekly_planning',
            title: 'Weekly Planning',
            body: `It's time for your weekly planning session (${planTime}). Set your goals and build your legacy!`,
            actionUrl: '/planner',
            dedupKey,
          });
        }
      }
    };

    checkTimeAndNotify();
    const interval = setInterval(checkTimeAndNotify, 60_000);

    return () => clearInterval(interval);
  }, [userId, profile, preferences, addNotification]);
}
