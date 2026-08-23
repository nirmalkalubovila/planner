import React, { useState } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle, ShieldAlert, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/lib/notification-store';
import {
  getPermissionStatus,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendNotification,
  isNotificationSupported,
} from '@/lib/notification-service';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { NotificationPreferences } from '@llb/core';

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
      {
        key: 'upcomingTasks',
        label: 'Upcoming Tasks',
        description: 'Get notified 15 minutes before a task starts',
      },
      {
        key: 'overdueTasks',
        label: 'Overdue Tasks',
        description: 'Alert when a task passes its end time uncompleted',
      },
    ],
  },
  {
    title: 'Daily Notifications',
    items: [
      {
        key: 'dailyBriefing',
        label: 'Daily Briefing',
        description: 'Morning summary of your scheduled tasks',
      },
      {
        key: 'daySummary',
        label: 'Day Summary',
        description: 'Evening reflection on completed vs missed tasks',
      },
      {
        key: 'middayCheckin',
        label: 'Midday Check-In',
        description: 'Afternoon progress update with task stats',
        defaultOff: true,
      },
    ],
  },
  {
    title: 'Goals',
    items: [
      {
        key: 'goalDeadlines',
        label: 'Goal Deadlines',
        description: 'Alerts at 7, 3, and 1 day before deadlines',
      },
      {
        key: 'goalCompletion',
        label: 'Goal Completion',
        description: 'Celebration when all milestones are completed',
      },
    ],
  },
  {
    title: 'Sleep and Planning',
    items: [
      {
        key: 'sleepNotifications',
        label: 'Sleep Reminders',
        description: 'Bedtime and wake-up notifications',
      },
      {
        key: 'weeklyPlanning',
        label: 'Weekly Planning',
        description: 'Reminder for your scheduled planning session',
      },
    ],
  },
  {
    title: 'Performance and Streaks',
    items: [
      {
        key: 'weeklySummary',
        label: 'Weekly Summary',
        description: 'Monday morning performance summary',
      },
      {
        key: 'statsChanges',
        label: 'Stats Changes',
        description: 'Grade improvement or decline alerts',
      },
      {
        key: 'streakMilestones',
        label: 'Streak Milestones',
        description: 'Celebrate activity streaks at 3, 7, 14, 30+ days',
      },
      {
        key: 'habitStreakRisk',
        label: 'Habit Streak Risk',
        description: 'Alert if daily habits might break your streak',
      },
      {
        key: 'burnoutWarning',
        label: 'Burnout Warning',
        description: 'Alert when overwork pattern is detected',
      },
    ],
  },
];

