import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';

import { initMmkv } from '@/lib/mmkv';
import { setupSupabase } from '@/lib/supabase';
import { setupPlatformAdapters } from '@/lib/platform-adapters';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

/**
 * Bootstrap order matters and mirrors the contract each piece documents:
 * MMKV needs its encryption key from SecureStore (async) before anything
 * can read/write it; Supabase's auth storage adapter needs that MMKV
 * instance; and @llb/core's notifier/kv/net ports need to be registered
 * before any @llb/api service or @llb/notifications store is touched by a
 * mounted component. Nothing renders the real app until all three are
 * done — the splash screen stays up instead.
 */
function useBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mmkv = await initMmkv();
        setupSupabase(mmkv.persistentMmkv);
        setupPlatformAdapters(mmkv);
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}

export default function RootLayout() {
  const { ready, error } = useBootstrap();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (ready || error) {
      SplashScreen.hideAsync();
    }
  }, [ready, error]);

  if (error) {
    // A real error screen is a Phase 6 (shared component library) concern —
    // this is just enough to not fail silently during the vertical slice.
    throw error;
  }
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                },
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
