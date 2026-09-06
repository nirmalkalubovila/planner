import { useEffect } from 'react';
import { useGetWeekPlan } from '@llb/api';
import { useGetHabits } from '@llb/api';
import { useGetCompletedTasks } from '@llb/api';
import { WeekUtils, dayKey, isStale, notificationKey } from '@llb/core';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@llb/notifications';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';

const STORAGE_KEY_YESTERDAY = 'llb-yesterday-stats';

function getWakeUpMinutes(sleepStart: string, sleepDuration: string): number {
  const [h, m] = sleepStart.split(':').map(Number);
  const dur = parseInt(sleepDuration, 10) || 8;
  return (h * 60 + m + dur * 60) % 1440;
}

/**
 * The morning digest — one notification that greets the user and gives
 * them the day's agenda.
 *
 * This absorbed the separate wake-up alert. Previously the greeting came
 * from `use-sleep-and-planning-notifications` and the agenda from here,
 * and both the cron function's block B and block F sent their own copy on
 * the identical firing condition, so a user could see five variations of
 * "good morning" within the same minute.
 *
 * It also no longer fires simply because the app was opened. It fires in
 * a window around the user's actual wake-up time and is dropped once
 * that window has passed, so opening the app at 9pm no longer produces a
 * morning briefing.
 */
export function useDailyBriefing() {
  const { user } = useAuth();
  const userId = user?.id;
  const { profile } = useUserProfile(user);
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
    if (!userId || !preferences.enabled || !profile) return;
    if (!weekPlan || !habits) return; // Wait for data

    const now = new Date();
    const today = dayKey(now);
    const dedupKey = notificationKey('daily_briefing', today);

    const { shownKeys, deletedKeys } = useNotificationStore.getState();
    if (shownKeys.includes(dedupKey) || deletedKeys.includes(dedupKey)) return;

    // Anchor on the user's wake-up time, and only deliver while the
    // morning digest is still worth reading.
    const wakeMinutes = getWakeUpMinutes(profile.sleepStart || '22:00', profile.sleepDuration || '8');
    const intendedAt = new Date(now);
    intendedAt.setHours(Math.floor(wakeMinutes / 60), wakeMinutes % 60, 0, 0);

    if (now.getTime() < intendedAt.getTime()) return; // not morning yet
    if (isStale('daily_briefing', intendedAt, now)) return; // morning has passed

    let yesterdayText = '';
    const yesterdayStats = localStorage.getItem(`${STORAGE_KEY_YESTERDAY}-${userId}`);
    if (yesterdayStats) {
      try {
        const { completed, total } = JSON.parse(yesterdayStats);
        if (total > 0) {
          const pct = Math.round((completed / total) * 100);
          yesterdayText = ` Yesterday: ${completed}/${total} (${pct}%).`;
        }
      } catch {
        // ignore
      }
    }

    const first = tasks[0];
    const body = tasks.length > 0
      ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} today${first ? ` — first up, ${first.name} at ${first.startTime}` : ''}.${yesterdayText}`
      : `Nothing scheduled today.${yesterdayText} Open the planner to lay out your day.`;

    addNotification({
      type: 'daily_briefing',
      title: 'Good morning',
      body,
      actionUrl: '/today',
      dedupKey,
    });
  }, [userId, profile, weekPlan, habits, tasks, preferences, addNotification]);

  // Store today's completion data for tomorrow's digest
  useEffect(() => {
    if (!userId) return;
    if (tasks.length > 0) {
      localStorage.setItem(
        `${STORAGE_KEY_YESTERDAY}-${userId}`,
        JSON.stringify({
          completed: (completedTasks || []).length,
          total: tasks.length,
        })
      );
    }
  }, [userId, completedTasks, tasks.length]);

  // Weekly summary — Monday only
  useEffect(() => {
    if (!userId || !preferences.enabled || preferences.weeklySummary === false) return;

    const now = new Date();
    if (now.getDay() !== 1) return;

    const dedupKey = notificationKey('weekly_summary', currentWeek);
    const { shownKeys, deletedKeys } = useNotificationStore.getState();
    if (shownKeys.includes(dedupKey) || deletedKeys.includes(dedupKey)) return;

    const yesterdayStats = localStorage.getItem(`${STORAGE_KEY_YESTERDAY}-${userId}`);
    let summaryBody = "A new week. Check Statistics to see how last week landed.";

    if (yesterdayStats) {
      try {
        const { completed, total } = JSON.parse(yesterdayStats);
        if (total > 0) {
          summaryBody = `Last week you completed ${completed} tasks. Full breakdown is in Statistics.`;
        }
      } catch {
        // ignore
      }
    }

    addNotification({
      type: 'weekly_summary',
      title: 'Weekly Performance Summary',
      body: summaryBody,
      actionUrl: '/statistics',
      dedupKey,
    });
  }, [userId, currentWeek, preferences, addNotification]);
}
