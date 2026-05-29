export type NotificationType =
  | 'task_starting'
  | 'task_overdue'
  | 'stats_changed'
  | 'streak_milestone'
  | 'daily_briefing'
  | 'goal_deadline'
  | 'goal_completed'
  | 'weekly_summary'
  | 'burnout_warning'
  | 'achievement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: boolean;
  taskReminders: boolean;
  statsAlerts: boolean;
  dailyBriefing: boolean;
  streakAlerts: boolean;
  goalDeadlines: boolean;
  weeklySummary: boolean;
  burnoutWarnings: boolean;
  quietHoursEnabled: boolean;
  /** Derived from user's sleepStart profile field */
  quietHoursStart: string;
  /** Derived from sleepStart + sleepDuration */
  quietHoursEnd: string;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  taskReminders: true,
  statsAlerts: true,
  dailyBriefing: true,
  streakAlerts: true,
  goalDeadlines: true,
  weeklySummary: true,
  burnoutWarnings: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

/** Emoji icons per notification type for in-app display */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  task_starting: '📋',
  task_overdue: '⚠️',
  stats_changed: '📈',
  streak_milestone: '🔥',
  daily_briefing: '☀️',
  goal_deadline: '🎯',
  goal_completed: '🏆',
  weekly_summary: '📊',
  burnout_warning: '🔥',
  achievement: '✨',
};

/** Max notifications per hour to avoid spamming */
export const MAX_NOTIFICATIONS_PER_HOUR = 3;

/** How many minutes before a task starts to send the reminder */
export const TASK_REMINDER_MINUTES = 5;
