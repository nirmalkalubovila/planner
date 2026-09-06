import { useEffect } from 'react';
import { useGetGoals } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import { kv, type Goal, type Milestone } from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { CHANNELS, cancelSource, fireNow, scheduleAt } from '@/lib/push';

const SOURCE = 'goal-deadline';
const DEADLINE_DAYS = [7, 3, 1];

function completedKey(userId: string) {
  return `llb-notified-goal-completed-mobile-${userId}`;
}

/** Port of apps/web/src/hooks/use-goal-notifications.ts. Deadlines schedule
 * as OS-level triggers fired at 9am on the threshold date, one call to
 * cancelSource+reschedule per goals-list change — safe to re-run since
 * expo-notifications treats each reschedule as replacing the prior one for
 * the same key.
 *
 * Completion is different: it must fire at most ONCE ever per goal, even
 * across unrelated re-renders and app restarts, so — unlike everything
 * else in this pass — it needs its own persisted "already notified" set
 * rather than relying on cancel-and-reschedule idempotency. Uses the
 * shared `kv` port (MMKV on native) the same way web's version uses
 * localStorage, namespaced per user exactly like the original. */
export function useScheduleGoalNotifications() {
  const { user } = useAuth();
  const { data: goals } = useGetGoals();
  const preferences = useNotificationStore(s => s.preferences);

  useEffect(() => {
    if (!user || !goals || !preferences.enabled) return;

    (async () => {
      await cancelSource(SOURCE);

      const notifiedCompleted: string[] = JSON.parse(kv.persistent.getItem(completedKey(user.id)) || '[]');
      let completedChanged = false;

      for (const goal of goals as Goal[]) {
        const goalId = goal.id;
        if (!goalId) continue;
        const displayName = goal.name.length > 40 ? `${goal.name.substring(0, 37)}...` : goal.name;
        const milestones = goal.milestones || [];

        if (preferences.goalDeadlines !== false && goal.endDate) {
          const endDate = new Date(goal.endDate);
          const completedCount = milestones.filter((m: Milestone) => m.completed).length;
          const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

          for (const threshold of DEADLINE_DAYS) {
            const fireDate = new Date(endDate);
            fireDate.setDate(fireDate.getDate() - threshold);
            fireDate.setHours(9, 0, 0, 0);
            if (fireDate.getTime() <= Date.now()) continue; // threshold already passed

            const dayWord = threshold === 1 ? 'day' : 'days';
            await scheduleAt({
              source: SOURCE,
              id: `${goalId}-${threshold}`,
              title: `"${displayName}" deadline in ${threshold} ${dayWord}`,
              body:
                progress > 0
                  ? `You're at ${progress}% progress. ${threshold <= 1 ? 'Final push!' : 'Keep working on it!'}`
                  : 'Deadline approaching. Start making progress on your milestones!',
              date: fireDate,
              channelId: CHANNELS.goals,
              actionUrl: '/goals',
            });
          }
        }

        if (
          preferences.goalCompletion !== false &&
          milestones.length > 0 &&
          milestones.every((m: Milestone) => m.completed) &&
          !notifiedCompleted.includes(goalId)
        ) {
          notifiedCompleted.push(goalId);
          completedChanged = true;
          await fireNow({
            title: `Goal "${displayName}" completed!`,
            body: `Congratulations! You've finished all ${milestones.length} milestones. Time to set a new goal!`,
            channelId: CHANNELS.goals,
            actionUrl: '/goals',
          });
        }
      }

      if (completedChanged) {
        kv.persistent.setItem(completedKey(user.id), JSON.stringify(notifiedCompleted.slice(-500)));
      }
    })();
  }, [user, goals, preferences.enabled, preferences.goalDeadlines, preferences.goalCompletion]);
}
