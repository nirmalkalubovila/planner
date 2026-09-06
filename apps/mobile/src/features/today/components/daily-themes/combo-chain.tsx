import React from 'react';
import { Animated, View } from 'react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { useFlashOnIncrease, usePulseLoop } from './use-theme-animations';

export const ComboChain: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
  const shake = useFlashOnIncrease(completedTasksCount);
  const isPerfect = completedTasksCount > 0 && completedTasksCount === totalTasksCount;
  const pulseScale = usePulseLoop(isPerfect, 1.15, 1.3);

  return (
    <View className="items-center justify-center py-12">
      <Animated.View
        style={{
          transform: [
            { scale: isPerfect ? pulseScale : shake ? 1.1 : 1 },
            { translateX: shake && !isPerfect ? 6 : 0 },
          ],
        }}
      >
        <View className="flex-row items-baseline">
          <Text
            className={cn(
              'text-7xl font-black italic',
              isPerfect ? 'text-yellow-400' : 'text-orange-500'
            )}
          >
            {completedTasksCount}
          </Text>
          <Text className={cn('text-3xl font-black italic ml-2', isPerfect ? 'text-yellow-200' : 'text-orange-300')}>
            HITS
          </Text>
        </View>
      </Animated.View>

      <View className="mt-8">
        {isPerfect ? (
          <Text className="text-xl font-black text-yellow-400 uppercase tracking-[0.3em] text-center">
            Perfect Combo!
          </Text>
        ) : completedTasksCount > 0 ? (
          <Text className="text-sm font-bold text-orange-400/80 uppercase tracking-widest text-center">
            Keep the streak alive
          </Text>
        ) : (
          <Text variant="small" className="uppercase tracking-widest text-center">
            Start the combo
          </Text>
        )}
      </View>
    </View>
  );
};
