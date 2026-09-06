import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { useToastStore, type ToastItem, type ToastType } from '@/stores/toast-store';
import { Text } from '@/components/ui/typography';

const ICONS: Record<ToastType, React.ComponentType<{ size?: number; color?: string }> | null> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  default: null,
};

const ICON_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#60a5fa',
  default: '#a1a1aa',
};

const DISMISS_MS = 3500;

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => dismiss(toast.id), DISMISS_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast.id, dismiss]);

  const Icon = ICONS[toast.type];

  return (
    <Pressable
      onPress={() => dismiss(toast.id)}
      className="flex-row items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
      }}
    >
      {Icon && <Icon size={16} color={ICON_COLORS[toast.type]} />}
      <View className="flex-1">
        <Text className="text-foreground font-medium">{toast.message}</Text>
        {toast.description && (
          <Text variant="small" className="mt-0.5">
            {toast.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** Mounted once at the app root (src/app/_layout.tsx). Registered as the
 * @llb/core notifier impl in platform-adapters.ts so every existing
 * `toast.error(...)` call site — shared and app-local — renders here,
 * matching web's sonner styling instead of an OS Alert/Toast. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 px-4 gap-2" style={{ top: insets.top + 8 }}>
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </View>
  );
}
