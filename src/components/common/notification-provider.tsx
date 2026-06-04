import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { useNotificationStore } from '@/lib/notification-store';
import { getPermissionStatus, subscribeToPush } from '@/lib/notification-service';
import { useTaskNotifications } from '@/hooks/use-task-notifications';
import { useStatsNotifications } from '@/hooks/use-stats-notifications';
import { useGoalNotifications } from '@/hooks/use-goal-notifications';
import { useDailyBriefing } from '@/hooks/use-daily-briefing';
import { useDaySummary } from '@/hooks/use-day-summary';
import { NotificationPermissionBanner } from './notification-permission-banner';
import { InstallPWAPrompt } from './install-pwa-prompt';

/**
 * NotificationProvider initializes all notification hooks and renders
 * the permission banner + PWA install prompt.
 * Must be rendered inside AuthProvider and QueryClientProvider.
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, saveProfile } = useUserProfile(user);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const setPermissionStatus = useNotificationStore((s) => s.setPermissionStatus);
  const notifications = useNotificationStore((s) => s.notifications);
  const preferences = useNotificationStore((s) => s.preferences);
  const syncFromCloud = useNotificationStore((s) => s.syncFromCloud);
  const clearStore = useNotificationStore((s) => s.clearStore);
  const queryClient = useQueryClient();
  const hasSynced = useRef(false);
  const lastUser = useRef<string | null>(null);

  // Invalidate queries and check for SW updates when tab becomes visible (PWA open/focus)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries();

        // Also check for Service Worker updates when the app is focused/opened
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch (err) {
          console.warn('Failed to check for Service Worker update:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  // Reload page when new service worker takes control
  useEffect(() => {
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // 1. Handle login state, logout state, and cloud hydration
  useEffect(() => {
    if (!user) {
      if (lastUser.current !== null) {
        clearStore();
        hasSynced.current = false;
        lastUser.current = null;
      }
      return;
    }

    lastUser.current = user.id;

    if (!profile || hasSynced.current) return;

    const cloudPrefs = profile.notificationPrefs;
    const cloudNotifs = profile.notifications;

    // Load cloud state into local store (only if they exist in DB)
    if (
      (cloudPrefs && Object.keys(cloudPrefs).length > 0) ||
      (cloudNotifs && cloudNotifs.length > 0)
    ) {
      syncFromCloud(cloudPrefs, cloudNotifs);
    }
    hasSynced.current = true;
  }, [user, profile, syncFromCloud, clearStore]);

  // Extract stable strings for deep comparisons
  const dbPrefsStr = JSON.stringify(profile?.notificationPrefs || {});
  const dbNotifsStr = JSON.stringify(profile?.notifications || []);

  // 2. Debounced save to Supabase cloud database
  useEffect(() => {
    if (!user || !profile || !hasSynced.current) return;

    const timer = setTimeout(() => {
      const dbPrefs = JSON.parse(dbPrefsStr);
      const dbNotifs = JSON.parse(dbNotifsStr);

      const diffPrefs = JSON.stringify(dbPrefs) !== JSON.stringify(preferences);
      const diffNotifs = JSON.stringify(dbNotifs) !== JSON.stringify(notifications);

      if (diffPrefs || diffNotifs) {
        saveProfile({
          notificationPrefs: preferences,
          notifications: notifications,
        }).catch((err) => console.error('Failed to sync notifications to cloud:', err));
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(timer);
  }, [notifications, preferences, user, dbPrefsStr, dbNotifsStr, saveProfile]);

  const sleepStart = profile?.sleepStart || '22:00';
  const sleepDuration = profile?.sleepDuration || '8';

  // 3. Sync quiet hours with user's sleep schedule
  useEffect(() => {
    if (!user || !profile) return;

    const sleepDurationNum = parseInt(sleepDuration, 10);

    // Calculate sleep end time
    const [startH, startM] = sleepStart.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + sleepDurationNum * 60;
    const endH = Math.floor((totalMinutes % 1440) / 60);
    const endM = totalMinutes % 60;
    const sleepEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    if (
      preferences.quietHoursStart !== sleepStart ||
      preferences.quietHoursEnd !== sleepEnd
    ) {
      updatePreferences({
        quietHoursStart: sleepStart,
        quietHoursEnd: sleepEnd,
      });
    }
  }, [user, sleepStart, sleepDuration, preferences.quietHoursStart, preferences.quietHoursEnd, updatePreferences]);

  // 4. Sync permission status
  useEffect(() => {
    const status = getPermissionStatus();
    if (status !== 'unsupported') {
      setPermissionStatus(status);
    }
  }, [setPermissionStatus]);

  // 5. Auto-subscribe to Web Push when permission is granted
  const pushSubscribed = useRef(false);
  useEffect(() => {
    if (!user || pushSubscribed.current) return;
    if (!preferences.enabled) return;

    const status = getPermissionStatus();
    if (status !== 'granted') return;

    pushSubscribed.current = true;
    subscribeToPush(user.id).then((ok) => {
      if (ok) console.log('Web Push subscription active');
    });
  }, [user, preferences.enabled]);

  return (
    <>
      {user && <NotificationHooks />}
      <NotificationPermissionBanner />
      <InstallPWAPrompt />
      {children}
    </>
  );
};

/**
 * Separate component to activate hooks only when user is authenticated.
 * Hooks can't be called conditionally, so this wrapper is needed.
 */
const NotificationHooks: React.FC = () => {
  useTaskNotifications();
  useStatsNotifications();
  useGoalNotifications();
  useDailyBriefing();
  useDaySummary();
  return null;
};
