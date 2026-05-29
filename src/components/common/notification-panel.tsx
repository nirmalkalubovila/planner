import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Trash2, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/lib/notification-store';
import { NOTIFICATION_ICONS } from '@/types/notification-types';
import type { AppNotification } from '@/types/notification-types';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function groupNotifications(notifications: AppNotification[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  const groups: { label: string; items: AppNotification[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Earlier', items: [] },
  ];

  notifications.forEach((n) => {
    if (n.timestamp >= todayStart) groups[0].items.push(n);
    else if (n.timestamp >= yesterdayStart) groups[1].items.push(n);
    else if (n.timestamp >= weekStart) groups[2].items.push(n);
    else groups[3].items.push(n);
  });

  return groups.filter((g) => g.items.length > 0);
}

const NotificationCard: React.FC<{
  notification: AppNotification;
  onClickAction: () => void;
  onRemove: () => void;
}> = ({ notification, onClickAction, onRemove }) => {
  const icon = NOTIFICATION_ICONS[notification.type] || '🔔';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClickAction}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-150',
        notification.read
          ? 'bg-transparent hover:bg-accent/50'
          : 'bg-primary/5 hover:bg-primary/10 border border-primary/10'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-sm">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-xs leading-tight truncate',
            notification.read ? 'font-medium text-muted-foreground' : 'font-bold text-foreground'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <span className="text-[10px] text-muted-foreground/60 font-medium mt-1 block">
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>

      {/* Remove button (shows on hover) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        aria-label="Remove notification"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-12 right-2 sm:right-4 md:right-8 z-[160] w-[calc(100vw-1rem)] sm:w-96 max-h-[calc(100vh-5rem)]"
          >
            <div className="rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col max-h-[calc(100vh-5rem)]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Clear all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
                      <BellOff size={24} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">All caught up! 🎉</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div key={group.label}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-2 py-1">
                          {group.label}
                        </p>
                        <div className="space-y-1">
                          <AnimatePresence mode="popLayout">
                            {group.items.map((notif) => (
                              <NotificationCard
                                key={notif.id}
                                notification={notif}
                                onClickAction={() => handleNotificationClick(notif)}
                                onRemove={() => removeNotification(notif.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
