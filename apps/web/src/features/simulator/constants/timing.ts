export const BASE_TIMING = {
  networkTransit: 800,       // Duration in ms for packet to travel
  swInstall: 1200,          // Service worker caching assets duration
  swActivation: 800,        // skipWaiting / cache swap duration
  httpCheck: 300,           // Duration of cache check
  autoPollInterval: 8000,   // Frequency of auto-poll checks
  reloadBuffer: 600,        // Delay before refresh mounts new assets
  toastDuration: 5000,
} as const;

export type TimingConfig = typeof BASE_TIMING;
