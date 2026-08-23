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
  | 'weekly_planning'
  | 'midday_checkin'
  | 'habit_streak_risk';

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
  // Granular push preferences
  /** @deprecated Use upcomingTasks and overdueTasks instead. Kept for backward compat. */
  taskReminders: boolean;
  upcomingTasks: boolean;
  overdueTasks: boolean;
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
  middayCheckin?: boolean;
  habitStreakRisk?: boolean;
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
  upcomingTasks: true,
  overdueTasks: true,
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
  middayCheckin: false,
  habitStreakRisk: true,
  weeklyReportEnabled: true,
  weeklyReportDay: 'Sunday',
  weeklyReportTime: '20:00',
  monthlyReportEnabled: true,
  monthlyReportDay: 1,
  monthlyReportTime: '20:00',
};

/** Lucide icon names per notification type for in-app display */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  task_starting: 'clipboard-list',
  task_overdue: 'alert-triangle',
  stats_changed: 'trending-up',
  streak_milestone: 'flame',
  daily_briefing: 'sun',
  day_summary: 'moon',
  goal_deadline: 'target',
  goal_completed: 'trophy',
  weekly_summary: 'bar-chart-3',
  burnout_warning: 'flame',
  achievement: 'sparkles',
  sleep_start: 'moon',
  sleep_end: 'sun',
  weekly_planning: 'calendar',
  midday_checkin: 'clock',
  habit_streak_risk: 'shield-alert',
};

/** Max notifications per hour to avoid spamming */
export const MAX_NOTIFICATIONS_PER_HOUR = 5;

/** How many minutes before a task starts to send the reminder */
export const TASK_REMINDER_MINUTES = 15;

