import type { NotificationPreferences, NotificationType } from '@/types/notification-types';
import { MAX_NOTIFICATIONS_PER_HOUR } from '@/types/notification-types';
import { supabase } from '@/lib/supabaseClient';

// ─── Rate Limiter ────────────────────────────────────────
const recentTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  // Prune old timestamps
  while (recentTimestamps.length > 0 && recentTimestamps[0] < oneHourAgo) {
    recentTimestamps.shift();
  }
  return recentTimestamps.length >= MAX_NOTIFICATIONS_PER_HOUR;
}

function recordNotification(): void {
  recentTimestamps.push(Date.now());
}

// ─── Quiet Hours Check ───────────────────────────────────
function isQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same-day range (e.g., 08:00 - 18:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 22:00 - 06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// ─── Permission ──────────────────────────────────────────
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

// ─── Service Worker Registration ─────────────────────────
let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = registration;

    // Listen for notification click messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const url = event.data.url;
        if (url && window.location.pathname !== url) {
          window.location.href = url;
        }
      }

      // Handle push subscription renewal (browser rotated the subscription)
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        const sub = event.data.subscription;
        if (sub?.endpoint && sub?.keys) {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              supabase.from('push_subscriptions').upsert(
                {
                  user_id: data.user.id,
                  endpoint: sub.endpoint,
                  p256dh: sub.keys.p256dh,
                  auth: sub.keys.auth,
                  user_agent: navigator.userAgent,
                },
                { onConflict: 'user_id,endpoint' }
              );
            }
          });
        }
      }
    });

    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

// ─── Send Notification ───────────────────────────────────
export interface NotificationOptions {
  body: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
  /** Notification type for preference checking */
  notificationType?: NotificationType;
}

/**
 * Check if a notification of this type is enabled in user preferences.
 */
function isTypeEnabled(type: NotificationType | undefined, prefs: NotificationPreferences): boolean {
  if (!prefs.enabled) return false;
  if (!type) return true;

  const typeMap: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
    task_starting: 'taskReminders',
    task_overdue: 'taskReminders',
    stats_changed: 'statsAlerts',
    streak_milestone: 'streakAlerts',
    daily_briefing: 'dailyBriefing',
    goal_deadline: 'goalDeadlines',
    goal_completed: 'goalDeadlines',
    weekly_summary: 'weeklySummary',
    burnout_warning: 'burnoutWarnings',
    achievement: 'statsAlerts',
  };

  const prefKey = typeMap[type];
  if (prefKey && prefs[prefKey] === false) return false;
  return true;
}

/**
 * Send a notification through the Service Worker.
 * Respects rate limits, quiet hours, and user preferences.
 */
export async function sendNotification(
  title: string,
  options: NotificationOptions,
  preferences: NotificationPreferences,
): Promise<boolean> {
  // Check if notifications are enabled
  if (!preferences.enabled) return false;

  // Check type preference
  if (!isTypeEnabled(options.notificationType, preferences)) return false;

  // Check permission
  if (getPermissionStatus() !== 'granted') return false;

  // Check quiet hours
  if (isQuietHours(preferences)) return false;

  // Check rate limit
  if (isRateLimited()) return false;

  recordNotification();

  // Try Service Worker first (works in background for PWA)
  const reg = swRegistration || await navigator.serviceWorker?.ready;
  if (reg) {
    reg.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, options },
    });
    return true;
  }

  // Fallback to Notification API directly (tab must be open)
  try {
    new Notification(title, {
      body: options.body,
      icon: '/white-logo.svg',
      tag: options.tag,
      silent: options.silent,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Scheduled Notifications ─────────────────────────────
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleNotification(
  id: string,
  title: string,
  options: NotificationOptions,
  triggerTime: Date,
  preferences: NotificationPreferences,
): void {
  cancelScheduledNotification(id);

  const delay = triggerTime.getTime() - Date.now();
  if (delay <= 0) return; // Already past

  const timer = setTimeout(() => {
    sendNotification(title, options, preferences);
    scheduledTimers.delete(id);
  }, delay);

  scheduledTimers.set(id, timer);
}

export function cancelScheduledNotification(id: string): void {
  const existing = scheduledTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    scheduledTimers.delete(id);
  }
}

export function cancelAllScheduledNotifications(): void {
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.clear();
}

// ─── Web Push Subscription Management ────────────────────

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert a base64url VAPID key to a Uint8Array for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the browser to Web Push notifications via PushManager.
 * Saves the subscription to the push_subscriptions table in Supabase.
 * Returns true if successful.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured. Push subscriptions disabled.');
    return false;
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker?.ready);
    if (!reg) return false;

    // Check for existing subscription
    let subscription = await reg.pushManager.getSubscription();

    // If no subscription exists, create one
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subscriptionJson = subscription.toJSON();
    const endpoint = subscriptionJson.endpoint!;
    const p256dh = subscriptionJson.keys?.p256dh || '';
    const auth = subscriptionJson.keys?.auth || '';

    // Save to Supabase (upsert to handle re-subscriptions)
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }

    console.log('Push subscription saved successfully');
    return true;
  } catch (err) {
    console.error('Failed to subscribe to push:', err);
    return false;
  }
}

/**
 * Unsubscribe from Web Push notifications.
 * Removes the subscription from both the browser and Supabase.
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const reg = swRegistration || (await navigator.serviceWorker?.ready);
    if (!reg) return false;

    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from Supabase
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    }

    return true;
  } catch (err) {
    console.error('Failed to unsubscribe from push:', err);
    return false;
  }
}

/**
 * Check if the browser currently has an active push subscription.
 */
export async function hasPushSubscription(): Promise<boolean> {
  try {
    const reg = swRegistration || (await navigator.serviceWorker?.ready);
    if (!reg) return false;
    const subscription = await reg.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
