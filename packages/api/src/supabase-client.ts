import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@llb/core';

export type LlbSupabaseClient = SupabaseClient<Database>;

let client: LlbSupabaseClient | null = null;

/** Each app calls this once at startup with its own createClient(...) instance. */
export function initSupabase(instance: LlbSupabaseClient): void {
  client = instance;
}

export function getSupabase(): LlbSupabaseClient {
  if (!client) {
    throw new Error('initSupabase() must be called before any @llb/api service is used');
  }
  return client;
}

/**
 * Back-compat proxy: every service module below does `supabase.from(...)`
 * exactly like it always has. Prefer getSupabase() in new code — the proxy
 * exists purely so the existing call sites needed zero edits.
 */
export const supabase: LlbSupabaseClient = new Proxy({} as LlbSupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
