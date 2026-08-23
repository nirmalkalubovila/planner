import type { NotificationPreferences, NotificationType } from '@llb/core';
import { MAX_NOTIFICATIONS_PER_HOUR } from '@llb/core';

/**
 * Whether a notification of this type is enabled in the user's preferences.
 */
export function isTypeEnabled(type: NotificationType | undefined, prefs: NotificationPreferences): boolean {
  if (!prefs.enabled) return false;
  if (!type) return true;

  switch (type) {
    case 'task_starting':
      // Use upcomingTasks if defined, fall back to taskReminders for backward compat
      return (prefs.upcomingTasks ?? prefs.taskReminders) !== false;
    case 'task_overdue':
      // Use overdueTasks if defined, fall back to taskReminders for backward compat
      return (prefs.overdueTasks ?? prefs.taskReminders) !== false;
    case 'daily_briefing':
      return prefs.dailyBriefing;
    case 'goal_deadline':
      return prefs.goalDeadlines;
    case 'goal_completed':
      return prefs.goalCompletion;
    case 'day_summary':
      return prefs.daySummary;
    case 'weekly_summary':
      return prefs.weeklySummary;
    case 'stats_changed':
      return prefs.statsChanges;
    case 'streak_milestone':
      return prefs.streakMilestones;
    case 'burnout_warning':
      return prefs.burnoutWarning;
    case 'sleep_start':
    case 'sleep_end':
      return prefs.sleepNotifications !== false;
    case 'weekly_planning':
      return prefs.weeklyPlanning !== false;
    case 'midday_checkin':
      return prefs.middayCheckin !== false;
    case 'habit_streak_risk':
      return prefs.habitStreakRisk !== false;
    default:
      return true;
  }
}

/** Whether "now" falls inside the user's configured quiet hours. */
export function isQuietHours(prefs: NotificationPreferences): boolean {
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

// ─── Rate Limiter ────────────────────────────────────────
// Module-level sliding window, shared by every canDeliverNotification()
// call in this process — matches the original client-side behavior.
const recentTimestamps: number[] = [];

export function isRateLimited(): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  while (recentTimestamps.length > 0 && recentTimestamps[0] < oneHourAgo) {
    recentTimestamps.shift();
  }
  return recentTimestamps.length >= MAX_NOTIFICATIONS_PER_HOUR;
}

export function recordNotification(): void {
  recentTimestamps.push(Date.now());
}

export interface DeliveryGateInput {
  preferences: NotificationPreferences;
  notificationType?: NotificationType;
  /**
   * Whether the platform has granted permission to show notifications.
   * The gate doesn't know how to check this itself (Web Notification API,
   * expo-notifications, ...) — the caller resolves it and passes the result.
   */
  permissionGranted: boolean;
  bypassChecks?: boolean;
  bypassRateLimit?: boolean;
}

/**
 * The single source of truth for "should this notification actually be
 * shown right now?" — enabled → per-type preference → permission → quiet
 * hours → rate limit, in that order, each short-circuiting the rest.
 * Records the delivery (for rate-limiting) only when everything passes.
 */
export function canDeliverNotification(input: DeliveryGateInput): boolean {
  const { preferences, notificationType, permissionGranted, bypassChecks, bypassRateLimit } = input;

  if (!bypassChecks && !preferences.enabled) return false;
  if (!bypassChecks && !isTypeEnabled(notificationType, preferences)) return false;
  if (!permissionGranted) return false;
  if (!bypassChecks && isQuietHours(preferences)) return false;
  if (!bypassChecks && !bypassRateLimit && isRateLimited()) return false;

  recordNotification();
  return true;
}
