import { QueryClient } from '@tanstack/react-query';

// Same defaults as apps/web/src/App.tsx's QueryClient, except gcTime.
//
// gcTime governs eviction from the IN-MEMORY cache, not just the persisted
// copy — but `persistQueryClient` (see @/lib/offline) only ever persists
// what's CURRENTLY in that cache. Web's 10-minute value is fine there,
// since a browser tab losing 10-minutes-unused data just means a refetch.
// On a phone, the entire point of persistence is data still being there
// after being backgrounded for hours or force-quit — a query that gc'd
// out of memory before the app closed is invisible to the next persist
// write and gone on the next cold launch, mid-flight or airplane mode
// notwithstanding. 24h keeps a full day's screens available offline.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});
