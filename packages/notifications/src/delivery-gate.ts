import type { NotificationPreferences, NotificationType } from '@llb/core';
import { getPolicy, isRetired, kv, TIER2_DAILY_CAP } from '@llb/core';

/**
 * Whether a notification of this type is enabled in the user's preferences.
 *
 * Two types were folded into digests; their preference toggles were kept
 * and now govern the digest that absorbed them, so nobody silently lost a
 * setting they had deliberately turned off.
 */
export function isTypeEnabled(type: NotificationType | undefined, prefs: NotificationPreferences): boolean {
  if (!prefs.enabled) return false;
  if (!type) return true;

  switch (type) {
    case 'task_starting':
      // Use upcomingTasks if defined, fall back to taskReminders for backward compat
      return (prefs.upcomingTasks ?? prefs.taskReminders) !== false;
    case 'task_overdue':
      // Retired into the evening digest — see day_summary.
      return (prefs.overdueTasks ?? prefs.taskReminders) !== false;
    case 'vault_reminder':
      // Creating the reminder on the note IS the opt-in; there is no
      // separate toggle to consult.
      return true;
    case 'daily_briefing':
      // The morning digest. Absorbed the standalone wake-up alert, so it
      // also honours sleepNotifications for users who only wanted that.
      return prefs.dailyBriefing !== false || prefs.sleepNotifications !== false;
    case 'goal_deadline':
      return prefs.goalDeadlines;
    case 'goal_completed':
      return prefs.goalCompletion;
    case 'day_summary':
      // The evening digest, which now also reports uncompleted tasks.
      return prefs.daySummary !== false || (prefs.overdueTasks ?? prefs.taskReminders) !== false;
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

/**
 * Whether "now" falls inside the user's configured quiet hours.
 *
 * Callers should prefer `isQuietHoursFor(type, prefs)`, which additionally
 * honours the per-type exemptions — a blanket check is what made the
 * bedtime reminder unreachable, since quiet hours begin at the very minute
 * that notification is supposed to announce.
 */
export function isQuietHours(prefs: NotificationPreferences, atMinutes?: number): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const currentMinutes = atMinutes ?? (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();

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

/** Quiet hours, with Tier 1 and the bedtime alert exempted. */
export function isQuietHoursFor(
  type: NotificationType | undefined,
  prefs: NotificationPreferences,
  atMinutes?: number
): boolean {
  if (type && getPolicy(type).quietHoursExempt) return false;
  return isQuietHours(prefs, atMinutes);
}

// ─── Tier 2 Daily Budget ─────────────────────────────────
// Persisted through the shared KV port rather than a module-level array,
// which reset on every page load and app restart and so never actually
// limited anything.

const BUDGET_KEY = 'llb-tier2-budget';

interface BudgetRecord {
  day: string;
  count: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readBudget(): BudgetRecord {
  try {
    const raw = kv.persistent.getItem(BUDGET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetRecord;
      if (parsed.day === todayKey()) return parsed;
    }
  } catch {
    // Corrupt or unavailable storage falls through to a fresh day.
  }
  return { day: todayKey(), count: 0 };
}

function writeBudget(record: BudgetRecord): void {
  try {
    kv.persistent.setItem(BUDGET_KEY, JSON.stringify(record));
  } catch {
    // Best-effort: a failed write costs at most one extra notification.
  }
}

/** How many Tier 2 notifications are still allowed today. */
export function remainingTier2Budget(): number {
  return Math.max(0, TIER2_DAILY_CAP - readBudget().count);
}

export function isTier2BudgetExhausted(): boolean {
  return remainingTier2Budget() <= 0;
}

function spendTier2Budget(): void {
  const record = readBudget();
  writeBudget({ day: record.day, count: record.count + 1 });
}

/** Test/settings hook — clears today's spend. */
export function resetTier2Budget(): void {
  writeBudget({ day: todayKey(), count: 0 });
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
}

/**
 * The single source of truth for "should this notification actually be
 * shown right now?" — enabled → not retired → per-type preference →
 * permission → quiet hours → daily budget, each short-circuiting the rest.
 *
 * Tier 1 (a task's 15-minute warning, a vault reminder at its exact time)
 * skips quiet hours and the budget entirely: the user scheduled those
 * themselves, so suppressing one is a bug rather than politeness. Only
 * Tier 2 spends from the daily ceiling, and only on success.
 */
export function canDeliverNotification(input: DeliveryGateInput): boolean {
  const { preferences, notificationType, permissionGranted, bypassChecks } = input;

  if (!permissionGranted) return false;
  if (bypassChecks) return true;

  if (!preferences.enabled) return false;
  // Nothing should be producing these any more; refuse them defensively so
  // a missed call site can't resurrect a duplicate notification.
  if (notificationType && isRetired(notificationType)) return false;
  if (!isTypeEnabled(notificationType, preferences)) return false;
  if (isQuietHoursFor(notificationType, preferences)) return false;

  const tier = notificationType ? getPolicy(notificationType).tier : 2;
  if (tier === 1) return true;

  if (isTier2BudgetExhausted()) return false;
  spendTier2Budget();
  return true;
}
