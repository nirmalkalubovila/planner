import React from 'react';
import { Animated, View } from 'react-native';
import { Hammer } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { useFlashOnIncrease, usePulseLoop } from './use-theme-animations';

export const ForgeSystem: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const strike = useFlashOnIncrease(completedPoints, 300);
  const isMasterpiece = progress >= 100;
  const pulseScale = usePulseLoop(isMasterpiece, 1.15, 1.3);

  return (
    <View className="items-center justify-center py-10">
      <Animated.View style={{ transform: [{ scale: isMasterpiece ? pulseScale : strike ? 1.1 : 1 }] }}>
        <Hammer size={80} color={isMasterpiece ? '#facc15' : strike ? '#fdba74' : '#94a3b8'} />
      </Animated.View>

      <View
        className={cn('w-48 rounded-full mt-10 bg-slate-800 overflow-hidden', isMasterpiece ? 'h-6' : 'h-4')}
      >
        <View
          className={cn('h-full rounded-full', isMasterpiece ? 'bg-yellow-300' : 'bg-orange-500')}
          style={{ width: `${progress}%` }}
        />
      </View>

      <View className="mt-6 items-center">
        <Text
          className={cn(
            'font-bold uppercase tracking-widest text-center',
            isMasterpiece ? 'text-yellow-400 text-2xl' : 'text-orange-500 text-lg'
          )}
        >
          {isMasterpiece ? 'Masterpiece Forged' : 'Forging Identity'}
        </Text>
        {!isMasterpiece && (
          <Text variant="tiny" className="mt-1">
            Heat level: {progress.toFixed(0)}°C
          </Text>
        )}
      </View>
    </View>
  );
};
