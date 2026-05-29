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

/**
 * Parses a time string like "09:30" to a Date object for today.
 */
function timeToTodayDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

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
  const overdueCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedOverdueRef = useRef<Set<string>>(new Set());

  // Schedule "task starting" notifications
  useEffect(() => {
    if (!preferences.taskReminders || !preferences.enabled) return;

    const newScheduled = new Set<string>();

    tasks.forEach((task: TaskItem) => {
      const startTime = timeToTodayDate(task.startTime);
      const reminderTime = new Date(startTime.getTime() - TASK_REMINDER_MINUTES * 60 * 1000);
      const notifId = `task-start-${task.id}`;

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
        setTimeout(() => {
          addNotification({
            type: 'task_starting',
            title: `${task.name} starts in ${TASK_REMINDER_MINUTES} min`,
            body: `Scheduled for ${task.startTime} - ${task.endTime}`,
            icon: '📋',
            actionUrl: '/today',
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
  }, [tasks, preferences, addNotification]);

  // Check for overdue tasks every 60 seconds
  useEffect(() => {
    if (!preferences.taskReminders || !preferences.enabled) return;

    const checkOverdue = () => {
      const now = new Date();

      tasks.forEach((task: TaskItem) => {
        const endTime = timeToTodayDate(task.endTime);
        const taskId = task.id;
        const isCompleted = (completedTasks || []).includes(taskId);

        if (
          now > endTime &&
          !isCompleted &&
          !notifiedOverdueRef.current.has(taskId)
        ) {
          notifiedOverdueRef.current.add(taskId);

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
          });
        }
      });
    };

    // Check immediately, then every 60s
    checkOverdue();
    overdueCheckRef.current = setInterval(checkOverdue, 60_000);

    return () => {
      if (overdueCheckRef.current) clearInterval(overdueCheckRef.current);
    };
  }, [tasks, completedTasks, preferences, addNotification]);

  // Reset overdue tracking daily
  useEffect(() => {
    notifiedOverdueRef.current.clear();
  }, [currentDayStr]);
}
