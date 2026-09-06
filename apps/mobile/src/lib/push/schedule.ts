import * as Notifications from 'expo-notifications';
import type { ChannelId } from './register';

/** Every local notification this app schedules carries a `key` in its data
 * payload, namespaced `${source}:${id}` (e.g. `vault-reminder:3f2a...`).
 * That key — not an in-memory identifier map — is the source of truth for
 * "what did we already schedule", read back via
 * getAllScheduledNotificationsAsync(). That survives app restarts for
 * free, which a JS-side Map wouldn't, and needs no persistence of its own. */
function keyOf(source: string, id: string) {
  return `${source}:${id}`;
}

/** Cancels every currently-scheduled local notification belonging to one
 * source (e.g. all vault reminders, or all of today's task-starting
 * alerts), so a scheduler can safely reschedule from scratch whenever its
 * underlying data changes without leaving stale duplicates behind. */
export async function cancelSource(source: string): Promise<void> {
  const prefix = `${source}:`;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const stale = all.filter(n => typeof n.content.data?.key === 'string' && (n.content.data.key as string).startsWith(prefix));
  await Promise.all(stale.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

interface ScheduleAtInput {
  source: string;
  id: string;
  title: string;
  body: string;
  date: Date;
  channelId: ChannelId;
  actionUrl?: string;
}

/** Schedules a one-shot local notification for a specific future moment.
 * Silently skips dates already in the past — the OS would otherwise fire
 * it immediately, which is never what a caller computing "15 minutes
 * before this task starts" wants once that window has already closed. */
export async function scheduleAt(input: ScheduleAtInput): Promise<void> {
  if (input.date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: { key: keyOf(input.source, input.id), actionUrl: input.actionUrl },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.date,
      channelId: input.channelId,
    },
  });
}

interface ScheduleDailyInput {
  source: string;
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  channelId: ChannelId;
  actionUrl?: string;
}

/** A clock-driven repeating notification (bedtime, wake-up, midday
 * check-in) — the OS re-fires this every day at the given local time with
 * no further scheduling needed until the time itself changes. */
export async function scheduleDaily(input: ScheduleDailyInput): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: { key: keyOf(input.source, input.id), actionUrl: input.actionUrl },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: input.hour,
      minute: input.minute,
      channelId: input.channelId,
    },
  });
}

interface ScheduleWeeklyInput {
  source: string;
  id: string;
  title: string;
  body: string;
  /** Follows JS Date.getDay() — 0 = Sunday. */
  weekday: number;
  hour: number;
  minute: number;
  channelId: ChannelId;
  actionUrl?: string;
}

export async function scheduleWeekly(input: ScheduleWeeklyInput): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: { key: keyOf(input.source, input.id), actionUrl: input.actionUrl },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: input.weekday + 1, // expo-notifications' WEEKLY is 1-based (1=Sunday); Date.getDay() is 0-based
      hour: input.hour,
      minute: input.minute,
      channelId: input.channelId,
    },
  });
}

interface FireNowInput {
  title: string;
  body: string;
  channelId: ChannelId;
  actionUrl?: string;
}

/** Fires immediately — used for things detected while the app is already
 * open (a goal just completed, a stats grade just changed), where
 * web's `sendNotification()` shows an OS notification right away rather
 * than scheduling one for later. */
export async function fireNow(input: FireNowInput): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: { actionUrl: input.actionUrl } },
    trigger: null,
  });
}
