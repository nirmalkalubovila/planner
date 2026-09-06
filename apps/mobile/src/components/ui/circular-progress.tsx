import * as React from 'react';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './typography';
import { cn } from '@/lib/cn';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

/** RN twin of apps/web/src/components/ui/circular-progress.tsx — same SVG
 * ring-with-dashoffset technique via react-native-svg (already installed
 * for lucide icons), animated with RN's own Animated instead of
 * framer-motion. */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  trackColor = '#27272a',
  label,
  sublabel,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, 100));

  // useState's lazy initializer rather than `useRef(...).current` — same
  // single stable instance, without a ref read during render.
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 900, useNativeDriver: false }).start();
  }, [clamped, anim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View className={cn('items-center gap-1', className)}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xl font-black text-foreground">{Math.round(clamped)}%</Text>
        </View>
      </View>
      {!!label && (
        <Text variant="small" className="text-center mt-1" numberOfLines={1}>
          {label}
        </Text>
      )}
      {!!sublabel && (
        <Text variant="tiny" className="text-center">
          {sublabel}
        </Text>
      )}
    </View>
  );
};
