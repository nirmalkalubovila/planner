import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import type { KVStore } from '@llb/core';

const ENCRYPTION_KEY_SECURE_STORE_KEY = 'llb-mmkv-encryption-key';

/**
 * MMKV needs a stable encryption key across launches. SecureStore caps
 * values at 2048 bytes, which a fat Supabase session (user_metadata and
 * all) can exceed — so the *session* lives in encrypted MMKV, and only
 * this short-lived, one-time-generated key lives in SecureStore.
 * SecureStore's primary API is async, so this whole bootstrap is async —
 * callers must await initMmkv() once at startup before anything reads
 * persistent storage (mirrors initSupabase()'s contract).
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_SECURE_STORE_KEY);
  if (existing) return existing;
  const fresh = randomUUID();
  await SecureStore.setItemAsync(ENCRYPTION_KEY_SECURE_STORE_KEY, fresh);
  return fresh;
}

function mmkvToKVStore(instance: MMKV): KVStore {
  return {
    getItem: (key) => instance.getString(key) ?? null,
    setItem: (key, value) => instance.set(key, value),
    removeItem: (key) => instance.delete(key),
    clear: () => instance.clearAll(),
    keys: () => instance.getAllKeys(),
  };
}

export interface MmkvBundle {
  persistentMmkv: MMKV;
  sessionMmkv: MMKV;
  persistentKvStore: KVStore;
  sessionKvStore: KVStore;
}

let bundle: MmkvBundle | null = null;

/** For code that runs after bootstrap (anything mounted under
 *  RootLayout's `ready` gate) and just needs the already-initialized
 *  store — e.g. auth-context keying offline persistence per user. */
export function getMmkvBundle(): MmkvBundle {
  if (!bundle) throw new Error('getMmkvBundle() called before initMmkv() resolved');
  return bundle;
}

/** Must be awaited once at app startup before any @llb/core KV read/write. */
export async function initMmkv(): Promise<MmkvBundle> {
  if (bundle) return bundle;

  const encryptionKey = await getOrCreateEncryptionKey();
  const persistentMmkv = new MMKV({ id: 'llb-persistent', encryptionKey });
  // Session-scoped data (mirrors web's sessionStorage semantics) doesn't
  // need to survive a process restart, so no encryption key needed.
  const sessionMmkv = new MMKV({ id: 'llb-session' });

  bundle = {
    persistentMmkv,
    sessionMmkv,
    persistentKvStore: mmkvToKVStore(persistentMmkv),
    sessionKvStore: mmkvToKVStore(sessionMmkv),
  };
  return bundle;
}
