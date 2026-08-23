import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { useNotificationStore } from '@/lib/notification-store';

const STORAGE_KEY_SLEEP_START = 'llb-last-sleep-start-date';
const STORAGE_KEY_SLEEP_END = 'llb-last-sleep-end-date';
const STORAGE_KEY_WEEKLY_PLANNING = 'llb-last-weekly-planning-date';

// Helper to scope localStorage keys per-user
function userKey(baseKey: string, userId: string): string {
  return `${baseKey}-${userId}`;
}

function getWakeUpTime(sleepStart: string, sleepDuration: string): string {
  const [h, m] = sleepStart.split(':').map(Number);
  const dur = parseInt(sleepDuration, 10) || 8;
  const totalMinutes = h * 60 + m + dur * 60;
  const wakeUpH = Math.floor(totalMinutes / 60) % 24;
  const wakeUpM = totalMinutes % 60;
  return `${String(wakeUpH).padStart(2, '0')}:${String(wakeUpM).padStart(2, '0')}`;
}

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
      const today = now.toDateString();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // ─── 1. Sleep Start Notification ───
      if (preferences.sleepNotifications !== false) {
        const sleepStart = profile.sleepStart || '22:00';
        const [sleepH, sleepM] = sleepStart.split(':').map(Number);
        
        // Match exact or recent minutes (within 5 minutes window, but only fire once per day)
        const isSleepTime = currentH === sleepH && currentM >= sleepM && currentM < sleepM + 5;
        const lastSleepStartDate = localStorage.getItem(userKey(STORAGE_KEY_SLEEP_START, userId));

        if (isSleepTime && lastSleepStartDate !== today) {
          localStorage.setItem(userKey(STORAGE_KEY_SLEEP_START, userId), today);

          const title = 'Bedtime Reminder';
          const body = "It's time to sleep. Wind down and get some rest!";
          const dedupKey = `sleep-start-${userId}-${today}`;

          addNotification({
            type: 'sleep_start',
            title,
            body,
            actionUrl: '/today',
            dedupKey,
          });
        }
      }

      // ─── 2. Sleep End Notification (Wake up) ───
      if (preferences.sleepNotifications !== false) {
        const sleepStart = profile.sleepStart || '22:00';
        const sleepDuration = profile.sleepDuration || '8';
        const wakeUpTime = getWakeUpTime(sleepStart, sleepDuration);
        const [wakeH, wakeM] = wakeUpTime.split(':').map(Number);

        const isWakeTime = currentH === wakeH && currentM >= wakeM && currentM < wakeM + 5;
        const lastSleepEndDate = localStorage.getItem(userKey(STORAGE_KEY_SLEEP_END, userId));

        if (isWakeTime && lastSleepEndDate !== today) {
          localStorage.setItem(userKey(STORAGE_KEY_SLEEP_END, userId), today);

          const title = 'Good Morning!';
          const body = 'Wake up time! Time to start a brand new day of building your legacy.';
          const dedupKey = `sleep-end-${userId}-${today}`;

          addNotification({
            type: 'sleep_end',
            title,
            body,
            actionUrl: '/today',
            dedupKey,
          });
        }
      }

      // ─── 3. Weekly Planning Session Notification ───
      if (preferences.weeklyPlanning !== false) {
        const planDayNum = getDayNumber(profile.planDay || 'Sunday');
        const planTime = profile.planStartTime || '21:00';
        const [planH, planM] = planTime.split(':').map(Number);

        const currentDayNum = now.getDay();
        const isPlanDay = currentDayNum === planDayNum;
        const isPlanTime = currentH === planH && currentM >= planM && currentM < planM + 5;
        const lastPlanDate = localStorage.getItem(userKey(STORAGE_KEY_WEEKLY_PLANNING, userId));

        if (isPlanDay && isPlanTime && lastPlanDate !== today) {
          localStorage.setItem(userKey(STORAGE_KEY_WEEKLY_PLANNING, userId), today);

          const title = 'Weekly Planning';
          const body = `It's time for your weekly planning session (${planTime}). Set your goals and build your legacy!`;
          const dedupKey = `weekly-planning-${userId}-${today}`;

          addNotification({
            type: 'weekly_planning',
            title,
            body,
            actionUrl: '/planner',
            dedupKey,
          });
        }
      }
    };

    // Check on load, and then every 30 seconds
    checkTimeAndNotify();
    const interval = setInterval(checkTimeAndNotify, 30_000);

    return () => clearInterval(interval);
  }, [userId, profile, preferences, addNotification]);
}
