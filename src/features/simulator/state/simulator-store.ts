import { create } from 'zustand';

export interface LogEntry {
  id: string;
  time: string;
  source: 'server' | 'network' | 'client' | 'sw';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SimulationStep {
  id: string;
  timestamp: number;
  eventType: string;
  description: string;
  technicalDetail: string;
  stateSnapshot: {
    serverVersion: '1.0.0' | '2.0.0';
    clientVersion: '1.0.0' | '2.0.0';
    loadedChunks: string[];
    swStatus: 'uncontrolled' | 'installing' | 'waiting' | 'activating' | 'activated' | 'redundant';
    swActiveVersion: '1.0.0' | '2.0.0';
    swWaitingVersion: '1.0.0' | '2.0.0' | null;
    cacheStorage: { [key: string]: string[] };
    httpCache: string[];
    currentRoute: 'home' | 'details';
    errorBoundary: string | null;
    toastMessage: string | null;
    logs: LogEntry[];
  };
}

export interface NetworkAnimState {
  active: boolean;
  direction: 'to-server' | 'to-client';
  label: string;
  color: string;
}

export interface SimulatorState {
  mode: 'standard' | 'pwa';
  isOnline: boolean;
  networkLatency: number;
  simulationSpeed: number;
  logs: LogEntry[];
  
  // Standard Web App variables
  stdServerVersion: '1.0.0' | '2.0.0';
  stdClientVersion: '1.0.0' | '2.0.0';
  stdDeleteOldChunks: boolean;
  stdLoadedChunks: string[];
  stdRoute: 'home' | 'details';
  stdToast: string | null;
  stdErrorBoundary: string | null;
  stdAutoPoll: boolean;
  
  // PWA variables
  pwaServerVersion: '1.0.0' | '2.0.0';
  pwaClientVersion: '1.0.0' | '2.0.0';
  swStatus: 'uncontrolled' | 'installing' | 'waiting' | 'activating' | 'activated' | 'redundant';
  swActiveVersion: '1.0.0' | '2.0.0';
  swWaitingVersion: '1.0.0' | '2.0.0' | null;
  pwaRoute: 'home' | 'details';
  pwaToast: string | null;
  pwaErrorBoundary: string | null;
  pwaCacheBucket: { [key: string]: string[] };
  
  // Shared / animation state
  networkAnim: NetworkAnimState;
  history: SimulationStep[];
  
