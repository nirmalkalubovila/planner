import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRegisterPush } from './hooks/use-register-push';
import { useScheduleGoalNotifications } from './hooks/use-schedule-goal-notifications';
import { useScheduleSleepAndPlanning } from './hooks/use-schedule-sleep-planning';
import { useScheduleTaskReminders } from './hooks/use-schedule-task-reminders';
import { useScheduleVaultReminders } from './hooks/use-schedule-vault-reminders';

/** All the scheduling hooks, mounted together — port of apps/web's
 * notification-provider.tsx, which mounts its 8 hooks from one inner
 * component gated on `shouldLoadHooks` so they don't compete with the
 * active screen's own initial queries. Same idea here with a shorter
 * delay: local scheduling has no per-request cost the way 8 concurrent
 * poll loops did on web, so there's less to defer, but a small delay still
 * keeps this off the critical path of the first screen's paint. */
function Hooks() {
  useRegisterPush();
  useScheduleSleepAndPlanning();
  useScheduleVaultReminders();
  useScheduleGoalNotifications();
  useScheduleTaskReminders();
  return null;
}

export function NotificationBootstrap() {
  const { user } = useAuth();
  // Tracks *which* user the delay has elapsed for, rather than a bare
  // boolean that an effect has to reset to false on sign-out — that reset
  // was a synchronous setState inside the effect, which the React Compiler
  // rejects. Comparing ids gets the same "not ready for this user yet"
  // answer during render instead.
  const [readyForUserId, setReadyForUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => setReadyForUserId(user.id), 1500);
    return () => clearTimeout(id);
  }, [user]);

  if (!user || readyForUserId !== user.id) return null;
  return <Hooks />;
}
