import NetInfo from '@react-native-community/netinfo';
import { setNotifier, setNetStatus, setStores, type ToastOptions } from '@llb/core';
import { useToastStore, type ToastType } from '@/stores/toast-store';
import type { MmkvBundle } from './mmkv';

function showToast(type: ToastType, message: string, options?: ToastOptions) {
  useToastStore.getState().push({ type, message, description: options?.description });
}

export function setupPlatformAdapters(mmkv: MmkvBundle): void {
  setNotifier({
    default: (message, options) => showToast('default', message, options),
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    info: (message, options) => showToast('info', message, options),
  });

  // net.isOnline() is read synchronously (by canDeliverNotification() and
  // friends), but NetInfo's own API is listener-based — so track the
  // latest known state in a closure and let the port read that.
  let isOnline = true;
  NetInfo.addEventListener((state) => {
    isOnline = state.isConnected ?? true;
  });
  setNetStatus({ isOnline: () => isOnline });

  setStores(mmkv.persistentKvStore, mmkv.sessionKvStore);
}
