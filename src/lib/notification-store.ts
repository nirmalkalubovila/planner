import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification, NotificationPreferences } from '@/types/notification-types';
import { DEFAULT_PREFERENCES } from '@/types/notification-types';

interface NotificationState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermission | 'unsupported' | 'default';
  deletedKeys: string[];
  shownKeys: string[];

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
      deletedKeys: [],
      shownKeys: [],

      addNotification: (notification) => {
        const { shownKeys, deletedKeys } = get();
        if (notification.dedupKey) {
          if (shownKeys.includes(notification.dedupKey) || deletedKeys.includes(notification.dedupKey)) {
            return;
          }
        }

        const newNotification: AppNotification = {
          ...notification,
          id: `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => {
          const newShownKeys = notification.dedupKey
            ? [...state.shownKeys, notification.dedupKey]
            : state.shownKeys;
          return {
            // Keep max 50 notifications, drop oldest
            notifications: [newNotification, ...state.notifications].slice(0, 50),
            shownKeys: newShownKeys.slice(-500),
          };
        });
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
        set((state) => {
          const notif = state.notifications.find((n) => n.id === id);
          const newDeletedKeys = [...state.deletedKeys, id];
          if (notif && notif.dedupKey) {
            newDeletedKeys.push(notif.dedupKey);
          }
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            deletedKeys: newDeletedKeys.slice(-500),
          };
        }),

      clearAll: () =>
        set((state) => {
          const keysToDelete = state.notifications.map((n) => n.id);
          state.notifications.forEach((n) => {
            if (n.dedupKey) {
              keysToDelete.push(n.dedupKey);
            }
          });
          return {
            notifications: [],
            deletedKeys: [...state.deletedKeys, ...keysToDelete].slice(-500),
          };
        }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      syncFromCloud: (prefs, list) => {
        set((state) => {
          const newPrefs = prefs ? { ...state.preferences, ...prefs } : state.preferences;
          // Filter and merge list based on local deletedKeys and read status
          const rawList = list || state.notifications;
          const mergedList = rawList
            .filter((n) => {
              if (state.deletedKeys.includes(n.id)) return false;
              if (n.dedupKey && state.deletedKeys.includes(n.dedupKey)) return false;
              return true;
            })
            .map((n) => {
              const local = state.notifications.find(
                (ln) => ln.id === n.id || (ln.dedupKey && ln.dedupKey === n.dedupKey)
              );
              if (local) {
                return { ...n, read: local.read || n.read };
              }
              return n;
            });

          return {
            preferences: newPrefs,
            notifications: mergedList,
          };
        });
      },

      clearStore: () => {
        set({
          notifications: [],
          preferences: DEFAULT_PREFERENCES,
          deletedKeys: [],
          shownKeys: [],
        });
      },

      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'llb-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
        deletedKeys: state.deletedKeys,
        shownKeys: state.shownKeys,
      }),
    }
  )
);
