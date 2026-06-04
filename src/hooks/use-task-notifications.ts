import { useEffect, useRef } from 'react';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { useTodayTasks, type TaskItem } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@/lib/notification-store';
import {
  sendNotification,
  scheduleNotification,
  cancelScheduledNotification,
} from '@/lib/notification-service';
import { TASK_REMINDER_MINUTES } from '@/types/notification-types';

const NOTIFIED_TASKS_KEY_PREFIX = 'llb-notified-tasks-';
const NOTIFIED_BATCH_KEY_PREFIX = 'llb-notified-batch-';

function timeToTodayDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const getNotifiedTasks = (dayStr: string): Set<string> => {
  try {
    const val = localStorage.getItem(`${NOTIFIED_TASKS_KEY_PREFIX}${dayStr}`);
    return val ? new Set(JSON.parse(val)) : new Set();
  } catch {
    return new Set();
  }
};

const saveNotifiedTasks = (dayStr: string, set: Set<string>) => {
  try {
    localStorage.setItem(`${NOTIFIED_TASKS_KEY_PREFIX}${dayStr}`, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error(err);
  }
};

const getNotifiedBatch = (dayStr: string): boolean => {
  return localStorage.getItem(`${NOTIFIED_BATCH_KEY_PREFIX}${dayStr}`) === 'true';
};

const saveNotifiedBatch = (dayStr: string, val: boolean) => {
  localStorage.setItem(`${NOTIFIED_BATCH_KEY_PREFIX}${dayStr}`, val ? 'true' : 'false');
};

const cleanOldTaskNotifKeys = (currentDay: string) => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(NOTIFIED_TASKS_KEY_PREFIX) || key.startsWith(NOTIFIED_BATCH_KEY_PREFIX))) {
        if (!key.endsWith(currentDay)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch {}
};

/**
 * Monitors today's tasks and:
 * 1. Schedules a notification 5 minutes before each task starts
 * 2. Fires a notification when a task is overdue (end time passed, not completed)
 */
export function useTaskNotifications() {
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

  // Schedule "task starting" notifications
  useEffect(() => {
    if (!preferences.enabled) return;

    const { shownKeys, deletedKeys } = useNotificationStore.getState();
    const newScheduled = new Set<string>();

    tasks.forEach((task: TaskItem) => {
      const startTime = timeToTodayDate(task.startTime);
      const reminderTime = new Date(startTime.getTime() - TASK_REMINDER_MINUTES * 60 * 1000);
      const notifId = `task-start-${task.id}`;
      const dedupKey = `task-start-${task.id}-${currentDayStr}`;

      // Skip scheduling if notification already shown or deleted
      if (shownKeys.includes(dedupKey) || deletedKeys.includes(dedupKey)) {
        return;
      }

      // Only schedule if the reminder is in the future
      if (reminderTime.getTime() > Date.now()) {
        scheduleNotification(
          notifId,
          `📋 ${task.name} starts in ${TASK_REMINDER_MINUTES} min`,
          {
            body: `Scheduled for ${task.startTime} - ${task.endTime}`,
            url: '/today',
            tag: notifId,
            notificationType: 'task_starting',
          },
          reminderTime,
          preferences,
        );

        // Also add to in-app notifications when it fires
        const delay = reminderTime.getTime() - Date.now();
        const timer = setTimeout(() => {
          addNotification({
            type: 'task_starting',
            title: `${task.name} starts in ${TASK_REMINDER_MINUTES} min`,
            body: `Scheduled for ${task.startTime} - ${task.endTime}`,
            icon: '📋',
            actionUrl: '/today',
            dedupKey,
          });
        }, delay);

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
    };
  }, [tasks, preferences, addNotification, currentDayStr]);

  // Check for overdue tasks every 60 seconds
  useEffect(() => {
    if (!preferences.enabled) return;

    const checkOverdue = () => {
      const now = new Date();
      const { shownKeys, deletedKeys } = useNotificationStore.getState();

      const overdueTasks = tasks.filter((task: TaskItem) => {
        const endTime = timeToTodayDate(task.endTime);
        const isCompleted = (completedTasks || []).includes(task.id);
        const isOverdue = now > endTime && !isCompleted;
        return isOverdue;
      });

      if (overdueTasks.length === 0) return;

      cleanOldTaskNotifKeys(currentDayStr);

      const notifiedTasks = getNotifiedTasks(currentDayStr);
      const notifiedBatch = getNotifiedBatch(currentDayStr);

      if (overdueTasks.length > 2) {
        // If there are more than 2 overdue tasks, show a single batch notification
        const batchDedupKey = `task-overdue-batch-${currentDayStr}`;
        if (!notifiedBatch && !shownKeys.includes(batchDedupKey) && !deletedKeys.includes(batchDedupKey)) {
          // Mark all these overdue tasks as notified
          overdueTasks.forEach((t) => notifiedTasks.add(t.id));
          saveNotifiedTasks(currentDayStr, notifiedTasks);
          saveNotifiedBatch(currentDayStr, true);

          sendNotification(
            `⚠️ Uncompleted Tasks`,
            {
              body: `You have ${overdueTasks.length} uncompleted tasks today. Tap to complete them.`,
              url: '/today',
              tag: 'task-overdue-batch',
              notificationType: 'task_overdue',
            },
            preferences,
          );

          addNotification({
            type: 'task_overdue',
            title: `Uncompleted Tasks`,
            body: `You have ${overdueTasks.length} uncompleted tasks today.`,
            icon: '⚠️',
            actionUrl: '/today',
            dedupKey: batchDedupKey,
          });
        }
      } else {
        // Show individual notifications for overdue tasks
        let updated = false;

        overdueTasks.forEach((task: TaskItem) => {
          const taskId = task.id;
          const taskDedupKey = `task-overdue-${taskId}-${currentDayStr}`;

          if (
            !notifiedTasks.has(taskId) &&
            !shownKeys.includes(taskDedupKey) &&
            !deletedKeys.includes(taskDedupKey) &&
            !notifiedBatch
          ) {
            notifiedTasks.add(taskId);
            updated = true;

            sendNotification(
              `⚠️ ${task.name} isn't completed`,
              {
                body: `Was scheduled for ${task.startTime} - ${task.endTime}. Tap to mark it done.`,
                url: '/today',
                tag: `task-overdue-${taskId}`,
                notificationType: 'task_overdue',
              },
              preferences,
            );

            addNotification({
              type: 'task_overdue',
              title: `${task.name} isn't completed`,
              body: `Was scheduled for ${task.startTime} - ${task.endTime}`,
              icon: '⚠️',
              actionUrl: '/today',
              dedupKey: taskDedupKey,
            });
          }
        });

        if (updated) {
          saveNotifiedTasks(currentDayStr, notifiedTasks);
        }
      }
    };

    // Check immediately, then every 60s
    checkOverdue();
    const interval = setInterval(checkOverdue, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [tasks, completedTasks, preferences, addNotification, currentDayStr]);
}