  // Actions
  setMode: (mode: 'standard' | 'pwa') => void;
  setIsOnline: (online: boolean) => void;
  setNetworkLatency: (latency: number) => void;
  setSimulationSpeed: (speed: number) => void;
  addLog: (source: LogEntry['source'], message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  
  // Animation triggers
  triggerNetworkTransit: (direction: 'to-server' | 'to-client', label: string, color: string, duration?: number) => Promise<void>;
  
  // Simulation Actions
  deployUpdate: () => Promise<void>;
  checkVersion: (isAuto?: boolean) => Promise<void>;
  handleToastUpdate: () => Promise<void>;
  navigate: (targetRoute: 'home' | 'details') => Promise<void>;
  fallbackHardReload: () => Promise<void>;
  
  // PWA-specific actions
  triggerByteCheck: () => Promise<void>;
  activateNewSw: () => Promise<void>;
  
  // Configuration toggles
  setDeleteOldChunks: (deleteOld: boolean) => void;
  setStdAutoPoll: (poll: boolean) => void;
  
  // History/Replay actions
  takeSnapshot: (eventType: string, description: string, technicalDetail: string) => void;
  undoStep: () => void;
  replayStep: (stepId: string) => void;
  resetSimulation: () => void;
}

const INITIAL_PWA_CACHE = {
  'pwa-cache-v1.0.0': ['index.html', 'main.v1.0.0.js', 'details.v1.0.0.js']
};

export const useSimulatorStore = create<SimulatorState>((set, get) => {
  const getSnapshotState = () => {
    const s = get();
    return {
      serverVersion: s.mode === 'standard' ? s.stdServerVersion : s.pwaServerVersion,
      clientVersion: s.mode === 'standard' ? s.stdClientVersion : s.pwaClientVersion,
      loadedChunks: s.mode === 'standard' ? s.stdLoadedChunks : [],
      swStatus: s.mode === 'pwa' ? s.swStatus : 'uncontrolled',
      swActiveVersion: s.mode === 'pwa' ? s.swActiveVersion : '1.0.0',
      swWaitingVersion: s.mode === 'pwa' ? s.swWaitingVersion : null,
      cacheStorage: s.mode === 'pwa' ? s.pwaCacheBucket : {},
      httpCache: s.mode === 'standard' ? ['index.html', ...s.stdLoadedChunks] : [],
      currentRoute: s.mode === 'standard' ? s.stdRoute : s.pwaRoute,
      errorBoundary: s.mode === 'standard' ? s.stdErrorBoundary : s.pwaErrorBoundary,
      toastMessage: s.mode === 'standard' ? s.stdToast : s.pwaToast,
      logs: [...s.logs]
    };
  };

  return {
    mode: 'standard',
    isOnline: true,
    networkLatency: 0,
    simulationSpeed: 1,
    logs: [],
    
    stdServerVersion: '1.0.0',
    stdClientVersion: '1.0.0',
    stdDeleteOldChunks: true,
    stdLoadedChunks: ['main.v1.0.0.js'],
    stdRoute: 'home',
    stdToast: null,
    stdErrorBoundary: null,
    stdAutoPoll: false,
    
    pwaServerVersion: '1.0.0',
    pwaClientVersion: '1.0.0',
    swStatus: 'activated',
    swActiveVersion: '1.0.0',
    swWaitingVersion: null,
    pwaRoute: 'home',
    pwaToast: null,
    pwaErrorBoundary: null,
    pwaCacheBucket: { ...INITIAL_PWA_CACHE },
    
    networkAnim: { active: false, direction: 'to-server', label: '', color: 'bg-primary' },
    history: [],

    setMode: (mode) => {
      set({ mode, history: [], stdToast: null, pwaToast: null, stdErrorBoundary: null, pwaErrorBoundary: null });
      const { addLog } = get();
      if (mode === 'standard') {
        set({
          stdServerVersion: '1.0.0',
          stdClientVersion: '1.0.0',
          stdLoadedChunks: ['main.v1.0.0.js'],
          stdRoute: 'home'
        });
        addLog('client', 'Loaded Standard Web Application in browser.', 'success');
        addLog('server', 'Serving assets: index.html, main.v1.0.0.js, details.v1.0.0.js, version.json (v1.0.0)', 'info');
      } else {
        set({
          pwaServerVersion: '1.0.0',
          pwaClientVersion: '1.0.0',
          swStatus: 'activated',
          swActiveVersion: '1.0.0',
          swWaitingVersion: null,
          pwaRoute: 'home',
          pwaCacheBucket: { ...INITIAL_PWA_CACHE }
        });
        addLog('client', 'Loaded PWA Web Application in browser.', 'success');
        addLog('sw', 'Service Worker (v1.0.0) is active and controlling the client.', 'success');
        addLog('server', 'Serving assets: index.html, main.v1.0.0.js, details.v1.0.0.js, service-worker.js (v1.0.0)', 'info');
      }
    },

    setIsOnline: (online) => {
      set({ isOnline: online });
      get().addLog('network', `Network status changed to: ${online ? 'ONLINE' : 'OFFLINE'}`, online ? 'success' : 'error');
    },

    setNetworkLatency: (latency) => set({ networkLatency: latency }),
    setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

    addLog: (source, message, type = 'info') => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newEntry: LogEntry = { id: Math.random().toString(), time, source, message, type };
      set((state) => ({ logs: [...state.logs, newEntry].slice(-100) })); // keep max 100 logs in DOM
    },

    clearLogs: () => set({ logs: [] }),

    triggerNetworkTransit: (direction, label, color, duration = 800) => {
      return new Promise((resolve) => {
        const { simulationSpeed, networkLatency } = get();
        const adjustedDuration = (duration + networkLatency) / simulationSpeed;
        set({ networkAnim: { active: true, direction, label, color } });
        setTimeout(() => {
          set((state) => ({ networkAnim: { ...state.networkAnim, active: false } }));
          resolve();
        }, adjustedDuration);
      });
    },

    takeSnapshot: (eventType, description, technicalDetail) => {
      const step: SimulationStep = {
        id: Math.random().toString(),
        timestamp: Date.now(),
        eventType,
        description,
        technicalDetail,
        stateSnapshot: getSnapshotState()
      };
      set((state) => ({ history: [...state.history, step].slice(-20) })); // Keep last 20 steps
    },

    deployUpdate: async () => {
      const s = get();
      const nextVersion = (s.mode === 'standard' ? s.stdServerVersion : s.pwaServerVersion) === '1.0.0' ? '2.0.0' : '1.0.0';
      
      if (s.mode === 'standard') {
        s.takeSnapshot('DEPLOY', `Deployed version v${nextVersion} to App Server`, `Old hash JS chunks deleted: ${s.stdDeleteOldChunks}`);
        s.addLog('server', `Deploying new update v${nextVersion} to production server...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 400));
        set({ stdServerVersion: nextVersion });
        if (s.stdDeleteOldChunks) {
          s.addLog('server', `Server asset cleanup: Deleted older js chunks (details.v${s.stdServerVersion}.js). Only serving new version assets.`, 'error');
        } else {
          s.addLog('server', `Server assets updated. Older chunks kept in file storage.`, 'info');
        }
        s.addLog('server', `Updated version.json on server to: {"version": "${nextVersion}"}`, 'success');
      } else {
        s.takeSnapshot('DEPLOY', `Deployed service worker v${nextVersion} to Server`, `SW byte check required`);
        s.addLog('server', `Deploying new update v${nextVersion} to production server...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 400));
        set({ pwaServerVersion: nextVersion });
        s.addLog('server', `New service-worker.js version v${nextVersion} deployed to server. (Byte size changed)`, 'success');
      }
    },

    checkVersion: async (isAuto = false) => {
      const s = get();
      if (!s.isOnline) {
        s.addLog('network', 'Failed to fetch version.json. Network is offline.', 'error');
        return;
      }

      s.addLog('client', `${isAuto ? 'Auto-polling' : 'Client checking'} for application updates...`, 'info');
      await s.triggerNetworkTransit('to-server', 'GET /version.json [no-cache]', 'bg-blue-500');
      await s.triggerNetworkTransit('to-client', '200 OK (version data)', 'bg-green-500');

      if (s.stdServerVersion !== s.stdClientVersion) {
        s.takeSnapshot('UPDATE_DETECTED', 'Version poll detected newer update', `Server version: ${s.stdServerVersion}, Client version: ${s.stdClientVersion}`);
        s.addLog('client', `Version mismatch detected! (Client: v${s.stdClientVersion}, Server: v${s.stdServerVersion})`, 'warning');
        set({ stdToast: 'New version available. Click to update.' });
        s.addLog('client', 'Triggered UI notification toast: "New version available."', 'success');
      } else {
        s.addLog('client', 'Version is up to date.', 'success');
      }
    },

    handleToastUpdate: async () => {
      const s = get();
      s.addLog('client', 'User clicked update toast button. Reloading page...', 'info');
      set({ stdToast: null });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!s.isOnline) {
        s.addLog('network', 'Reload failed. No internet connection.', 'error');
        set({ stdErrorBoundary: 'Failed to fetch root documents. Network is offline.' });
        return;
      }

      s.takeSnapshot('HARD_RELOAD', 'App reloaded to apply new version', `Client version bumped to ${s.stdServerVersion}`);
      await s.triggerNetworkTransit('to-server', 'GET index.html [no-cache]', 'bg-blue-500');
      await s.triggerNetworkTransit('to-client', 'Loaded new assets', 'bg-green-500');

      set({
        stdClientVersion: s.stdServerVersion,
        stdLoadedChunks: [`main.v${s.stdServerVersion}.js`],
        stdErrorBoundary: null,
        stdRoute: 'home'
      });
      s.addLog('client', `Reload complete. Application mounted successfully on version v${s.stdServerVersion}.`, 'success');
    },

