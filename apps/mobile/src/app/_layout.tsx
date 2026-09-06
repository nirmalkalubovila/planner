import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { View } from 'react-native';

import { initMmkv } from '@/lib/mmkv';
import { setupSupabase } from '@/lib/supabase';
import { setupPlatformAdapters } from '@/lib/platform-adapters';
import { registerOfflineMutationDefaults, wireOnlineManager } from '@/lib/offline';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { THEME_VARS, resolveThemeColor } from '@/lib/theme-palette';
import { ToastHost } from '@/components/toast-host';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';

SplashScreen.preventAutoHideAsync();

// Foreground presentation for local AND remote notifications alike — expo-
// notifications otherwise stays silent while the app is open. The shared
// delivery gate (quiet hours, per-type prefs, rate limit) has already run
// by the time anything reaches scheduleNotificationAsync/a push arrives,
// so there's nothing left to re-check here.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    // useWidgetSync() keeps the badge in sync with today's remaining task
    // count on its own schedule (query changes, not each notification) —
    // this only controls whether an incoming notification is itself allowed
    // to bump the OS badge, which we do want now that badges are wired up.
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** A notification's `actionUrl` already holds an Expo Router path (e.g.
 * `/today`, `/goals`) — both the local schedulers here and the server
 * cron job's payload use the same convention, so this one listener covers
 * every notification source without needing to know which produced it. */
function useNotificationTapRouter() {
  const router = useRouter();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const actionUrl = response.notification.request.content.data?.actionUrl;
      if (typeof actionUrl === 'string' && actionUrl) {
        router.push(actionUrl as any);
      }
    });
    return () => sub.remove();
  }, [router]);
}

/**
 * Bootstrap order matters and mirrors the contract each piece documents:
 * MMKV needs its encryption key from SecureStore (async) before anything
 * can read/write it; Supabase's auth storage adapter needs that MMKV
 * instance; @llb/core's notifier/kv/net ports need to be registered
 * before any @llb/api service or @llb/notifications store is touched by a
 * mounted component; and the offline mutation defaults must be registered
 * before auth-context attaches per-user persistence and resumes any
 * mutation that was paused offline when the app was last killed. Nothing
 * renders the real app until all of this is done — the splash screen
 * stays up instead.
 */
function useBootstrap(retryCount: number) {
  // One state object stamped with the attempt it belongs to, instead of
  // separate ready/error flags that the effect had to clear synchronously
  // on every run (a setState-in-effect the React Compiler rejects). A
  // result from attempt N is simply ignored once we're on attempt N+1.
  const [outcome, setOutcome] = useState<{
    attempt: number;
    ready: boolean;
    error: Error | null;
  }>({ attempt: -1, ready: false, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mmkv = await initMmkv();
        setupSupabase(mmkv.persistentMmkv);
        setupPlatformAdapters(mmkv);
        wireOnlineManager();
        registerOfflineMutationDefaults();
        if (!cancelled) setOutcome({ attempt: retryCount, ready: true, error: null });
      } catch (err) {
        if (!cancelled) setOutcome({ attempt: retryCount, ready: false, error: err as Error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const isCurrent = outcome.attempt === retryCount;
  return { ready: isCurrent && outcome.ready, error: isCurrent ? outcome.error : null };
}

function BootstrapErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-background items-center justify-center px-6 gap-3">
        <Heading level="h3" className="text-center">
          Couldn&apos;t start Legacy Life Builder
        </Heading>
        <Text variant="muted" className="text-center">
          {error.message || 'Something went wrong during startup.'}
        </Text>
        <Button onPress={onRetry} className="mt-2">
          Try again
        </Button>
      </View>
    </SafeAreaProvider>
  );
}

/** Applies the active palette as CSS variables over the whole tree, which
 * is what makes `bg-background`/`text-foreground` etc. actually respond to
 * the theme on native — see lib/theme-palette.ts for why tokens.css alone
 * can't. Everything themed must render inside this View. */
function ThemedRoot() {
  const { colorScheme } = useTheme();
  const background = resolveThemeColor('background', colorScheme);

  return (
    <View style={[{ flex: 1 }, vars(THEME_VARS[colorScheme])]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: background },
        }}
      />
      <ToastHost />
    </View>
  );
}

export default function RootLayout() {
  const [retryCount, setRetryCount] = useState(0);
  const { ready, error } = useBootstrap(retryCount);
  useNotificationTapRouter();

  useEffect(() => {
    if (ready || error) {
      SplashScreen.hideAsync();
    }
  }, [ready, error]);

  if (error) {
    return <BootstrapErrorScreen error={error} onRetry={() => setRetryCount((c) => c + 1)} />;
  }
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemedRoot />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
