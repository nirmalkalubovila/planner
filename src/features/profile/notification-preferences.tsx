import React from 'react';
import { Bell, BellOff, Clock, MessageSquare, Target, Calendar, Moon, BarChart3, Trophy, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/lib/notification-store';
import {
  getPermissionStatus,
  requestNotificationPermission,
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
    'flex items-center justify-between gap-3 py-3 px-3.5 rounded-xl transition-all duration-200 border border-transparent',
    disabled ? 'opacity-40' : 'hover:bg-accent/40 hover:border-border/10'
  )}>
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="flex-shrink-0 w-8.5 h-8.5 rounded-xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground tracking-wide">{label}</p>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        'relative flex-shrink-0 w-10 h-6 rounded-full transition-all duration-300 outline-none border border-border/40',
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
        enabled ? 'bg-emerald-500/90 shadow-sm shadow-emerald-500/10' : 'bg-muted/80'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-[2px] w-4.5 h-4.5 rounded-full shadow-sm",
          enabled ? "bg-white" : "bg-muted-foreground/60"
        )}
      />
    </button>
  </div>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="pt-2 pb-1 px-3.5">
    <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</h4>
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

  const notificationsEnabled = preferences.enabled;

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
                {preferences.enabled ? 'Enabled' : 'Disabled'}
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

      <div className="px-4 py-3 space-y-0.5">
        {/* Master toggle */}
        <Toggle
          label="Enable All Notifications"
          description="Master switch for all notification types"
          icon={preferences.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          enabled={preferences.enabled}
          onChange={handleMasterToggle}
        />

        <Toggle
          label="Quiet Hours (Sleep Time)"
          description={`No notifications during sleep (${preferences.quietHoursStart} - ${preferences.quietHoursEnd})`}
          icon={<Clock size={14} />}
          enabled={preferences.quietHoursEnabled}
          onChange={(val) => updatePreferences({ quietHoursEnabled: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Sleep Start & End Alerts"
          description="Alert when your bedtime or wake-up time is reached"
          icon={<Moon size={14} />}
          enabled={preferences.sleepNotifications !== false}
          onChange={(val) => updatePreferences({ sleepNotifications: val })}
          disabled={!notificationsEnabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Reminders & Tasks */}
        <SectionLabel label="Reminders & Tasks" />

        <Toggle
          label="Task Reminders"
          description="Alert when a task is starting soon or overdue"
          icon={<Calendar size={14} />}
          enabled={preferences.taskReminders !== false}
          onChange={(val) => updatePreferences({ taskReminders: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Day Summary"
          description="Motivational summary of your day at sleep time"
          icon={<Moon size={14} />}
          enabled={preferences.daySummary !== false}
          onChange={(val) => updatePreferences({ daySummary: val })}
          disabled={!notificationsEnabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Planning & Progress */}
        <SectionLabel label="Planning & Progress" />

        <Toggle
          label="Daily Briefing"
          description="Morning summary of today's tasks at wake-up"
          icon={<MessageSquare size={14} />}
          enabled={preferences.dailyBriefing !== false}
          onChange={(val) => updatePreferences({ dailyBriefing: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Weekly Summary"
          description="Performance review every Monday morning"
          icon={<BarChart3 size={14} />}
          enabled={preferences.weeklySummary !== false}
          onChange={(val) => updatePreferences({ weeklySummary: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Weekly Planning Reminder"
          description="Alert when it is time to plan your upcoming week"
          icon={<Clock size={14} />}
          enabled={preferences.weeklyPlanning !== false}
          onChange={(val) => updatePreferences({ weeklyPlanning: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Stats & Grade Changes"
          description="Alerts when your consistency grade changes"
          icon={<TrendingUp size={14} />}
          enabled={preferences.statsChanges !== false}
          onChange={(val) => updatePreferences({ statsChanges: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Streak Milestones"
          description="Celebrate when you hit 3, 7, 14, 30+ day streaks"
          icon={<Flame size={14} />}
          enabled={preferences.streakMilestones !== false}
          onChange={(val) => updatePreferences({ streakMilestones: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Burnout Warning"
          description="Alert when burnout risk is detected"
          icon={<Flame size={14} />}
          enabled={preferences.burnoutWarning !== false}
          onChange={(val) => updatePreferences({ burnoutWarning: val })}
          disabled={!notificationsEnabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Goals & Achievements */}
        <SectionLabel label="Goals & Achievements" />

        <Toggle
          label="Goal Deadlines"
          description="Alerts for upcoming goal deadlines (7, 3, 1 day)"
          icon={<Target size={14} />}
          enabled={preferences.goalDeadlines !== false}
          onChange={(val) => updatePreferences({ goalDeadlines: val })}
          disabled={!notificationsEnabled}
        />

        <Toggle
          label="Goal Completion"
          description="Celebrate when all milestones of a goal are done"
          icon={<Trophy size={14} />}
          enabled={preferences.goalCompletion !== false}
          onChange={(val) => updatePreferences({ goalCompletion: val })}
          disabled={!notificationsEnabled}
        />

        <div className="h-px bg-border mx-3 my-2" />

        {/* Permission action */}
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
