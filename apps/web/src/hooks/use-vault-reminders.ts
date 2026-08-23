import { useEffect, useRef } from 'react';
import { useReminders, useUpdateReminder, calculateNextFire } from '@/api/services/reminder-service';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';
export function useVaultReminders() {
  const { data: reminders = [] } = useReminders();
  const updateReminder = useUpdateReminder();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const preferences = useNotificationStore((s) => s.preferences);

  // Use a ref to track processed reminder times to prevent duplicate triggers in the same cycle
  const triggeredRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMs = now.getTime();

      reminders.forEach((reminder) => {
        if (!reminder.is_active) return;

        const fireTime = new Date(reminder.next_fire);
        if (fireTime.getTime() <= currentMs) {
          const lastTriggered = triggeredRef.current[reminder.id];
          // Prevent firing more than once per 5 minutes for the same reminder ID
          if (lastTriggered && (currentMs - lastTriggered) < 5 * 60 * 1000) {
            return;
          }

          triggeredRef.current[reminder.id] = currentMs;

          const rawBody = reminder.body || reminder.vault_notes?.content || '';
          const reminderBody = rawBody.trim()
            ? (rawBody.length > 100 ? rawBody.substring(0, 97) + '...' : rawBody)
            : 'Reminder from your Vault.';

          // 1. Add notification in-app
          addNotification({
            type: 'weekly_planning', // using an existing NotificationType that fits reminder style
            title: reminder.title,
            body: reminderBody,
            actionUrl: '/vault',
          });

          // 2. Trigger Service Worker push notification (no Sonner toast here as requested)
          sendNotification(
            reminder.title,
            {
              body: reminderBody,
              url: '/vault',
              tag: `vault-reminder-${reminder.id}`,
              bypassRateLimit: reminder.repeat_type !== 'random',
            },
            preferences
          );

          // 4. Update the reminder's next_fire in the DB or deactivate if one-time
          if (reminder.repeat_type === 'once') {
            updateReminder.mutate({
              id: reminder.id,
              is_active: false,
            });
          } else {
            const nextFireDate = calculateNextFire(reminder.repeat_type, reminder.remind_at);
            updateReminder.mutate({
              id: reminder.id,
              next_fire: nextFireDate.toISOString(),
            });
          }
        }
      });
    };

    // Run check immediately and poll every 30 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, addNotification, updateReminder, preferences]);
}
