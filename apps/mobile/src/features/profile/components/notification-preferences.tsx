import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, Switch, View } from 'react-native';
import { Bell, BellOff, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { useNotificationStore } from '@llb/notifications';
import type { NotificationPreferences } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { CHANNELS, fireNow, getPermissionState, requestPermission, type PermissionState } from '@/lib/push';
import { useRegisterPush } from '@/features/notifications/hooks/use-register-push';
import { cn } from '@/lib/cn';

interface ToggleItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  defaultOff?: boolean;
}

const TOGGLE_GROUPS: { title: string; items: ToggleItem[] }[] = [
  {
    title: 'Task Alerts',
    items: [
      { key: 'upcomingTasks', label: 'Upcoming Tasks', description: 'Get notified 15 minutes before a task starts' },
      { key: 'overdueTasks', label: 'Overdue Tasks', description: 'Alert when a task passes its end time uncompleted' },
    ],
  },
  {
    title: 'Daily Notifications',
    items: [
      { key: 'dailyBriefing', label: 'Daily Briefing', description: 'Morning summary of your scheduled tasks' },
      { key: 'daySummary', label: 'Day Summary', description: 'Evening reflection on completed vs missed tasks' },
      { key: 'middayCheckin', label: 'Midday Check-In', description: 'Afternoon progress update with task stats', defaultOff: true },
    ],
  },
  {
    title: 'Goals',
    items: [
      { key: 'goalDeadlines', label: 'Goal Deadlines', description: 'Alerts at 7, 3, and 1 day before deadlines' },
      { key: 'goalCompletion', label: 'Goal Completion', description: 'Celebration when all milestones are completed' },
    ],
  },
  {
    title: 'Sleep and Planning',
    items: [
      { key: 'sleepNotifications', label: 'Sleep Reminders', description: 'Bedtime and wake-up notifications' },
      { key: 'weeklyPlanning', label: 'Weekly Planning', description: 'Reminder for your scheduled planning session' },
    ],
  },
  {
    title: 'Performance and Streaks',
    items: [
      { key: 'weeklySummary', label: 'Weekly Summary', description: 'Monday morning performance summary' },
      { key: 'statsChanges', label: 'Stats Changes', description: 'Grade improvement or decline alerts' },
      { key: 'streakMilestones', label: 'Streak Milestones', description: 'Celebrate activity streaks at 3, 7, 14, 30+ days' },
      { key: 'habitStreakRisk', label: 'Habit Streak Risk', description: 'Alert if daily habits might break your streak' },
      { key: 'burnoutWarning', label: 'Burnout Warning', description: 'Alert when overwork pattern is detected' },
    ],
  },
];

/** Mobile's Notification Preferences tab — now with the permission/
 * delivery machinery web's version has, rebuilt on expo-notifications
 * instead of the Web Notification API + Service Worker:
 *   - `requestNotificationPermission()` → `requestPermission()`
 *   - `subscribeToPush()` → `useRegisterPush()` (re-run after granting)
 *   - denied-state copy: web sends people to "browser site settings"; this
 *     sends them to the OS Settings app via `Linking.openSettings()`,
 *     since there is no in-app permission prompt to retry once Android/iOS
 *     has recorded a denial.
 *   - `sendNotification(..., {bypassChecks:true})` → a local `fireNow()`
 *     rather than a round trip through the delivery gate, matching web's
 *     test button explicitly bypassing preferences/quiet-hours too. */