    navigate: async (targetRoute) => {
      const s = get();
      
      if (s.mode === 'standard') {
        if (targetRoute === 'home') {
          set({ stdRoute: 'home' });
          s.addLog('client', 'Navigated to Home page (loaded in main bundle).', 'info');
          return;
        }

        const targetChunk = `details.v${s.stdClientVersion}.js`;
        if (s.stdLoadedChunks.includes(targetChunk)) {
          set({ stdRoute: 'details' });
          s.addLog('client', `Navigated to Details page. Loaded from memory cache.`, 'success');
          return;
        }

        s.addLog('client', `Attempting lazy loading dynamic import of chunk: ${targetChunk}...`, 'info');
        if (!s.isOnline) {
          s.takeSnapshot('CHUNK_FAIL_OFFLINE', 'Navigation failed: offline', `Failed to load ${targetChunk}`);
          s.addLog('network', `Failed to load chunk ${targetChunk}. Network is offline.`, 'error');
          s.addLog('client', `React Router boundary caught error: chunk loading failed (offline).`, 'error');
          set({ stdErrorBoundary: `Network Error: Failed to fetch dynamically imported module: ${targetChunk}` });
          return;
        }

        // Cache-control header simulation check
        s.addLog('network', `Fetching dynamic chunk /assets/${targetChunk} with header: Cache-Control: max-age=31536000, immutable`, 'info');
        await s.triggerNetworkTransit('to-server', `GET /assets/${targetChunk}`, 'bg-blue-500');

        const oldChunkPurged = (s.stdClientVersion !== s.stdServerVersion) && s.stdDeleteOldChunks;
        if (oldChunkPurged) {
          s.takeSnapshot('CHUNK_FAIL_404', 'Lazy chunk loading failed with HTTP 404', `Requested legacy chunk ${targetChunk} but it was purged`);
          await s.triggerNetworkTransit('to-client', '404 Not Found (Purged Asset)', 'bg-red-500');
          s.addLog('network', `Server returned 404 for chunk: /assets/${targetChunk}. File does not exist anymore.`, 'error');
          s.addLog('client', `React Router ErrorBoundary caught chunk loading failure.`, 'error');
          set({ stdErrorBoundary: `Failed to fetch dynamically imported module: ${targetChunk}` });
        } else {
          s.takeSnapshot('CHUNK_SUCCESS', 'Dynamic chunk loaded successfully', `Mounted ${targetChunk}`);
          await s.triggerNetworkTransit('to-client', '200 OK (chunk loaded)', 'bg-green-500');
          set((state) => ({
            stdLoadedChunks: [...state.stdLoadedChunks, targetChunk],
            stdRoute: 'details'
          }));
          s.addLog('client', `Chunk ${targetChunk} loaded and executed successfully. Details page displayed.`, 'success');
        }
      } else {
        // PWA Mode navigation
        if (targetRoute === 'home') {
          set({ pwaRoute: 'home' });
          s.addLog('client', 'Navigated to Home page.', 'info');
          return;
        }

        s.addLog('client', `Requesting dynamic import for details page...`, 'info');
        s.addLog('sw', `Proxy intercepted request for /assets/details.v${s.pwaClientVersion}.js`, 'info');
        
        const activeBucketName = `pwa-cache-v${s.swActiveVersion}`;
        const activeCache = s.pwaCacheBucket[activeBucketName] || [];
        const targetAsset = `details.v${s.pwaClientVersion}.js`;

        if (activeCache.includes(targetAsset)) {
          s.takeSnapshot('PWA_CACHE_HIT', 'PWA loaded asset from CacheStorage', `SW served ${targetAsset} offline-first`);
          s.addLog('sw', `Asset ${targetAsset} found in CacheStorage (${activeBucketName}). Serving from cache instantly (Offline-First).`, 'success');
          set({ pwaRoute: 'details' });
        } else {
          if (!s.isOnline) {
            s.takeSnapshot('PWA_FETCH_OFFLINE', 'PWA asset fetch failed: offline', `Asset ${targetAsset} not in CacheStorage and network offline`);
            s.addLog('sw', `Asset not in cache and network offline. Return Network Error.`, 'error');
            set({ pwaErrorBoundary: 'PWA Failed to fetch dynamically imported module: ' + targetAsset });
          } else {
            s.takeSnapshot('PWA_CACHE_MISS_NET', 'PWA asset cache miss, fetched from network', `Fetched ${targetAsset}`);
            s.addLog('sw', `Asset not in cache. Fetching from network...`, 'warning');
            await s.triggerNetworkTransit('to-server', `GET /assets/${targetAsset}`, 'bg-blue-500');
            set({ pwaRoute: 'details' });
          }
        }
      }
    },

