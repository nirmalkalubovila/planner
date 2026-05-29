import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/lib/notification-store';
import { requestNotificationPermission, isNotificationSupported, getPermissionStatus } from '@/lib/notification-service';

const DISMISS_KEY = 'llb-notif-banner-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const NotificationPermissionBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const setPermissionStatus = useNotificationStore((s) => s.setPermissionStatus);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const permission = getPermissionStatus();

    // Already granted
    if (permission === 'granted') {
      setPermissionStatus('granted');
      return;
    }

    // Denied — show different message
    if (permission === 'denied') {
      setIsDenied(true);
      setPermissionStatus('denied');
      // Still show banner to guide user
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) return;
    }

    // Wait a bit before showing to not overwhelm new users
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [setPermissionStatus]);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result === 'unsupported' ? 'default' : result);

    if (result === 'granted') {
      setVisible(false);
    } else if (result === 'denied') {
      setIsDenied(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-primary/5">
            {/* Gradient accent bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {/* Animated bell icon */}
                <div className="flex-shrink-0 relative">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {isDenied ? (
                      <AlertTriangle size={20} className="text-amber-400" />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                      >
                        <Bell size={20} className="text-primary" />
                      </motion.div>
                    )}
                  </div>
                  {!isDenied && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {isDenied ? 'Notifications Blocked' : 'Enable Notifications'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isDenied
                      ? 'Notifications are blocked. Open your browser settings to allow them for this site.'
                      : 'Get reminded when tasks start, track your streaks, and receive daily briefings.'}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {!isDenied && (
                      <button
                        onClick={handleEnable}
                        className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                      >
                        Enable
                      </button>
                    )}
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isDenied ? 'Got it' : 'Not now'}
                    </button>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
