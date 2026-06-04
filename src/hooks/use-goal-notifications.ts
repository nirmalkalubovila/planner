import { useEffect, useRef } from 'react';
import { useGetGoals } from '@/api/services/goal-service';
import { useNotificationStore } from '@/lib/notification-store';
import { sendNotification } from '@/lib/notification-service';
import type { Goal, Milestone } from '@/types/global-types';

const STORAGE_KEY_DEADLINES = 'llb-notified-deadlines';
const STORAGE_KEY_COMPLETED = 'llb-notified-goal-completed';

const DEADLINE_DAYS = [7, 3, 1]; // Days before deadline to notify

/**
 * Monitors goals for:
 * 1. Approaching deadlines (7, 3, 1 day before)
 * 2. Goal completion (all milestones done)
 */
export function useGoalNotifications() {
  const { data: goals } = useGetGoals();
  const preferences = useNotificationStore((s) => s.preferences);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const hasChecked = useRef(false);

  // Goal deadline notifications
  useEffect(() => {
    if (!goals || !preferences.enabled) return;
    if (hasChecked.current) return;
    hasChecked.current = true;

    const notifiedDeadlines: Record<string, number[]> = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DEADLINES) || '{}'
    );
    const notifiedCompleted: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_COMPLETED) || '[]'
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    goals.forEach((goal: Goal) => {
      const goalId = goal.id;
      if (!goal.endDate || !goalId) return;

      const endDate = new Date(goal.endDate);
      const diffMs = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Check each deadline threshold
      const alreadyNotified = notifiedDeadlines[goalId] || [];

      DEADLINE_DAYS.forEach((threshold) => {
        if (diffDays <= threshold && diffDays > 0 && !alreadyNotified.includes(threshold)) {
          // Calculate progress
          const milestones = goal.milestones || [];
          const completed = milestones.filter((m: Milestone) => m.completed).length;
          const progress = milestones.length > 0
            ? Math.round((completed / milestones.length) * 100)
            : 0;

          const dayWord = diffDays === 1 ? 'day' : 'days';
          const title = `🎯 "${goal.name}" deadline in ${diffDays} ${dayWord}`;
          const body = progress > 0
            ? `You're at ${progress}% progress. ${diffDays <= 1 ? 'Final push!' : 'Keep working on it!'}`
            : `Deadline approaching. Start making progress on your milestones!`;

          const dedupKey = `goal-deadline-${goalId}-${threshold}`;

          sendNotification(title, {
            body,
            url: '/goals',
            tag: `goal-deadline-${goalId}-${threshold}`,
            notificationType: 'goal_deadline',
          }, preferences);

          addNotification({
            type: 'goal_deadline',
            title: `"${goal.name}" deadline in ${diffDays} ${dayWord}`,
            body,
            icon: '🎯',
            actionUrl: '/goals',
            dedupKey,
          });

          // Record that we've notified for this threshold
          if (!notifiedDeadlines[goalId]) notifiedDeadlines[goalId] = [];
          notifiedDeadlines[goalId].push(threshold);
        }
      });

      // Goal completion check
      const milestones = goal.milestones || [];
      if (
        milestones.length > 0 &&
        milestones.every((m: Milestone) => m.completed) &&
        !notifiedCompleted.includes(goalId)
      ) {
        notifiedCompleted.push(goalId);

        const title = `🏆 Goal "${goal.name}" completed!`;
        const body = `Congratulations! You've finished all ${milestones.length} milestones. Time to set a new goal!`;

        const dedupKey = `goal-completed-${goalId}`;

        sendNotification(title, {
          body,
          url: '/goals',
          tag: `goal-completed-${goalId}`,
          notificationType: 'goal_completed',
        }, preferences);

        addNotification({
          type: 'goal_completed',
          title: `Goal "${goal.name}" completed!`,
          body,
          icon: '🏆',
          actionUrl: '/goals',
          dedupKey,
        });
      }
    });

    localStorage.setItem(STORAGE_KEY_DEADLINES, JSON.stringify(notifiedDeadlines));
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(notifiedCompleted));
  }, [goals, preferences, addNotification]);
}