    fallbackHardReload: async () => {
      const s = get();
      s.addLog('client', 'Executing safety-net fallback hard reload...', 'warning');
      set({ stdErrorBoundary: null });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!s.isOnline) {
        s.addLog('client', 'Safety net reload failed. Client remains offline.', 'error');
        set({ stdErrorBoundary: 'Connection timed out. Offline.' });
        return;
      }

      s.takeSnapshot('RECOVERY_RELOAD', 'App recovered after hard reload', `Reset client version to ${s.stdServerVersion}`);
      set((state) => ({
        stdClientVersion: state.stdServerVersion,
        stdLoadedChunks: [`main.v${state.stdServerVersion}.js`],
        stdRoute: 'details'
      }));
      s.addLog('client', `Reloaded page and recovered automatically onto version v${s.stdServerVersion}.`, 'success');
    },

    triggerByteCheck: async () => {
      const s = get();
      if (!s.isOnline) {
        s.addLog('network', 'Byte check failed. Network is offline.', 'error');
        return;
      }

      s.addLog('client', 'Checking server for service-worker.js byte changes...', 'info');
      await s.triggerNetworkTransit('to-server', 'GET /service-worker.js (304 check)', 'bg-blue-500');
      await s.triggerNetworkTransit('to-client', '200 OK (New SW found)', 'bg-green-500');

      if (s.pwaServerVersion !== s.swActiveVersion) {
        s.takeSnapshot('SW_UPDATE_FOUND', 'Byte check found new Service Worker', `Installing SW v${s.pwaServerVersion}`);
        s.addLog('sw', `New Service Worker file discovered! Triggering installation flow...`, 'warning');
        
        // 1. Installation phase
        set({ swStatus: 'installing' });
        s.addLog('sw', `Lifecycle: INSTALLING. Fetching assets for version v${s.pwaServerVersion}...`, 'info');
        
        await s.triggerNetworkTransit('to-server', 'Pre-caching assets v' + s.pwaServerVersion, 'bg-purple-500', 1000);
        
        const newBucketName = `pwa-cache-v${s.pwaServerVersion}`;
        const assetsToCache = ['index.html', `main.v${s.pwaServerVersion}.js`, `details.v${s.pwaServerVersion}.js`];
        
        set((state) => ({
          pwaCacheBucket: {
            ...state.pwaCacheBucket,
            [newBucketName]: assetsToCache
          },
          swStatus: 'waiting',
          swWaitingVersion: state.pwaServerVersion,
          pwaToast: 'New version available. Update now?'
        }));
        
        s.addLog('sw', `Pre-cached assets: ${assetsToCache.join(', ')} in new cache bucket: ${newBucketName}.`, 'success');
        s.addLog('sw', 'Lifecycle: WAITING. Service Worker is waiting for client approval to activate (to avoid breaking current session).', 'warning');
        s.addLog('client', 'PWA Lifecycle event: waiting sw detected. Displayed Toast update popup.', 'success');
      } else {
        s.addLog('sw', 'service-worker.js byte check matches active SW. No update needed.', 'success');
      }
    },

