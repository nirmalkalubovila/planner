import { useEffect } from 'react';
import { useUserProfile } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import { useAuth } from '@/contexts/auth-context';
import { CHANNELS, cancelSource, scheduleDaily, scheduleWeekly } from '@/lib/push';

const SOURCE = 'sleep-planning';

const DAY_NUMBERS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

/** Port of apps/web/src/hooks/use-sleep-and-planning-notifications.ts +
 * the "midday" half of use-engagement-notifications.ts — but scheduled as
 * OS-level repeating triggers instead of a 30-second setTimeout poll,
 * since these are all pure clock rules with no data dependency beyond the
 * profile itself. Matches the plan's own "Local calendar trigger" call for
 * this hook. Re-derives and reschedules whenever the profile or the
 * relevant preference changes; a no-op reschedule (same time) just
 * replaces the OS trigger with an identical one. */
export function useScheduleSleepAndPlanning() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const preferences = useNotificationStore(s => s.preferences);

  useEffect(() => {
    if (!profile || !preferences.enabled) {
      cancelSource(SOURCE);
      return;
    }

    (async () => {
      await cancelSource(SOURCE);

      if (preferences.sleepNotifications !== false) {
        const sleepStart = profile.sleepStart || '22:00';
        const [sh, sm] = sleepStart.split(':').map(Number);
        await scheduleDaily({
          source: SOURCE,
          id: 'sleep-start',
          title: 'Bedtime Reminder',
          body: "It's time to sleep. Wind down and get some rest!",
          hour: sh,
          minute: sm,
          channelId: CHANNELS.sleepPlanning,
          actionUrl: '/today',
        });

        // The wake-up alert used to be scheduled here too. It is retired:
        // the server's morning digest already greets the user AND carries
        // the day's agenda, so having both meant two near-identical
        // notifications in the same minute (plus two more from the cron
        // function's blocks B and F). The morning is now one message.
      }

      if (preferences.weeklyPlanning !== false) {
        const planDayNum = DAY_NUMBERS[(profile.planDay || 'Sunday').toLowerCase()] ?? 0;
        const [ph, pm] = (profile.planStartTime || '21:00').split(':').map(Number);
        await scheduleWeekly({
          source: SOURCE,
          id: 'weekly-planning',
          title: 'Weekly Planning',
          body: `It's time for your weekly planning session (${profile.planStartTime || '21:00'}). Set your goals and build your legacy!`,
          weekday: planDayNum,
          hour: ph,
          minute: pm,
          channelId: CHANNELS.sleepPlanning,
          actionUrl: '/planner',
        });
      }

      // Web's default for this one is opt-in (defaultOff: true) — mirror
      // that by requiring an explicit true rather than "not false".
      if (preferences.middayCheckin === true) {
        await scheduleDaily({
          source: SOURCE,
          id: 'midday-checkin',
          title: 'Midday Check-In',
          body: "Halfway through the day — how's your progress looking?",
          hour: 12,
          minute: 0,
          channelId: CHANNELS.daily,
          actionUrl: '/today',
        });
      }
    })();
  }, [profile, preferences.enabled, preferences.sleepNotifications, preferences.weeklyPlanning, preferences.middayCheckin]);
}
