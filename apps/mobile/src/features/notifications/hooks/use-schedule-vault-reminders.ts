import { useEffect } from 'react';
import { calculateNextFire, useReminders, useUpdateReminder } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import { isStale } from '@llb/core';
import { CHANNELS, cancelSource, scheduleAt } from '@/lib/push';

const SOURCE = 'vault-reminder';

/** Port of apps/web/src/hooks/use-vault-reminders.ts — but where web polls
 * every 30s (so it only fires while a tab happens to be open) this
 * schedules each active reminder's `next_fire` as a real OS-level trigger,
 * which is strictly more reliable, matching the plan's own call for this
 * hook ("known future times → local date trigger").
 *
 * The one thing a local trigger can't do that the poll did: advance
 * `next_fire` itself. If the app was closed when a repeating reminder's
 * time passed, the OS still fired it, but nothing rolled it forward — so
 * on every reminders-list change this catches up any reminder whose
 * `next_fire` has already passed, then schedules the one after that. */
export function useScheduleVaultReminders() {
  const { data: reminders = [] } = useReminders();
  const updateReminder = useUpdateReminder();
  const preferences = useNotificationStore(s => s.preferences);

  useEffect(() => {
    (async () => {
      await cancelSource(SOURCE);
      if (!preferences.enabled) return;

      for (const reminder of reminders) {
        if (!reminder.is_active) continue;

        let fireDate = new Date(reminder.next_fire);
        // Its moment has already gone by. Roll the schedule forward rather
        // than arming a trigger for a time in the past — the OS would fire
        // it immediately, which is exactly the "past reminders" behaviour
        // this system had.
        if (fireDate.getTime() <= Date.now() || isStale('vault_reminder', fireDate)) {
          if (reminder.repeat_type === 'once') {
            updateReminder.mutate({ id: reminder.id, is_active: false });
            continue;
          }
          fireDate = calculateNextFire(reminder.repeat_type, reminder.remind_at);
          updateReminder.mutate({ id: reminder.id, next_fire: fireDate.toISOString() });
        }

        const rawBody = reminder.body || reminder.vault_notes?.content || '';
        const body = rawBody.trim()
          ? rawBody.length > 100
            ? `${rawBody.substring(0, 97)}...`
            : rawBody
          : 'Reminder from your Vault.';

        await scheduleAt({
          source: SOURCE,
          id: reminder.id,
          title: reminder.title,
          body,
          date: fireDate,
          channelId: CHANNELS.daily,
          actionUrl: '/vault',
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, preferences.enabled]);
}
