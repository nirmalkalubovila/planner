import { useEffect, useRef } from 'react';
import { useReminders, useUpdateReminder, calculateNextFire } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import { dayKey, isStale, notificationKey } from '@llb/core';
import { sendNotification } from '@/lib/notification-service';

/**
 * Vault note reminders — Tier 1, so they fire at the user's exact chosen
 * time, uncapped and outside quiet hours.
 *
 * The important change here is the staleness guard. This used to fire for
 * ANY reminder whose `next_fire` had passed, with no lower bound: close
 * the app for three days with five daily reminders and re-opening it
 * produced five instant notifications for moments long gone. Now a
 * reminder more than its freshness window past its moment is silently
 * rolled forward instead of delivered late.
 *
 * These also now use the dedicated `vault_reminder` type. They previously
 * borrowed `weekly_planning`, which meant they were policed by the wrong
 * preference and were indistinguishable in the notification history.
 */
export function useVaultReminders() {
  const { data: reminders = [] } = useReminders();
  const updateReminder = useUpdateReminder();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const preferences = useNotificationStore((s) => s.preferences);

  // Guards against re-firing the same reminder inside one polling cycle.
  const triggeredRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMs = now.getTime();

      reminders.forEach((reminder) => {
        if (!reminder.is_active) return;

        const fireTime = new Date(reminder.next_fire);
        if (fireTime.getTime() > currentMs) return;

        const rollForward = () => {
          if (reminder.repeat_type === 'once') {
            updateReminder.mutate({ id: reminder.id, is_active: false });
          } else {
            updateReminder.mutate({
              id: reminder.id,
              next_fire: calculateNextFire(reminder.repeat_type, reminder.remind_at).toISOString(),
            });
          }
        };

        // Its moment has passed by more than the freshness window — move
        // the schedule on without shouting about the one we missed.
        if (isStale('vault_reminder', fireTime, now)) {
          rollForward();
          return;
        }

        const lastTriggered = triggeredRef.current[reminder.id];
        if (lastTriggered && currentMs - lastTriggered < 5 * 60 * 1000) return;
        triggeredRef.current[reminder.id] = currentMs;

        const rawBody = reminder.body || reminder.vault_notes?.content || '';
        const reminderBody = rawBody.trim()
          ? (rawBody.length > 100 ? rawBody.substring(0, 97) + '...' : rawBody)
          : 'Reminder from your Vault.';

        const dedupKey = notificationKey('vault_reminder', dayKey(now), reminder.id);

        addNotification({
          type: 'vault_reminder',
          title: reminder.title,
          body: reminderBody,
          actionUrl: '/vault',
          dedupKey,
        });

        sendNotification(
          reminder.title,
          {
            body: reminderBody,
            url: '/vault',
            tag: dedupKey,
            notificationType: 'vault_reminder',
          },
          preferences
        );

        rollForward();
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, addNotification, updateReminder, preferences]);
}
