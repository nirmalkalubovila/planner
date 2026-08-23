import { Alert, Platform, ToastAndroid } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { setNotifier, setNetStatus, setStores, type ToastOptions } from '@llb/core';
import type { MmkvBundle } from './mmkv';

/**
 * Minimal cross-platform toast: Android has a native one; iOS/other has no
 * OS-level equivalent, so this falls back to a lightweight Alert. Good
 * enough for the vertical slice — a real <ToastHost/> (matching web's
 * sonner styling) is a Phase 6 shared-component-library task, not
 * something to build ahead of need here.
 */
function showToast(message: string, _options?: ToastOptions) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}

export function setupPlatformAdapters(mmkv: MmkvBundle): void {
  setNotifier({
    default: (message, options) => showToast(message, options),
    success: (message, options) => showToast(message, options),
    error: (message, options) => showToast(message, options),
    info: (message, options) => showToast(message, options),
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
