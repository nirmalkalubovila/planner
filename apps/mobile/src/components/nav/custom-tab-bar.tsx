import React from 'react';
import type { ComponentProps } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@llb/api';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import {
  EVENT_HORIZON,
  SILVER,
  SILVER_BRIGHT,
  SILVER_CLEAR,
  SILVER_DIM,
  resolveThemeColor,
} from '@/lib/theme-palette';
import { Text } from '@/components/ui/typography';

type TabBarRenderer = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;
type CustomTabBarProps = Parameters<TabBarRenderer>[0];

const FLOATING_ROUTE_NAME = 'today';
const PROFILE_ROUTE_NAME = 'profile';

const BAR_HEIGHT = 62;
const BUTTON_SIZE = 58;
/** How far the raised button pokes above the bar's top edge. */
const BUTTON_LIFT = 22;
/** Ring of page background around the raised button — this is what reads as
 * a notch cut into the bar. Drawn with the resolved background color rather
 * than an SVG path, so it can never mis-resolve against the bar. */
const NOTCH_RING = 6;
/** Width of the horizontal accretion flare, as a multiple of the button. */
const FLARE_SCALE = 1.45;

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  const background = resolveThemeColor('background', colorScheme);
  // White in dark mode, near-black in light mode — the brand's only two
  // "ink" values; silver is reserved for the resting/inactive state.
  const activeColor = resolveThemeColor('foreground', colorScheme);
  const inactiveColor = resolveThemeColor('mutedForeground', colorScheme);

  const avatarUrl =
    profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined) || null;
  const initial = (profile?.fullName || user?.email || 'U').substring(0, 1).toUpperCase();

  const floatingRoute = state.routes.find((r) => r.name === FLOATING_ROUTE_NAME);
  const rowRoutes = state.routes.filter((r) => r.name !== FLOATING_ROUTE_NAME);
  const centerGapIndex = Math.floor(rowRoutes.length / 2);

  const isRouteFocused = (routeKey: string) =>
    state.index === state.routes.findIndex((r) => r.key === routeKey);

  const navigateTo = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const floatingFocused = floatingRoute ? isRouteFocused(floatingRoute.key) : false;

  return (
    <View style={{ paddingBottom: insets.bottom, backgroundColor: background }}>
      <View className="border-t border-border" style={{ height: BAR_HEIGHT, flexDirection: 'row' }}>
        {rowRoutes.map((route, idx) => {
          const { options } = descriptors[route.key];
          const focused = isRouteFocused(route.key);
          const color = focused ? activeColor : inactiveColor;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const isProfile = route.name === PROFILE_ROUTE_NAME;

          return (
            <React.Fragment key={route.key}>
              {idx === centerGapIndex && floatingRoute && <View style={{ flex: 1.1 }} />}
              <Pressable
                onPress={() => navigateTo(route, focused)}
                className="flex-1 items-center justify-center"
                style={{ paddingTop: 8, paddingBottom: 6 }}
              >
                <View style={{ height: 24, justifyContent: 'center' }}>
                  {isProfile ? (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        overflow: 'hidden',
                        borderWidth: focused ? 2 : 1,
                        borderColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Text style={{ fontSize: 10, fontWeight: '700', color }}>{initial}</Text>
                      )}
                    </View>
                  ) : (
                    options.tabBarIcon?.({ focused, color, size: 22 })
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', marginTop: 3 }}
                >
                  {label}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      {floatingRoute && (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: -BUTTON_LIFT, left: 0, right: 0, alignItems: 'center' }}
        >
          <BlackHoleButton
            focused={floatingFocused}
            background={background}
            onPress={() => navigateTo(floatingRoute, floatingFocused)}
            renderIcon={descriptors[floatingRoute.key].options.tabBarIcon}
          />
          <Text
            style={{
              color: floatingFocused ? activeColor : inactiveColor,
              fontSize: 10,
              fontWeight: floatingFocused ? '700' : '500',
              marginTop: BUTTON_LIFT - NOTCH_RING - 4,
            }}
          >
            Today
          </Text>
        </View>
      )}
    </View>
  );
}

/** The raised "Today" control, built as a Gargantua-style black hole: a
 * black event horizon, a bright silver accretion ring around it, a fainter
 * outer halo, and a thin horizontal flare passing behind — all in the
 * brand's white/black/silver only. The flare is sized to stay inside the
 * empty center slot of the bar so it never crosses a neighbouring tab. */
function BlackHoleButton({
  focused,
  background,
  onPress,
  renderIcon,
}: {
  focused: boolean;
  background: string;
  onPress: () => void;
  renderIcon:
    | ((props: { focused: boolean; color: string; size: number }) => React.ReactNode)
    | undefined;
}) {
  const outerSize = BUTTON_SIZE + NOTCH_RING * 2;
  const flareWidth = BUTTON_SIZE * FLARE_SCALE;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius: outerSize / 2,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Accretion flare — the thin lensed disc seen edge-on, behind the
          horizon. Transparent at both ends so it fades into the bar. */}
      <LinearGradient
        colors={[SILVER_CLEAR, SILVER_DIM, SILVER_BRIGHT, SILVER_DIM, SILVER_CLEAR]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          width: flareWidth,
          height: 2,
          borderRadius: 1,
          opacity: focused ? 0.9 : 0.55,
        }}
      />

      {/* Outer halo — the light bent around the far side. */}
      <View
        style={{
          position: 'absolute',
          width: BUTTON_SIZE + 8,
          height: BUTTON_SIZE + 8,
          borderRadius: (BUTTON_SIZE + 8) / 2,
          borderWidth: 1,
          borderColor: SILVER_DIM,
        }}
      />

      {/* Event horizon + accretion ring. */}
      <View
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          backgroundColor: EVENT_HORIZON,
          borderWidth: focused ? 3 : 2,
          borderColor: focused ? SILVER_BRIGHT : SILVER,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 10,
          shadowColor: SILVER_BRIGHT,
          shadowOpacity: focused ? 0.7 : 0.45,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {/* Inner rim, so the horizon reads as depth rather than a flat disc. */}
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            right: 5,
            bottom: 5,
            borderRadius: (BUTTON_SIZE - 10) / 2,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        />
        {renderIcon?.({ focused, color: focused ? SILVER_BRIGHT : SILVER, size: 24 })}
      </View>
    </Pressable>
  );
}
