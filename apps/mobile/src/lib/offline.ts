import NetInfo from '@react-native-community/netinfo';
import { onlineManager, type Mutation } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { saveWeekPlanMutationFn, SAVE_WEEK_PLAN_MUTATION_KEY } from '@llb/api';
import type { KVStore } from '@llb/core';
import { queryClient } from './query-client';

/**
 * Wires React Query's own connectivity tracking to the device's real
 * network state. This one call is what makes a `.mutate()` issued while
 * offline PAUSE (React Query's `networkMode: 'online'` default) instead of
 * failing outright, and resume automatically the moment `NetInfo` reports
 * a connection again — no per-mutation code needed for that half of the
 * contract.
 */
export function wireOnlineManager(): void {
  onlineManager.setEventListener(setOnline => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return unsubscribe;
  });
}

/**
 * Registers the mutation logic mutations dehydrated across an app restart
 * need to actually resume. A mutation restored from disk by
 * `persistQueryClient` carries only its `mutationKey` and variables — not
 * its `mutationFn` closure, which can't survive serialization — so
 * `resumePausedMutations()` looks the function up here by key. Must run
 * before that call, which is why this is a separate, synchronous,
 * call-once-at-startup step rather than folded into the per-user
 * attach/detach below.
 */
export function registerOfflineMutationDefaults(): void {
  queryClient.setMutationDefaults(SAVE_WEEK_PLAN_MUTATION_KEY as unknown as readonly unknown[], {
    mutationFn: saveWeekPlanMutationFn as (variables: unknown) => Promise<unknown>,
  });
}

function isSaveWeekPlanMutation(mutation: Mutation): boolean {
  return mutation.options.mutationKey?.[0] === SAVE_WEEK_PLAN_MUTATION_KEY[0];
}

let detach: (() => void) | null = null;

/**
 * Re-keys the persisted cache to whichever user is now signed in (or tears
 * it down entirely on logout), the same discipline
 * `useNotificationStore.setUserId` already applies to its own storage —
 * without it, signing out and into a different account on the same device
 * would surface the first user's cached planner/goals/vault data to the
 * second until fresh network responses overwrote it.
 *
 * Only the planner-save mutation is persisted across a restart (see
 * `shouldDehydrateMutation` below). Every other mutation still pauses and
 * resumes correctly while the app stays running — that's React Query's
 * default `networkMode` behavior and needs no wiring here — but is not
 * survivable across a full app kill yet. Widening that to goals/habits/
 * vault/custom-task writes is real follow-up work: each needs an audit for
 * replay-safety (an insert needs a client-generated id so a replay can't
 * double-create a row) before it's safe to add to the persisted set.
 */
export function attachOfflinePersistence(userId: string | null, kvStore: KVStore): void {
  detach?.();
  detach = null;
  if (!userId) return;

  const storage = {
    getItem: async (key: string) => kvStore.getItem(key),
    setItem: async (key: string, value: string) => {
      kvStore.setItem(key, value);
    },
    removeItem: async (key: string) => {
      kvStore.removeItem(key);
    },
  };

  const persister = createAsyncStoragePersister({
    storage,
    key: `llb-rq-${userId}`,
  });

  const [unsubscribe, restored] = persistQueryClient({
    queryClient,
    persister,
    // A week — long enough to cover a real offline stretch (a trip, a
    // dead SIM) without indefinitely serving data that's gone stale.
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // Bump this if a persisted query/mutation shape ever changes
    // incompatibly, to invalidate every existing cache on next launch
    // rather than hydrating it into code that no longer expects it.
    buster: 'v1',
    dehydrateOptions: {
      shouldDehydrateMutation: isSaveWeekPlanMutation,
    },
  });

  detach = () => {
    unsubscribe();
    persister.removeClient();
  };

  restored.then(() => {
    // Only meaningful once defaults are registered (see
    // registerOfflineMutationDefaults, called once at app startup) — a
    // save that was paused offline when the app was last killed replays
    // here, the moment the device is back online.
    queryClient.resumePausedMutations();
  });
}

export function detachOfflinePersistence(): void {
  detach?.();
  detach = null;
}
