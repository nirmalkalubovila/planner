import React from 'react';
import { Animated, View } from 'react-native';
import { Map, Trophy } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { usePulseLoop } from './use-theme-animations';

export const TerritoryExpansion: React.FC<DailyThemeProps> = ({ completedTasksCount, totalTasksCount }) => {
  const gridCols = Math.max(4, Math.ceil(totalTasksCount / 3));
  const gridRows = 3;
  const totalCells = gridRows * gridCols;
  const progressFill = Math.floor((completedTasksCount / Math.max(totalTasksCount, 1)) * totalCells);
  const isDomination = completedTasksCount > 0 && completedTasksCount === totalTasksCount;
  const pulseScale = usePulseLoop(isDomination, 1.05, 1.15);

  return (
    <View className="items-center justify-center py-8">
      <Animated.View
        style={{ transform: [{ scale: isDomination ? pulseScale : 1 }], width: gridCols * 34 + 24 }}
        className={cn(
          'flex-row flex-wrap gap-2 p-3 bg-slate-900 border-2 rounded-xl',
          isDomination ? 'border-blue-400 bg-blue-950/40' : 'border-slate-700'
        )}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <View
            key={i}
            className={cn(
              'w-8 h-8 rounded',
              isDomination ? 'bg-blue-400' : i < progressFill ? 'bg-blue-600' : 'bg-slate-800/50'
            )}
          />
        ))}
      </Animated.View>

      <View className="mt-8 items-center">
        <View className="flex-row items-center gap-2">
          {isDomination ? <Trophy size={20} color="#93c5fd" /> : <Map size={18} color="#3b82f6" />}
          <Text className={cn('font-bold uppercase tracking-widest', isDomination ? 'text-blue-300 text-2xl' : 'text-blue-500 text-lg')}>
            {isDomination ? 'Total Domination' : 'Territory'}
          </Text>
        </View>
        {!isDomination && (
          <Text variant="small" className="mt-2">
            {progressFill} / {totalCells} Zones Conquered
          </Text>
        )}
      </View>
    </View>
  );
};
