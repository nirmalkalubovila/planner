import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/typography';

/** RN twin of apps/web/src/components/common/page-loader.tsx — same pulsing
 * logo, built with RN's Animated (no Moti/Reanimated pulled in just for
 * this one loop).
 *
 * The Animated.Value is held in useState's lazy initializer rather than the
 * usual `useRef(new Animated.Value(0)).current`: both give one stable
 * instance for the component's life, but reading `.current` during render
 * is a ref access the React Compiler rejects. */
export const PageLoader: React.FC = () => {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <View className="flex-1 items-center justify-center gap-6 py-24">
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Image
          source={require('../../../assets/images/llb-logo-white.png')}
          style={{ width: 56, height: 56 }}
          contentFit="contain"
        />
      </Animated.View>
      <Text variant="tiny" className="uppercase tracking-[0.3em]">
        Loading
      </Text>
    </View>
  );
};