    activateNewSw: async () => {
      const s = get();
      s.addLog('client', 'User approved update. Posting message: SKIP_WAITING to waiting Service Worker...', 'info');
      
      // Safeguard against calling real service worker
      s.addLog('sw', '[Simulator-Safe] Message intercepted inside mock environment (real postMessage blocked).', 'info');
      set({ pwaToast: null });
      
      // 3. Activating phase
      set({ swStatus: 'activating' });
      s.addLog('sw', 'Lifecycle: ACTIVATING. skipWaiting() executed. Transitioning control...', 'info');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Clean up old caches
      const oldBucketName = `pwa-cache-v${s.swActiveVersion}`;
      s.addLog('sw', `Old cache bucket (${oldBucketName}) deleted from CacheStorage.`, 'warning');
      
      s.takeSnapshot('PWA_ACTIVATED', 'New PWA Service Worker activated', `SW version bumped to ${s.pwaServerVersion}`);
      
      set((state) => {
        const nextBuckets = { ...state.pwaCacheBucket };
        delete nextBuckets[oldBucketName];
        return {
          pwaCacheBucket: nextBuckets,
          swStatus: 'activated',
          swActiveVersion: state.pwaServerVersion,
          swWaitingVersion: null
        };
      });
      s.addLog('sw', `Lifecycle: ACTIVATED. Service worker (v${s.pwaServerVersion}) is now active.`, 'success');

      // Reload to mount new cached scripts
      s.addLog('client', 'Service Worker activated. Triggering window.location.reload()...', 'info');
      await new Promise(resolve => setTimeout(resolve, 400));

      set({
        pwaClientVersion: s.pwaServerVersion,
        pwaRoute: 'home'
      });
      s.addLog('client', `PWA Page reloaded. Mounted version v${s.pwaServerVersion} served directly from CacheStorage.`, 'success');
    },

