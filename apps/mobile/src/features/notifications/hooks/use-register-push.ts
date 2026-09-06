import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useUpsertExpoPushSubscription } from '@llb/api';
import { useAuth } from '@/contexts/auth-context';
import { getExpoPushToken, getPermissionState } from '@/lib/push';

/** Registers this device's Expo push token with the backend whenever
 * permission is already granted (it does NOT prompt — that's a deliberate
 * user action from the preferences screen, mirroring web's own
 * click-to-enable flow rather than an app-open interstitial). Runs once
 * per login and again if the OS permission state ever flips to granted
 * (e.g. the user enabled it from system Settings, not from inside the app). */
export function useRegisterPush() {
  const { user } = useAuth();
  const upsert = useUpsertExpoPushSubscription();
  const lastRegisteredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
    if (lastRegisteredUserId.current === user.id) return;

    (async () => {
      const state = await getPermissionState();
      if (state !== 'granted') return;

      const token = await getExpoPushToken();
      if (!token) return;

      lastRegisteredUserId.current = user.id;
      upsert.mutate({
        expoPushToken: token,
        platform: Platform.OS as 'ios' | 'android',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
}
