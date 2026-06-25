export type NotificationType =
  | 'task_starting'
  | 'task_overdue'
  | 'stats_changed'
  | 'streak_milestone'
  | 'daily_briefing'
  | 'day_summary'
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
  dedupKey?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursEnabled: boolean;
  /** Derived from user's sleepStart profile field */
  quietHoursStart: string;
  /** Derived from sleepStart + sleepDuration */
  quietHoursEnd: string;
  // Push preferences
  taskReminders: boolean;
  dailyBriefing: boolean;
  goalDeadlines: boolean;
  goalCompletion: boolean;
  daySummary: boolean;
  weeklySummary: boolean;
  statsChanges: boolean;
  streakMilestones: boolean;
  burnoutWarning: boolean;
  timezoneOffset?: number;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  taskReminders: true,
  dailyBriefing: true,
  goalDeadlines: true,
  goalCompletion: true,
  daySummary: true,
  weeklySummary: true,
  statsChanges: true,
  streakMilestones: true,
  burnoutWarning: true,
};

/** Emoji icons per notification type for in-app display */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  task_starting: '📋',
  task_overdue: '⚠️',
  stats_changed: '📈',
  streak_milestone: '🔥',
  daily_briefing: '☀️',
  day_summary: '🌙',
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
