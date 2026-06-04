import React from 'react';
import { Bell, BellOff, Clock, BarChart3, Target, Flame, Sun, FileText, AlertTriangle, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/lib/notification-store';
import {
  getPermissionStatus,
  requestNotificationPermission,
  sendNotification,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/notification-service';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface ToggleProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, icon, enabled, onChange, disabled }) => (
  <div className={cn(
    'flex items-center justify-between gap-3 py-3 px-3 rounded-xl transition-colors',
    disabled ? 'opacity-40' : 'hover:bg-accent/50'
  )}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        'relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200',
        enabled ? 'bg-emerald-500' : 'bg-rose-500'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  </div>
);

export const NotificationPreferencesSection: React.FC = () => {
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const setPermissionStatus = useNotificationStore((s) => s.setPermissionStatus);
  const { user } = useAuth();

  const currentPermission = getPermissionStatus();
  const isGranted = currentPermission === 'granted';
  const isDenied = currentPermission === 'denied';

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    if (result !== 'unsupported') {
      setPermissionStatus(result);
      // Auto-subscribe to push after granting permission
      if (result === 'granted' && user) {
        subscribeToPush(user.id);
      }
    }
  };

  /** Toggle master switch — also manages push subscription */
  const handleMasterToggle = async (val: boolean) => {
    updatePreferences({ enabled: val });
    if (user) {
      if (val && isGranted) {
        subscribeToPush(user.id);
      } else if (!val) {
        unsubscribeFromPush(user.id);
      }
    }
  };

  const handleTestNotification = () => {
    sendNotification('🧪 Test Notification', {
      body: 'If you see this, notifications are working perfectly!',
      url: '/profile',
      tag: 'test-notification',
      notificationType: 'achievement',
    }, preferences);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bell size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isGranted ? 'Enabled' : isDenied ? 'Blocked by browser' : 'Not yet enabled'}
              </p>
            </div>
          </div>

          {/* Permission status badge */}
          <div className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
            isGranted
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : isDenied
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          )}>
            {isGranted ? 'Granted' : isDenied ? 'Blocked' : 'Pending'}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-1">
        {/* Master toggle */}
        <Toggle
          label="Enable All Notifications"
          description="Master switch for all notification types"
          icon={preferences.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          enabled={preferences.enabled}
          onChange={handleMasterToggle}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Individual toggles */}
        <Toggle
          label="Task Reminders"
          description="5 min before tasks start + overdue alerts"
          icon={<Clock size={14} />}
          enabled={preferences.taskReminders}
          onChange={(val) => updatePreferences({ taskReminders: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Statistics Alerts"
          description="Consistency grade changes and improvements"
          icon={<BarChart3 size={14} />}
          enabled={preferences.statsAlerts}
          onChange={(val) => updatePreferences({ statsAlerts: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Goal Deadlines"
          description="Warnings at 7, 3, and 1 day before deadlines"
          icon={<Target size={14} />}
          enabled={preferences.goalDeadlines}
          onChange={(val) => updatePreferences({ goalDeadlines: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Streak Milestones"
          description="Celebrations at 3, 7, 14, 30, 60, 100 days"
          icon={<Flame size={14} />}
          enabled={preferences.streakAlerts}
          onChange={(val) => updatePreferences({ streakAlerts: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Daily Briefing"
          description="Morning summary of today's schedule"
          icon={<Sun size={14} />}
          enabled={preferences.dailyBriefing}
          onChange={(val) => updatePreferences({ dailyBriefing: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Weekly Summary"
          description="Performance recap at the start of each week"
          icon={<FileText size={14} />}
          enabled={preferences.weeklySummary}
          onChange={(val) => updatePreferences({ weeklySummary: val })}
          disabled={!preferences.enabled}
        />

        <Toggle
          label="Burnout Warnings"
          description="Alerts when overwork is detected"
          icon={<AlertTriangle size={14} />}
          enabled={preferences.burnoutWarnings}
          onChange={(val) => updatePreferences({ burnoutWarnings: val })}
          disabled={!preferences.enabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Quiet hours */}
        <Toggle
          label="Quiet Hours (Sleep Time)"
          description={`No notifications during sleep (${preferences.quietHoursStart} - ${preferences.quietHoursEnd})`}
          icon={<Clock size={14} />}
          enabled={preferences.quietHoursEnabled}
          onChange={(val) => updatePreferences({ quietHoursEnabled: val })}
          disabled={!preferences.enabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-3 py-2">
          {!isGranted && !isDenied && (
            <button
              onClick={handleRequestPermission}
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
            >
              <Bell size={12} />
              Enable Browser Notifications
            </button>
          )}

          {isGranted && (
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-border bg-muted hover:bg-accent text-foreground transition-all active:scale-95"
            >
              <TestTube size={12} />
              Send Test Notification
            </button>
          )}

          {isDenied && (
            <p className="text-[10px] text-red-400/80 font-medium px-1">
              Notifications are blocked. Please enable them in your browser settings for this site.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
