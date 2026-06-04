import { useEffect } from 'react';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { useTodayTasks } from '@/features/today/hooks/use-today-tasks';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';

const STORAGE_KEY_DAY_SUMMARY = 'llb-last-day-summary-date';

/**
 * Fires a motivational Day Summary notification at sleep time (quietHoursStart).
 * Encouraging messages summarizing the day's achievements, even if tasks were missed.
 */
export function useDaySummary() {
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
    if (!preferences.enabled || !preferences.quietHoursStart) return;
    if (!weekPlan || !habits) return; // Wait for data

    const checkSleepTime = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastSummaryDate = localStorage.getItem(STORAGE_KEY_DAY_SUMMARY);

      if (lastSummaryDate === today) return; // Already fired today

      const [sleepH, sleepM] = preferences.quietHoursStart.split(':').map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // Check if current time is past sleep start time today
      const isPastSleepTime = currentH > sleepH || (currentH === sleepH && currentM >= sleepM);

      if (isPastSleepTime) {
        localStorage.setItem(STORAGE_KEY_DAY_SUMMARY, today);

        const totalTasks = tasks.length;
        const completedCount = (completedTasks || []).filter(id => 
          tasks.some(t => t.id === id)
        ).length;

        let title = '🌙 Reflect & Recharge';
        let body = '';

        if (totalTasks === 0) {
          title = '🌙 Peaceful Evening';
          body = 'No tasks scheduled today. A restful day is just as essential for your long-term legacy. Sleep well!';
        } else if (completedCount === totalTasks) {
          title = '🏆 A Masterclass Day!';
          body = `Incredible work! You completed all ${completedCount}/${totalTasks} tasks today. Your discipline is inspiring. Rest deeply!`;
        } else if (completedCount >= totalTasks / 2) {
          title = '📈 Proud of Your Progress';
          body = `You checked off ${completedCount}/${totalTasks} tasks today. Every effort adds brick by brick to your legacy. Sleep well and recharge.`;
        } else {
          title = '✨ Tomorrow is a New Canvas';
          body = `You completed ${completedCount}/${totalTasks} tasks today. Remember, productivity has seasons, and resting is part of the work. Forgive the unfinished list and sleep peacefully.`;
        }

        const dedupKey = `day-summary-${today}`;

        sendNotification(title, {
          body,
          url: '/statistics',
          tag: 'day-summary',
          notificationType: 'day_summary',
        }, preferences);

        addNotification({
          type: 'day_summary',
          title,
          body,
          icon: '🌙',
          actionUrl: '/statistics',
          dedupKey,
        });
      }
    };

    // Check on load, and then every 30 seconds
    checkSleepTime();
    const interval = setInterval(checkSleepTime, 30_000);

    return () => clearInterval(interval);
  }, [weekPlan, habits, tasks, completedTasks, preferences, addNotification]);
}