    setDeleteOldChunks: (deleteOld) => set({ stdDeleteOldChunks: deleteOld }),
    setStdAutoPoll: (poll) => set({ stdAutoPoll: poll }),

    undoStep: () => {
      const s = get();
      if (s.history.length === 0) return;
      const newHistory = [...s.history];
      const previousStep = newHistory.pop()!;
      
      const snap = previousStep.stateSnapshot;
      if (s.mode === 'standard') {
        set({
          stdServerVersion: snap.serverVersion,
          stdClientVersion: snap.clientVersion,
          stdLoadedChunks: snap.loadedChunks,
          stdRoute: snap.currentRoute,
          stdErrorBoundary: snap.errorBoundary,
          stdToast: snap.toastMessage,
          logs: snap.logs,
          history: newHistory
        });
      } else {
        set({
          pwaServerVersion: snap.serverVersion,
          pwaClientVersion: snap.clientVersion,
          swStatus: snap.swStatus,
          swActiveVersion: snap.swActiveVersion,
          swWaitingVersion: snap.swWaitingVersion,
          pwaCacheBucket: snap.cacheStorage,
          pwaRoute: snap.currentRoute,
          pwaErrorBoundary: snap.errorBoundary,
          pwaToast: snap.toastMessage,
          logs: snap.logs,
          history: newHistory
        });
      }
      s.addLog('client', `Reverted simulator back to step: "${previousStep.eventType}"`, 'warning');
    },

    replayStep: (stepId) => {
      const s = get();
      const stepIndex = s.history.findIndex(step => step.id === stepId);
      if (stepIndex === -1) return;
      
      const targetStep = s.history[stepIndex];
      const snap = targetStep.stateSnapshot;
      
      if (s.mode === 'standard') {
        set({
          stdServerVersion: snap.serverVersion,
          stdClientVersion: snap.clientVersion,
          stdLoadedChunks: snap.loadedChunks,
          stdRoute: snap.currentRoute,
          stdErrorBoundary: snap.errorBoundary,
          stdToast: snap.toastMessage,
          logs: snap.logs,
          history: s.history.slice(0, stepIndex + 1)
        });
      } else {
        set({
          pwaServerVersion: snap.serverVersion,
          pwaClientVersion: snap.clientVersion,
          swStatus: snap.swStatus,
          swActiveVersion: snap.swActiveVersion,
          swWaitingVersion: snap.swWaitingVersion,
          pwaCacheBucket: snap.cacheStorage,
          pwaRoute: snap.currentRoute,
          pwaErrorBoundary: snap.errorBoundary,
          pwaToast: snap.toastMessage,
          logs: snap.logs,
          history: s.history.slice(0, stepIndex + 1)
        });
      }
      s.addLog('client', `Replayed history state up to: "${targetStep.eventType}"`, 'warning');
    },

    resetSimulation: () => {
      const s = get();
      s.setMode(s.mode); // re-runs mode initializer
    }
  };
});
