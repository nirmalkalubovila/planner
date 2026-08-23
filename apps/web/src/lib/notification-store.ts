import { create } from 'zustand';
import type { AppNotification, NotificationPreferences } from '@/types/notification-types';
import { DEFAULT_PREFERENCES } from '@/types/notification-types';

// ─── Storage Key Helpers ─────────────────────────────────
const STORAGE_KEY_PREFIX = 'llb-notifications-';

function getUserStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

interface PersistedData {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  deletedKeys: string[];
  shownKeys: string[];
}

function loadUserData(userId: string): PersistedData | null {
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = parsed.state || parsed;
    return {
      notifications: s.notifications || [],
      preferences: s.preferences || {},
      deletedKeys: s.deletedKeys || [],
      shownKeys: s.shownKeys || [],
    };
  } catch {
    return null;
  }
}

function saveUserData(userId: string, data: PersistedData): void {
  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify({ state: data }));
  } catch {}
}

// ─── Store Definition ────────────────────────────────────

interface NotificationState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermission | 'unsupported' | 'default';
  deletedKeys: string[];
  shownKeys: string[];
  currentUserId: string | null;

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
  setUserId: (userId: string | null) => void;
  pruneOldNotifications: () => void;

  // Computed helpers
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    // Start with empty state — NO data is loaded until setUserId() is called.
    // This eliminates the race condition where Zustand persist would hydrate
    // a previous user's data before the auth context calls setUserId().
    notifications: [],
    preferences: DEFAULT_PREFERENCES,
    permissionStatus: 'default',
    deletedKeys: [],
    shownKeys: [],
    currentUserId: null,

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

      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      set((state) => {
        const newShownKeys = notification.dedupKey
          ? [...state.shownKeys, notification.dedupKey]
          : state.shownKeys;
        const filtered = [newNotification, ...state.notifications].filter((n) => n.timestamp >= cutoff);
        return {
          // Keep max 50 notifications, drop oldest
          notifications: filtered.slice(0, 50),
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
        const { deletedKeys: cloudDeletedKeys, shownKeys: cloudShownKeys, ...actualPrefs } = (prefs || {}) as any;
        const newPrefs = actualPrefs ? { ...state.preferences, ...actualPrefs } : state.preferences;
        
        const finalDeletedKeys = Array.from(
          new Set([...state.deletedKeys, ...(cloudDeletedKeys || [])])
        ).slice(-500);
        const finalShownKeys = Array.from(
          new Set([...state.shownKeys, ...(cloudShownKeys || [])])
        ).slice(-500);

        // Filter and merge list based on local deletedKeys and read status
        const rawList = list || state.notifications;
        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        const mergedList = rawList
          .filter((n) => {
            if (finalDeletedKeys.includes(n.id)) return false;
            if (n.dedupKey && finalDeletedKeys.includes(n.dedupKey)) return false;
            if (n.timestamp < cutoff) return false;
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
          deletedKeys: finalDeletedKeys,
          shownKeys: finalShownKeys,
        };
      });
    },

    clearStore: () => {
      set({
        notifications: [],
        preferences: DEFAULT_PREFERENCES,
        deletedKeys: [],
        shownKeys: [],
        currentUserId: null,
      });
    },

    pruneOldNotifications: () => {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      set((state) => {
        const filtered = state.notifications.filter((n) => n.timestamp >= cutoff);
        if (filtered.length === state.notifications.length) return {};
        return { notifications: filtered };
      });
    },

    setUserId: (userId: string | null) => {
      const current = get().currentUserId;
      if (current === userId) return;

      // Save current user's data before switching
      if (current) {
        const state = get();
        saveUserData(current, {
          notifications: state.notifications,
          preferences: state.preferences,
          deletedKeys: state.deletedKeys,
          shownKeys: state.shownKeys,
        });
      }

      if (!userId) {
        // Logged out — reset to defaults but DON'T delete saved data
        set({
          notifications: [],
          preferences: DEFAULT_PREFERENCES,
          deletedKeys: [],
          shownKeys: [],
          currentUserId: null,
        });
        return;
      }

      // Load new user's data from their isolated storage key
      const saved = loadUserData(userId);
      if (saved) {
        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        const loadedNotifications = saved.notifications.filter((n: AppNotification) => n.timestamp >= cutoff);
        set({
          notifications: loadedNotifications,
          preferences: { ...DEFAULT_PREFERENCES, ...(saved.preferences || {}) },
          deletedKeys: saved.deletedKeys || [],
          shownKeys: saved.shownKeys || [],
          currentUserId: userId,
        });
      } else {
        set({
          notifications: [],
          preferences: DEFAULT_PREFERENCES,
          deletedKeys: [],
          shownKeys: [],
          currentUserId: userId,
        });
      }
    },

    getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
  })
);

// ─── Auto-Save Subscriber ────────────────────────────────
// Debounced auto-save: whenever the store changes, flush the current
// user's data to their isolated localStorage key.
let flushTimer: ReturnType<typeof setTimeout> | null = null;

useNotificationStore.subscribe((state) => {
  if (!state.currentUserId) return;

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    const s = useNotificationStore.getState();
    if (!s.currentUserId) return;
    saveUserData(s.currentUserId, {
      notifications: s.notifications,
      preferences: s.preferences,
      deletedKeys: s.deletedKeys,
      shownKeys: s.shownKeys,
    });
  }, 500);
});

// ─── Migration: Clean Up Legacy Global Key ───────────────
// Remove the old global 'llb-notifications' key that could leak data.
// This runs once on module load.
try {
  localStorage.removeItem('llb-notifications');
} catch {}
