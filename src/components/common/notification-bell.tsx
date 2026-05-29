import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/lib/notification-store';
import { NotificationPanel } from '@/components/common/notification-panel';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());
  const notifications = useNotificationStore((s) => s.notifications);

  // Detect if new notification just arrived (for shake animation)
  const latestTimestamp = notifications[0]?.timestamp || 0;
  const isRecent = Date.now() - latestTimestamp < 5000;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted hover:bg-accent transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Notifications"
        id="notification-bell"
      >
        <motion.div
          animate={isRecent && unreadCount > 0 ? {
            rotate: [0, -15, 15, -10, 10, -5, 5, 0],
          } : {}}
          transition={{ duration: 0.6 }}
          key={latestTimestamp}
        >
          <Bell size={16} className="text-foreground" />
        </motion.div>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black shadow-lg shadow-red-500/30"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring on unread */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full bg-red-500/40 animate-ping" />
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
