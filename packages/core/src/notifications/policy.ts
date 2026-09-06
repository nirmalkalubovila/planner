import type { NotificationType } from '../types/notification-types';

/**
 * The single source of truth for how every notification behaves — imported
 * verbatim by the web hooks, the mobile schedulers, and the Supabase cron
 * function, so the three can't drift apart the way they had.
 *
 * The system is split into two tiers because scheduled commitments and
 * ambient nudges are different classes of message that should never
 * compete for the same budget:
 *
 *   Tier 1 — things the user scheduled themselves (a task's 15-minute
 *   warning, a vault reminder). Uncapped, never coalesced, fired at the
 *   exact minute, exempt from quiet hours. Missing one breaks trust.
 *
 *   Tier 2 — things the app decided to say (digests, streak nudges,
 *   deadline warnings). Capped per day and spent in priority order, so
 *   noise can't starve signal.
 */
export type NotificationTier = 1 | 2;

export interface NotificationPolicy {
    tier: NotificationTier;
    /** Lower sorts first when spending the Tier 2 daily budget. Tier 1 ignores this. */
    priority: number;
    /**
     * Drop rather than deliver once the moment it was meant for is this
     * many minutes past. This one rule is what stops a reminder for 9am
     * arriving when the app is finally opened at 4pm.
     */
    staleAfterMinutes: number;
    /** Tier 1, plus the bedtime alert that ANNOUNCES quiet hours starting. */
    quietHoursExempt: boolean;
    /**
     * Still in the union so stored history keeps rendering, but nothing
     * produces these any more — they were folded into a digest.
     */
    retiredInto?: NotificationType;
}

/** Tier 2 ceiling across every type and both platforms, per user per day. */
export const TIER2_DAILY_CAP = 4;

/** Minutes before a task starts that its Tier 1 warning fires. */
export const TASK_LEAD_MINUTES = 15;

export const NOTIFICATION_POLICY: Record<NotificationType, NotificationPolicy> = {
    // ── Tier 1 · commitments ──────────────────────────────────
    task_starting: { tier: 1, priority: 0, staleAfterMinutes: 5, quietHoursExempt: true },
    vault_reminder: { tier: 1, priority: 0, staleAfterMinutes: 30, quietHoursExempt: true },

    // ── Tier 2 · digests & nudges, in budget priority order ───
    goal_deadline: { tier: 2, priority: 10, staleAfterMinutes: 720, quietHoursExempt: false },
    // Bedtime is exempt from quiet hours because quiet hours begin at
    // exactly this moment — without the exemption the server skips the
    // user before it can ever send this, which is why it never fired.
    sleep_start: { tier: 2, priority: 20, staleAfterMinutes: 60, quietHoursExempt: true },
    daily_briefing: { tier: 2, priority: 30, staleAfterMinutes: 90, quietHoursExempt: false },
    day_summary: { tier: 2, priority: 40, staleAfterMinutes: 90, quietHoursExempt: false },
    weekly_planning: { tier: 2, priority: 50, staleAfterMinutes: 120, quietHoursExempt: false },
    goal_completed: { tier: 2, priority: 60, staleAfterMinutes: 60, quietHoursExempt: false },
    habit_streak_risk: { tier: 2, priority: 70, staleAfterMinutes: 60, quietHoursExempt: false },
    weekly_summary: { tier: 2, priority: 80, staleAfterMinutes: 90, quietHoursExempt: false },
    streak_milestone: { tier: 2, priority: 90, staleAfterMinutes: 60, quietHoursExempt: false },
    burnout_warning: { tier: 2, priority: 100, staleAfterMinutes: 60, quietHoursExempt: false },
    stats_changed: { tier: 2, priority: 110, staleAfterMinutes: 60, quietHoursExempt: false },
    achievement: { tier: 2, priority: 120, staleAfterMinutes: 60, quietHoursExempt: false },
    midday_checkin: { tier: 2, priority: 130, staleAfterMinutes: 60, quietHoursExempt: false },

    // ── Retired · folded into a digest ────────────────────────
    // Both kept in the union so notifications already in a user's history
    // still render with the right icon and label.
    sleep_end: { tier: 2, priority: 999, staleAfterMinutes: 90, quietHoursExempt: false, retiredInto: 'daily_briefing' },
    task_overdue: { tier: 2, priority: 999, staleAfterMinutes: 90, quietHoursExempt: false, retiredInto: 'day_summary' },
};

export function getPolicy(type: NotificationType): NotificationPolicy {
    return NOTIFICATION_POLICY[type] ?? NOTIFICATION_POLICY.achievement;
}

export function isTier1(type: NotificationType): boolean {
    return getPolicy(type).tier === 1;
}

export function isRetired(type: NotificationType): boolean {
    return getPolicy(type).retiredInto !== undefined;
}

/**
 * `YYYY-MM-DD` for the user's own day. Every dedupe key is scoped by this,
 * so a daily notification naturally can't repeat within the same day and
 * naturally can repeat tomorrow — no explicit "last sent" bookkeeping.
 */
export function dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** `dayKey` for a Date already shifted into the user's local wall clock. */
export function dayKeyUTC(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * The canonical dedupe key, in one place.
 *
 * Web hooks, mobile schedulers and the edge function all build keys with
 * this exact function, so the client's `shownKeys` and the server's
 * `notification_sent_log` finally agree on what "the same notification"
 * means. Previously each of seven web hooks invented its own localStorage
 * key format and none of them matched the server's tags.
 */
export function notificationKey(type: NotificationType, day: string, entityId?: string): string {
    return entityId ? `${type}:${day}:${entityId}` : `${type}:${day}`;
}

/**
 * Identity for a scheduled item, independent of which source produced it.
 * A reminder saved to the task library AND placed on the planner grid used
 * to arrive as two different IDs and notify twice; keying on what the user
 * actually perceives — this name, at this time, on this day — collapses
 * them back into one.
 */
export function scheduledItemKey(name: string, startTime: string, dayIdx: number): string {
    return `${dayIdx}|${startTime}|${name.trim().toLowerCase()}`;
}

/** True once `intendedAt` is far enough in the past that delivering would be worse than staying silent. */
export function isStale(type: NotificationType, intendedAt: Date, now: Date = new Date()): boolean {
    const lateByMinutes = (now.getTime() - intendedAt.getTime()) / 60000;
    return lateByMinutes > getPolicy(type).staleAfterMinutes;
}

/** Sorts Tier 2 candidates so the budget is spent on what matters first. */
export function byPriority(a: NotificationType, b: NotificationType): number {
    return getPolicy(a).priority - getPolicy(b).priority;
}
