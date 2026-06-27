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
  | 'achievement'
  | 'sleep_start'
  | 'sleep_end'
  | 'weekly_planning';

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
  sleepNotifications?: boolean;
  weeklyPlanning?: boolean;
  weeklyReportEnabled?: boolean;
  weeklyReportDay?: string;      // e.g. "Sunday"
  weeklyReportTime?: string;     // e.g. "20:00"
  monthlyReportEnabled?: boolean;
  monthlyReportDay?: number;     // e.g. 1
  monthlyReportTime?: string;    // e.g. "20:00"
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
  sleepNotifications: true,
  weeklyPlanning: true,
  weeklyReportEnabled: true,
  weeklyReportDay: 'Sunday',
  weeklyReportTime: '20:00',
  monthlyReportEnabled: true,
  monthlyReportDay: 1,
  monthlyReportTime: '20:00',
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
  sleep_start: '🌙',
  sleep_end: '☀️',
  weekly_planning: '📅',
};

/** Max notifications per hour to avoid spamming */
export const MAX_NOTIFICATIONS_PER_HOUR = 3;

/** How many minutes before a task starts to send the reminder */
export const TASK_REMINDER_MINUTES = 5;
