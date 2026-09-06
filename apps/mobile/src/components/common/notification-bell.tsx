import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useNotificationStore } from '@llb/notifications';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from '@/components/ui/typography';
import { resolveThemeColor } from '@/lib/theme-palette';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/cn';

/** Compact port of apps/web/src/components/common/notification-bell.tsx —
 * same unread-count-in-last-24h badge logic against the shared
 * @llb/notifications store, but the dropdown NotificationPanel becomes a
 * StandardDialog list (no web-only overlay/portal primitives on RN). */
export function NotificationBell() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  // Lazy useState initializer (runs once, at mount) rather than reading
  // Date.now() directly in render/useMemo, which the React Compiler flags
  // as an impure render read — a badge windowed to "the last 24h" doesn't
  // need to be more precise than "as of when this bell mounted" anyway.
  const [cutoff] = useState(() => Date.now() - 24 * 60 * 60 * 1000);

  const last24h = useMemo(
    () => notifications.filter((n) => n.timestamp >= cutoff),
    [notifications, cutoff]
  );

  const unreadCount = useMemo(() => last24h.filter((n) => !n.read).length, [last24h]);

  const handlePress = (id: string, actionUrl?: string) => {
    markAsRead(id);
    setIsOpen(false);
    if (actionUrl) router.push(actionUrl as any);
  };

  return (
    <>
      {/* Bare icon, no plate or border behind it — matches the logo on the
          other side of the header. */}
      <Pressable
        onPress={() => setIsOpen(true)}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Bell size={22} color={resolveThemeColor('foreground', colorScheme)} />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive items-center justify-center">
            <Text className="text-[9px] font-black text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      <StandardDialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Notifications">
        {last24h.length === 0 ? (
          <View className="p-6 items-center">
            <Text variant="muted">No notifications in the last 24 hours.</Text>
          </View>
        ) : (
          <View>
            {last24h.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => handlePress(n.id, n.actionUrl)}
                className={cn(
                  'p-4 border-b border-border',
                  !n.read && 'bg-primary/5'
                )}
              >
                <Text className="font-semibold text-foreground">{n.title}</Text>
                <Text variant="small" className="text-muted-foreground mt-0.5">
                  {n.body}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </StandardDialog>
    </>
  );
}
