import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification, NotificationPreferences } from '@/types/notification-types';
import { DEFAULT_PREFERENCES } from '@/types/notification-types';

interface NotificationState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermission | 'unsupported' | 'default';

  // Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setPermissionStatus: (status: NotificationPermission | 'unsupported') => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  syncFromCloud: (prefs?: Partial<NotificationPreferences>, list?: AppNotification[]) => void;
  clearStore: () => void;

  // Computed helpers
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,
      permissionStatus: 'default',

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          // Keep max 50 notifications, drop oldest
          notifications: [newNotification, ...state.notifications].slice(0, 50),
        }));
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      syncFromCloud: (prefs, list) => {
        set((state) => {
          const newPrefs = prefs ? { ...state.preferences, ...prefs } : state.preferences;
          // Only overwrite notifications if list is defined (i.e. fetched from DB)
          const newList = list || state.notifications;
          return {
            preferences: newPrefs,
            notifications: newList,
          };
        });
      },

      clearStore: () => {
        set({
          notifications: [],
          preferences: DEFAULT_PREFERENCES,
        });
      },

      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'llb-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
);
