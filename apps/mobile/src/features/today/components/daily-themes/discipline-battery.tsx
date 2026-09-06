import React from 'react';
import { Animated, View } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { usePulseLoop } from './use-theme-animations';

export const DisciplineBattery: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const isOverdrive = progress >= 100;
  const pulseScale = usePulseLoop(isOverdrive, 1, 1.08);

  return (
    <View className="items-center justify-center py-10">
      <Animated.View
        style={{ transform: [{ scale: isOverdrive ? pulseScale : 1 }] }}
        className={cn(
          'w-24 h-48 border-4 rounded-2xl p-1 bg-slate-900 justify-end overflow-hidden',
          isOverdrive ? 'border-yellow-400' : 'border-slate-700'
        )}
      >
        <View
          className={cn('w-full rounded-sm', isOverdrive ? 'bg-yellow-300' : 'bg-emerald-500')}
          style={{ height: `${progress}%` }}
        />
        {progress > 0 && (
          <View className="absolute inset-0 items-center justify-center">
            <Zap size={isOverdrive ? 48 : 40} color={isOverdrive ? '#0f172a' : 'rgba(255,255,255,0.5)'} />
          </View>
        )}
      </Animated.View>

      <View className="mt-8 items-center">
        <Text
          className={cn(
            'font-black uppercase tracking-[0.2em] text-center',
            isOverdrive ? 'text-yellow-400 text-2xl' : 'text-emerald-500 text-xl'
          )}
        >
          {isOverdrive ? 'OVERDRIVE MODE' : 'Charging...'}
        </Text>
        {!isOverdrive && (
          <Text variant="small" className="mt-1">
            {progress.toFixed(0)}% Power
          </Text>
        )}
      </View>
    </View>
  );
};
