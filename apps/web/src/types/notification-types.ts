// Moved to @llb/core (platform-agnostic). Re-exported here so existing
// `@/types/notification-types` imports keep working unchanged.
export {
  type NotificationType,
  type AppNotification,
  type NotificationPreferences,
  DEFAULT_PREFERENCES,
  NOTIFICATION_ICONS,
  MAX_NOTIFICATIONS_PER_HOUR,
  TASK_REMINDER_MINUTES,
} from '@llb/core';
