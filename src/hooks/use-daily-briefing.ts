import { useEffect } from 'react';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';
import { useAuth } from '@/contexts/auth-context';

const STORAGE_KEY_BRIEFING = 'llb-last-briefing-date';
const STORAGE_KEY_YESTERDAY = 'llb-yesterday-stats';

/**
 * Sends a daily morning briefing when the user first opens the app each day.
 * Includes: today's task count + yesterday's completion stats.
 * All localStorage keys are scoped per-user to prevent cross-user dedup leaks.
 */
export function useDailyBriefing() {
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

  // Send daily briefing
  useEffect(() => {
    if (!userId || !preferences.enabled) return;
    if (!weekPlan || !habits) return; // Wait for data

    const today = new Date().toDateString();
    const lastBriefing = localStorage.getItem(`${STORAGE_KEY_BRIEFING}-${userId}`);

    if (lastBriefing === today) return; // Already sent today

    localStorage.setItem(`${STORAGE_KEY_BRIEFING}-${userId}`, today);

    // Get yesterday's stats
    const yesterdayStats = localStorage.getItem(`${STORAGE_KEY_YESTERDAY}-${userId}`);
    let yesterdayText = '';
    if (yesterdayStats) {
      try {
        const { completed, total } = JSON.parse(yesterdayStats);
        if (total > 0) {
          const pct = Math.round((completed / total) * 100);
          yesterdayText = ` Yesterday: ${completed}/${total} tasks (${pct}%).`;
        }
      } catch {
        // ignore
      }
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const taskCount = tasks.length;
    const title = `☀️ ${greeting}!`;
    const body = taskCount > 0
      ? `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} scheduled today.${yesterdayText} Let's build your legacy!`
      : `No tasks scheduled for today.${yesterdayText} Use the planner to add some!`;

    const dedupKey = `daily-briefing-${today}`;

    // Small delay so the app has time to render first
    setTimeout(() => {
      sendNotification(title, {
        body,
        url: '/today',
        tag: 'daily-briefing',
        notificationType: 'daily_briefing',
      }, preferences);

      addNotification({
        type: 'daily_briefing',
        title: `${greeting}!`,
        body,
        icon: '☀️',
        actionUrl: '/today',
        dedupKey,
      });
    }, 2000);
  }, [userId, weekPlan, habits, tasks.length, preferences, addNotification]);

  // Store today's completion data for tomorrow's briefing
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

  // Weekly summary — fires on Mondays
  useEffect(() => {
    if (!userId || !preferences.enabled || preferences.weeklySummary === false) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
    if (dayOfWeek !== 1) return; // Only on Monday

    const weeklyKey = `llb-weekly-summary-${currentWeek}-${userId}`;
    if (localStorage.getItem(weeklyKey)) return;

    localStorage.setItem(weeklyKey, 'sent');

    const yesterdayStats = localStorage.getItem(`${STORAGE_KEY_YESTERDAY}-${userId}`);
    let summaryBody = 'Start of a new week! Check your statistics to see last week\'s performance.';

    if (yesterdayStats) {
      try {
        const { completed, total } = JSON.parse(yesterdayStats);
        if (total > 0) {
          summaryBody = `Last week you completed ${completed} tasks. Check your full performance breakdown in Statistics.`;
        }
      } catch {
        // ignore
      }
    }

    const dedupKey = `weekly-summary-${currentWeek}`;

    setTimeout(() => {
      sendNotification('📊 Weekly Performance Summary', {
        body: summaryBody,
        url: '/statistics',
        tag: 'weekly-summary',
        notificationType: 'weekly_summary',
      }, preferences);

      addNotification({
        type: 'weekly_summary',
        title: 'Weekly Performance Summary',
        body: summaryBody,
        icon: '📊',
        actionUrl: '/statistics',
        dedupKey,
      });
    }, 5000);
  }, [userId, currentWeek, preferences, addNotification]);
}
