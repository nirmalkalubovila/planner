import { AppState } from 'react-native';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from '@llb/core';
import { initSupabase, supabase } from '@llb/api';
import type { MMKV } from 'react-native-mmkv';

function mmkvAuthStorage(instance: MMKV): SupportedStorage {
  return {
    getItem: (key) => instance.getString(key) ?? null,
    setItem: (key, value) => instance.set(key, value),
    removeItem: (key) => instance.delete(key),
  };
}

/**
 * Must run after initMmkv() (needs the encrypted MMKV instance) and before
 * any @llb/api service is used. Mirrors apps/web/src/lib/supabaseClient.ts,
 * with the three deltas that matter on native: MMKV instead of
 * localStorage, detectSessionInUrl off (nothing to parse from a URL bar),
 * and PKCE instead of implicit flow (required for the deep-link OAuth
 * round trip — see the (auth)/callback screen once Google sign-in lands).
 */
export function setupSupabase(persistentMmkv: MMKV): void {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set');
  }

  initSupabase(
    createClient<Database>(url, anonKey, {
      auth: {
        storage: mmkvAuthStorage(persistentMmkv),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  );

  // supabase-js's autoRefreshToken timer keeps running in the JS engine
  // while backgrounded (unlike the browser tab it assumes), which both
  // wastes battery and can refresh at the wrong time — gate it on
  // foreground/background exactly like the Supabase RN docs prescribe.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