export const NotificationPreferencesSection: React.FC = () => {
  const preferences = useNotificationStore(s => s.preferences);
  const updatePreferences = useNotificationStore(s => s.updatePreferences);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testSent, setTestSent] = useState(false);
  useRegisterPush();

  const refreshPermission = useCallback(() => {
    getPermissionState().then(setPermission);
  }, []);

  useEffect(() => {
    refreshPermission();
    // Catches a permission grant/revoke made from the OS Settings app
    // while this screen stays mounted in the background.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';
  const isUnsupported = permission === 'unsupported';

  const handleMasterToggle = async (value: boolean) => {
    if (!value) {
      updatePreferences({ enabled: false });
      return;
    }
    if (isGranted) {
      updatePreferences({ enabled: true });
      return;
    }
    if (isDenied) return; // nothing this screen can do — must go through Settings
    setIsProcessing(true);
    try {
      const result = await requestPermission();
      setPermission(result);
      if (result === 'granted') updatePreferences({ enabled: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePreference = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleSendTest = async () => {
    await fireNow({
      title: 'Legacy Life Builder',
      body: 'Notifications are working. This is a test alert.',
      channelId: CHANNELS.daily,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const statusLabel = isUnsupported
    ? 'Unavailable'
    : isDenied
      ? 'Blocked'
      : isGranted
        ? preferences.enabled
          ? 'Active'
          : 'Paused'
        : 'Not Set Up';
  const statusTone = isDenied ? 'text-destructive' : isGranted && preferences.enabled ? 'text-emerald-400' : 'text-muted-foreground';

  return (
    <View className="rounded-2xl border border-border bg-card overflow-hidden">
      <View className="px-5 py-4 border-b border-border bg-muted/30 flex-row items-center gap-3">
        <View className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 items-center justify-center">
          {isDenied ? <ShieldAlert size={16} color="#ef4444" /> : isGranted && preferences.enabled ? <Bell size={16} color="#e4e4e7" /> : <BellOff size={16} color="#a1a1aa" />}
        </View>
        <View className="flex-1">
          <Text variant="tiny" className="uppercase tracking-widest font-bold">
            Notifications
          </Text>
          <Text variant="tiny">Preferences sync across your devices</Text>
        </View>
        <Text variant="tiny" className={cn('font-black uppercase', statusTone)}>
          {statusLabel}
        </Text>
      </View>

      <View className="p-5 gap-5">
        {isUnsupported && (
          <View className="p-4 rounded-xl border border-border bg-muted/30">
            <Text variant="small">Push notifications require a physical device — they aren&apos;t available in this simulator/emulator.</Text>
          </View>
        )}

        {isDenied && !isUnsupported && (
          <View className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 gap-3">
            <Text variant="small" className="text-foreground">
              Notifications are blocked at the system level. To receive them, open your device&apos;s Settings app, find Legacy Life Builder, and allow Notifications.
            </Text>
            <Button variant="outline" onPress={() => Linking.openSettings()} className="self-start">
              Open Settings
            </Button>
          </View>
        )}

        {!isUnsupported && (
          <View className="flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-bold text-foreground">All Notifications</Text>
              <Text variant="tiny">Master switch for every notification type below</Text>
            </View>
            <Switch
              value={isGranted && preferences.enabled}
              onValueChange={handleMasterToggle}
              disabled={isDenied || isProcessing}
              trackColor={{ false: '#3f3f46', true: '#34d399' }}
            />
          </View>
        )}

        {isGranted && preferences.enabled && (
          <Pressable
            onPress={handleSendTest}
            disabled={testSent}
            className="flex-row items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5"
          >
            <CheckCircle2 size={14} color="#34d399" />
            <Text variant="small" className="text-emerald-400 font-bold">
              {testSent ? 'Test notification sent' : 'Send a test notification'}
            </Text>
          </Pressable>
        )}

        {isGranted &&
          preferences.enabled &&
          TOGGLE_GROUPS.map(group => (
            <View key={group.title} className="gap-1.5">
              <Text variant="tiny" className="uppercase tracking-widest font-bold pl-1 mb-1">
                {group.title}
              </Text>
              {group.items.map(item => {
                const currentValue = preferences[item.key];
                const isOn = typeof currentValue === 'boolean' ? currentValue : !item.defaultOff;
                return (
                  <View key={item.key} className="flex-row items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-border/60 bg-card">
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-semibold text-foreground">{item.label}</Text>
                      <Text variant="tiny">{item.description}</Text>
                    </View>
                    <Switch value={isOn} onValueChange={v => handleTogglePreference(item.key, v)} trackColor={{ false: '#3f3f46', true: '#34d399' }} />
                  </View>
                );
              })}
            </View>
          ))}
      </View>
    </View>
  );
};
