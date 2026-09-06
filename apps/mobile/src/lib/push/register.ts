import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** One Android notification channel per preference group, so a user who
 * mutes "Performance and Streaks" at the OS level (long-press a
 * notification → channel settings) doesn't also silence Task Alerts —
 * exactly the per-type control the plan calls out as the reason to bother
 * with channels at all on Android. iOS has no channel concept; these calls
 * are no-ops there. */
export const CHANNELS = {
  taskAlerts: 'task_alerts',
  daily: 'daily',
  goals: 'goals',
  sleepPlanning: 'sleep_planning',
  performance: 'performance',
} as const;

export type ChannelId = (typeof CHANNELS)[keyof typeof CHANNELS];

async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNELS.taskAlerts, {
      name: 'Task Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.daily, {
      name: 'Daily Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.goals, {
      name: 'Goals',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.sleepPlanning, {
      name: 'Sleep and Planning',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.performance, {
      name: 'Performance and Streaks',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  ]);
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermissionState(): Promise<PermissionState> {
  if (!Device.isDevice) return 'unsupported'; // simulators/emulators can't receive real pushes
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (!Device.isDevice) return 'unsupported';
  // Channels must exist before a token is requested on Android 13+ — see
  // the SDK 57 docs note this file's comment above quotes from.
  await setupAndroidChannels();
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

/** Resolves to a token only when permission is already granted — callers
 * that need to prompt first should call requestPermission() themselves. */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  await setupAndroidChannels();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    // Expo's push service call can fail transiently (network, service
    // outage) — local scheduling still works without a token, so this is
    // deliberately swallowed rather than surfaced as an app error.
    return null;
  }
}
