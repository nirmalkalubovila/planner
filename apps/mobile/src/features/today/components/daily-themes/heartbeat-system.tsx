import React from 'react';
import { Animated, View } from 'react-native';
import { Heart, HeartPulse } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { useFlashOnIncrease, usePulseLoop } from './use-theme-animations';

export const HeartbeatSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const pulse = useFlashOnIncrease(completedPoints, 600);
  const isFullVitality = progress >= 100;
  const beatDuration = isFullVitality ? 350 : progress > 50 ? 700 : 1100;
  const beatScale = usePulseLoop(true, 1, 1.15, beatDuration);

  return (
    <View className="items-center justify-center py-12">
      <Animated.View
        style={{
          transform: [{ scale: Animated.multiply(beatScale, isFullVitality ? 1.3 : pulse ? 1.1 : 1) }],
        }}
      >
        <Heart size={isFullVitality ? 90 : 76} color={isFullVitality ? '#f87171' : '#dc2626'} fill={isFullVitality ? '#ef4444' : '#dc2626'} />
      </Animated.View>

      <View className="mt-12 items-center">
        <View className="flex-row items-center gap-2">
          {!isFullVitality && <HeartPulse size={18} color="#ef4444" />}
          <Text className={cn('font-bold uppercase tracking-widest', isFullVitality ? 'text-red-400 text-2xl' : 'text-red-500 text-lg')}>
            {isFullVitality ? 'Full Vitality' : 'Signs of Life'}
          </Text>
        </View>
        {!isFullVitality && (
          <Text variant="small" className="text-red-500/70 mt-1">
            {progress.toFixed(0)} BPM
          </Text>
        )}
      </View>
    </View>
  );
};
