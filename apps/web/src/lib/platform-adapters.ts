// Wires @llb/core's platform ports to their real web implementations.
// Must run before any code that could call toast/net/kv — imported first
// thing in main.tsx.
import { toast as sonnerToast } from 'sonner';
import { setNotifier, setNetStatus, setStores, type KVStore } from '@llb/core';

setNotifier({
  default: (message, options) => sonnerToast(message, options),
  success: (message, options) => sonnerToast.success(message, options),
  error: (message, options) => sonnerToast.error(message, options),
  info: (message, options) => sonnerToast.info(message, options),
});

setNetStatus({
  isOnline: () => navigator.onLine,
});

function webStorageAdapter(storage: Storage): KVStore {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    clear: () => storage.clear(),
    keys: () => Object.keys(storage),
  };
}

setStores(webStorageAdapter(localStorage), webStorageAdapter(sessionStorage));
