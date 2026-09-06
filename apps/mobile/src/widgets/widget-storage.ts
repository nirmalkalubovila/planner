import type { WidgetSnapshot } from '@llb/core';
import { getMmkvBundle, initMmkv } from '@/lib/mmkv';

const WIDGET_SNAPSHOT_KEY = 'llb-widget-snapshot';

/** The foreground app (which has React Query data) writes the latest
 * buildWidgetSnapshot() result here after every relevant mutation. Native
 * widget code reads it back via readWidgetSnapshot() — a headless JS task
 * has no React tree/React Query cache of its own, so this small persisted
 * JSON blob (not the raw query cache) is the one thing shared between them. */
export function writeWidgetSnapshot(snapshot: WidgetSnapshot): void {
  getMmkvBundle().persistentKvStore.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/** Safe to call from a headless widget task — (re)initializes MMKV's
 * encryption key from SecureStore if this JS instance hasn't already. */
export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  const { persistentKvStore } = await initMmkv();
  const raw = persistentKvStore.getItem(WIDGET_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}