export const NotificationPreferencesSection: React.FC = () => {
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const setPermissionStatus = useNotificationStore((s) => s.setPermissionStatus);
  const { user } = useAuth();
  const [testSent, setTestSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const supported = isNotificationSupported();
  const currentPermission = getPermissionStatus();
  const isGranted = currentPermission === 'granted';
  const isDenied = currentPermission === 'denied';
  const isEnabled = preferences.enabled && isGranted;

  const handleToggle = async () => {
    if (!supported || isProcessing) return;

    if (!isGranted && !isDenied) {
      // Request permission
      setIsProcessing(true);
      try {
        const result = await requestNotificationPermission();
        if (result !== 'unsupported') {
          setPermissionStatus(result);
          if (result === 'granted') {
            updatePreferences({ enabled: true });
            if (user) {
              await subscribeToPush(user.id);
            }
          }
        }
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (isGranted) {
      const nextState = !preferences.enabled;
      setIsProcessing(true);
      try {
        updatePreferences({ enabled: nextState });
        if (user) {
          if (nextState) {
            await subscribeToPush(user.id);
          } else {
            await unsubscribeFromPush(user.id);
          }
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSendTest = async () => {
    if (!isGranted || testSent) return;
    setTestSent(true);
    await sendNotification(
      'Legacy Life Builder',
      {
        body: 'Push notifications are configured and working properly.',
        bypassChecks: true,
      },
      preferences
    );
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTogglePreference = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bell size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {isEnabled ? 'Active & Delivering' : isDenied ? 'Permission Blocked' : 'Permission Required'}
              </p>
            </div>
          </div>

          {/* Permission status badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
              isGranted && preferences.enabled
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : isDenied
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            )}
          >
            {isGranted && preferences.enabled ? 'Granted' : isDenied ? 'Blocked' : isGranted ? 'Paused' : 'Pending'}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Master Permission Switch */}
        <div
          className={cn(
            'flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200',
            isEnabled
              ? 'bg-emerald-500/[0.03] border-emerald-500/20'
              : isDenied
              ? 'bg-red-500/[0.03] border-red-500/20'
              : 'bg-muted/30 border-border'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors',
                isEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isDenied
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {isEnabled ? (
                <Bell size={18} />
              ) : isDenied ? (
                <ShieldAlert size={18} />
              ) : (
                <BellOff size={18} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tracking-wide">
                Push Notifications
              </p>
              <p className="text-xs text-muted-foreground/90 mt-0.5 leading-relaxed">
                {!supported
                  ? 'Push notifications are not supported on this browser.'
                  : isDenied
                  ? 'Notifications are blocked in your browser settings.'
                  : isEnabled
                  ? 'Push notifications are enabled for alerts, reminders, and updates.'
                  : isGranted
                  ? 'Notifications are paused. Turn on to resume alerts.'
                  : 'Allow push notifications to receive real-time alerts and briefings.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={!supported || isDenied || isProcessing}
            aria-label="Toggle push notifications"
            className={cn(
              'relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 outline-none border border-border/40',
              !supported || isDenied || isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              isEnabled ? 'bg-emerald-500/90 shadow-sm shadow-emerald-500/10' : 'bg-muted/80'
            )}
          >
            <motion.div
              animate={{ x: isEnabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn(
                'absolute top-[2px] w-4.5 h-4.5 rounded-full shadow-sm',
                isEnabled ? 'bg-white' : 'bg-muted-foreground/60'
              )}
            />
          </button>
        </div>

        {/* Action / Guidance details */}
        {isDenied && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Browser Permissions Blocked</p>
              <p className="mt-0.5 text-red-300/80">
                To receive notifications, open your browser site settings (usually the lock or tune icon in the address bar) and set Notifications to Allow.
              </p>
            </div>
          </div>
        )}

        {!isGranted && !isDenied && supported && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Click the switch or the button to grant notification access.
            </p>
            <button
              onClick={handleToggle}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <Bell size={14} />
              {isProcessing ? 'Requesting...' : 'Allow Notifications'}
            </button>
          </div>
        )}

        {isEnabled && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 size={14} />
              <span>Permission granted and ready</span>
            </div>
            <button
              onClick={handleSendTest}
              disabled={testSent}
              className="px-3 py-1.5 text-[11px] font-semibold tracking-wide rounded-lg bg-muted border border-border/80 hover:bg-accent text-foreground hover:text-primary transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Send size={12} />
              {testSent ? 'Notification Sent' : 'Send Test'}
            </button>
          </div>
        )}

        {/* Granular Notification Toggles */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-4 overflow-hidden"
            >
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Customize What You Receive
                </p>
                <p className="text-[10px] text-muted-foreground/70 mb-4 leading-relaxed">
                  Toggle individual notification types on or off. Your preferences sync across all your devices.
                </p>
              </div>

              {TOGGLE_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1 mb-2">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const currentValue = preferences[item.key];
                    const isOn = typeof currentValue === 'boolean'
                      ? currentValue
                      : !item.defaultOff;

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          'flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200',
                          isOn
                            ? 'bg-card border-border/60 hover:border-border'
                            : 'bg-muted/20 border-border/30 opacity-60 hover:opacity-80'
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-foreground tracking-wide leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleTogglePreference(item.key, !isOn)}
                          aria-label={`Toggle ${item.label}`}
                          className={cn(
                            'relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 outline-none border border-border/40 cursor-pointer',
                            isOn ? 'bg-emerald-500/90 shadow-sm shadow-emerald-500/10' : 'bg-muted/80'
                          )}
                        >
                          <motion.div
                            animate={{ x: isOn ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={cn(
                              'absolute top-[2px] w-4.5 h-4.5 rounded-full shadow-sm',
                              isOn ? 'bg-white' : 'bg-muted-foreground/60'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
