import React from 'react';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/components/common/notification-bell';
import { LiveClock } from '@/components/nav/live-clock';

/** Three-column header mirroring apps/web/src/layout/header.tsx at phone
 * width: brand mark | live clock | notification bell. No screen title (the
 * tab bar already names the screen) and no avatar menu — profile lives in
 * the bottom tab bar, and sign-out on the Profile screen itself. */
export function TopNavBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-border bg-background">
      <View className="flex-row items-center h-14 px-4">
        <View className="flex-1 items-start">
          {/* Bare mark, no plate behind it — the logo sits directly on the
              page background. */}
          <Image
            source={require('../../../assets/images/llb-logo-white.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </View>

        <LiveClock />

        <View className="flex-1 items-end">
          <NotificationBell />
        </View>
      </View>
    </View>
  );
}
