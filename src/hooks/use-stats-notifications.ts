import { useEffect, useRef } from 'react';
import { useUserStats } from '@/features/statistics/hooks/use-user-stats';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';

const STORAGE_KEY_GRADE = 'llb-last-consistency-grade';
const STORAGE_KEY_STREAK = 'llb-current-streak';
const STORAGE_KEY_BURNOUT = 'llb-last-burnout-shown';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

/**
 * Monitors statistics for changes and fires appropriate notifications:
 * - Consistency grade improvement/decline
 * - Burnout warning
 * - Active-day streak milestones
 */
export function useStatsNotifications() {
  const { data: stats } = useUserStats();
  const preferences = useNotificationStore((s) => s.preferences);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const hasChecked = useRef(false);

  // Consistency grade change detection
  useEffect(() => {
    if (!stats || !preferences.enabled || !preferences.statsAlerts) return;
    if (hasChecked.current) return; // Only check once per app session to avoid spam
    hasChecked.current = true;

    const currentGrade = stats.consistency_grade;
    const previousGrade = localStorage.getItem(STORAGE_KEY_GRADE);

    if (previousGrade && previousGrade !== currentGrade) {
      const gradeOrder = ['F', 'D', 'C', 'B', 'B+', 'A', 'A+'];
      const prevIdx = gradeOrder.indexOf(previousGrade);
      const currIdx = gradeOrder.indexOf(currentGrade);
      const improved = currIdx > prevIdx;

      const title = improved
        ? `📈 Consistency grade improved to ${currentGrade}!`
        : `📉 Consistency grade changed to ${currentGrade}`;
      const body = improved
        ? `Great work! You moved from ${previousGrade} to ${currentGrade}. Keep the momentum!`
        : `Your grade went from ${previousGrade} to ${currentGrade}. Time to get back on track!`;

      sendNotification(title, {
        body,
        url: '/statistics',
        tag: 'stats-grade-change',
        notificationType: 'stats_changed',
      }, preferences);

      addNotification({
        type: 'stats_changed',
        title: improved ? `Consistency grade improved to ${currentGrade}!` : `Consistency grade changed to ${currentGrade}`,
        body,
        icon: improved ? '📈' : '📉',
        actionUrl: '/statistics',
      });
    }

    localStorage.setItem(STORAGE_KEY_GRADE, currentGrade);
  }, [stats, preferences, addNotification]);

  // Burnout warning
  useEffect(() => {
    if (!stats || !preferences.enabled || !preferences.burnoutWarnings) return;
    if (!stats.predictive_burnout_warning) return;

    const lastShown = localStorage.getItem(STORAGE_KEY_BURNOUT);
    const today = new Date().toDateString();

    if (lastShown === today) return; // Already shown today

    localStorage.setItem(STORAGE_KEY_BURNOUT, today);

    sendNotification('🔥 Burnout Alert', {
      body: stats.predictive_burnout_warning,
      url: '/statistics',
      tag: 'burnout-warning',
      notificationType: 'burnout_warning',
    }, preferences);

    addNotification({
      type: 'burnout_warning',
      title: 'Burnout Alert',
      body: stats.predictive_burnout_warning,
      icon: '🔥',
      actionUrl: '/statistics',
    });
  }, [stats, preferences, addNotification]);

  // Streak milestones
  useEffect(() => {
    if (!stats || !preferences.enabled || !preferences.streakAlerts) return;

    const heatmap = stats.habit_heatmap || [];
    // Count consecutive active days from the end
    let streak = 0;
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].count > 0) streak++;
      else break;
    }

    const lastNotifiedStreak = parseInt(localStorage.getItem(STORAGE_KEY_STREAK) || '0', 10);

    // Find the highest milestone the current streak has crossed
    const milestone = STREAK_MILESTONES.filter((m) => streak >= m && m > lastNotifiedStreak).pop();

    if (milestone) {
      localStorage.setItem(STORAGE_KEY_STREAK, String(milestone));

      const title = `🔥 ${milestone}-day streak!`;
      const body = milestone >= 30
        ? `Incredible! You've been active for ${milestone} days straight. You're building a legacy!`
        : milestone >= 7
        ? `Amazing! ${milestone} consecutive days of productivity. You're on fire!`
        : `Nice! ${milestone} days in a row. Keep going!`;

      sendNotification(title, {
        body,
        url: '/statistics',
        tag: `streak-${milestone}`,
        notificationType: 'streak_milestone',
      }, preferences);

      addNotification({
        type: 'streak_milestone',
        title: `${milestone}-day streak!`,
        body,
        icon: '🔥',
        actionUrl: '/statistics',
      });
    }
  }, [stats, preferences, addNotification]);
}
