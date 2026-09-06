import { useEffect, useRef } from 'react';
import { useGetWeekPlan } from '@llb/api';
import { useGetHabits } from '@llb/api';
import { useGetCompletedTasks } from '@llb/api';
import { WeekUtils } from '@llb/core';
import { useTodayTasks, type TaskItem } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@llb/notifications';
import {
  scheduleNotification,
  cancelScheduledNotification,
} from '@/lib/notification-service';
import {
  dayKey,
  notificationKey,
  scheduledItemKey,
  TASK_LEAD_MINUTES,
} from '@llb/core';
import { useAuth } from '@/contexts/auth-context';

function timeToTodayDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Schedules the Tier 1 "starts in 15 minutes" warning for every habit,
 * goal task and custom block on today's plan.
 *
 * These are commitments the user scheduled themselves, so they are
 * uncapped and exempt from quiet hours by policy — which is why this file
 * no longer passes `bypassRateLimit`. It used to set that flag on every
 * single task, which made the hourly cap decorative; the tier system now
 * expresses the same intent honestly and applies it consistently on both
 * platforms.
 *
 * Overdue-task alerts used to live here too, firing per task on a 60s
 * poll. They are now folded into the server's evening digest, which can
 * see the whole day at once instead of nagging through it.
 */
export function useTaskNotifications() {
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

  const scheduledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !preferences.enabled) return;

    const { shownKeys, deletedKeys } = useNotificationStore.getState();
    const newScheduled = new Set<string>();
    const inAppTimers: ReturnType<typeof setTimeout>[] = [];
    const today = dayKey(new Date());
    // The same reminder can reach us from the planner grid and from the
    // saved task library under two different ids. Collapsing on what the
    // user actually perceives — this name, at this time, today — is what
    // stops it notifying twice.
    const seen = new Set<string>();

    tasks.forEach((task: TaskItem) => {
      const identity = scheduledItemKey(task.name, task.startTime, dayIdx);
      if (seen.has(identity)) return;
      seen.add(identity);

      const startTime = timeToTodayDate(task.startTime);
      const reminderTime = new Date(startTime.getTime() - TASK_LEAD_MINUTES * 60 * 1000);
      const notifId = `task-start-${identity}`;
      const dedupKey = notificationKey('task_starting', today, identity);

      if (shownKeys.includes(dedupKey) || deletedKeys.includes(dedupKey)) return;

      // Only schedule if the reminder is still ahead of us.
      if (reminderTime.getTime() > Date.now()) {
        scheduleNotification(
          notifId,
          `${task.name} starts in ${TASK_LEAD_MINUTES} min`,
          {
            body: `Scheduled for ${task.startTime} - ${task.endTime}`,
            url: '/today',
            tag: dedupKey,
            notificationType: 'task_starting',
          },
          reminderTime,
          preferences,
        );

        const delay = reminderTime.getTime() - Date.now();
        const timer = setTimeout(() => {
          addNotification({
            type: 'task_starting',
            title: `${task.name} starts in ${TASK_LEAD_MINUTES} min`,
            body: `Scheduled for ${task.startTime} - ${task.endTime}`,
            actionUrl: '/today',
            dedupKey,
          });
        }, delay);
        inAppTimers.push(timer);

        newScheduled.add(notifId);
      }
    });

    // Cancel previously scheduled notifications that are no longer relevant
    scheduledRef.current.forEach((id) => {
      if (!newScheduled.has(id)) {
        cancelScheduledNotification(id);
      }
    });
    scheduledRef.current = newScheduled;

    return () => {
      newScheduled.forEach((id) => cancelScheduledNotification(id));
      inAppTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [userId, tasks, dayIdx, preferences, addNotification, currentDayStr]);
}
