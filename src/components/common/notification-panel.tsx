import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Trash2, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/lib/notification-store';
import type { AppNotification } from '@/types/notification-types';
import { cn } from '@/lib/utils';

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface NotificationGroup {
  label: string;
  items: AppNotification[];
}

function groupNotifications(notifications: AppNotification[]): NotificationGroup[] {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const recent: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  notifications.forEach((n) => {
    if (now - n.timestamp < oneHour) {
      recent.push(n);
    } else {
      earlier.push(n);
    }
  });

  const result: NotificationGroup[] = [];
  if (recent.length > 0) {
    result.push({ label: 'Recent', items: recent });
  }
  if (earlier.length > 0) {
    result.push({ label: 'Earlier Today', items: earlier });
  }
  return result;
}

/** Strip emoji symbols from notification strings to enforce No Emojis rule */
function stripEmojis(text: string): string {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
}

const NotificationCard: React.FC<{
  notification: AppNotification;
  onClickAction: () => void;
  onMarkAsRead: () => void;
}> = ({ notification, onClickAction, onMarkAsRead }) => {
  const cleanTitle = stripEmojis(notification.title) || notification.title;
  const cleanBody = stripEmojis(notification.body) || notification.body;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClickAction}
      className={cn(
        'group relative flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-colors duration-150',
        notification.read
          ? 'bg-transparent hover:bg-accent/50'
          : 'bg-primary/5 hover:bg-primary/10 border border-primary/10'
      )}
    >
      {!notification.read && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-xs leading-tight break-words pr-2',
            notification.read ? 'font-medium text-muted-foreground' : 'font-bold text-foreground'
          )}>
            {cleanTitle}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
          {cleanBody}
        </p>
        <span className="text-[10px] text-muted-foreground/60 font-medium mt-1 block">
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 self-center opacity-70 group-hover:opacity-100 transition-opacity duration-150">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
            className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors duration-150"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <CheckCheck size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const pruneOldNotifications = useNotificationStore((s) => s.pruneOldNotifications);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      pruneOldNotifications();
    }
  }, [isOpen, pruneOldNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const bellButton = document.getElementById('notification-bell');
        if (bellButton && bellButton.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const last24hNotifications = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return notifications.filter((n) => n.timestamp >= cutoff);
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return last24hNotifications.filter((n) => !n.read).length;
  }, [last24hNotifications]);

  const groups = useMemo(() => groupNotifications(last24hNotifications), [last24hNotifications]);

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
            ref={panelRef}
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
                  {last24hNotifications.length > 0 && (
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
                    <p className="text-sm font-bold text-muted-foreground">All caught up!</p>
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
                                onMarkAsRead={() => markAsRead(notif.id)}
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
