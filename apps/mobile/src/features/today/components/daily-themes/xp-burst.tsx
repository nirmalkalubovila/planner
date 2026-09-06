import React from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';

export const XpBurst: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const isRelentless = progress >= 100;

  let levelIdentity = 'Unstable';
  let levelColorClass = 'text-slate-400';
  let levelNum = 1;
  let barColorClass = 'bg-blue-500';

  if (isRelentless) {
    levelIdentity = 'Relentless';
    levelColorClass = 'text-purple-300';
    levelNum = 10;
    barColorClass = 'bg-purple-500';
  } else if (progress >= 80) {
    levelIdentity = 'Disciplined';
    levelColorClass = 'text-blue-400';
    levelNum = 8;
  } else if (progress >= 50) {
    levelIdentity = 'Consistent';
    levelColorClass = 'text-green-400';
    levelNum = 5;
    barColorClass = 'bg-green-500';
  } else if (progress >= 20) {
    levelIdentity = 'Awakening';
    levelColorClass = 'text-yellow-400';
    levelNum = 2;
    barColorClass = 'bg-yellow-500';
  }

  return (
    <View className="items-center justify-center py-10 w-full max-w-sm self-center">
      <View className="flex-row items-end justify-between w-full mb-4 px-1">
        <View>
          {!isRelentless && (
            <Text variant="tiny" className="uppercase tracking-wider mb-1">
              Current Status
            </Text>
          )}
          <Text className={cn('font-black uppercase tracking-widest', levelColorClass, isRelentless ? 'text-4xl' : 'text-2xl')}>
            {levelIdentity}
          </Text>
        </View>
        {!isRelentless && (
          <Text variant="tiny" className="uppercase font-bold">
            Level {levelNum}
          </Text>
        )}
      </View>

      <View className={cn('w-full bg-slate-900 border-2 rounded-lg overflow-hidden', isRelentless ? 'h-8 border-purple-400' : 'h-6 border-slate-700')}>
        <View className={cn('h-full', barColorClass)} style={{ width: `${progress}%` }} />
      </View>

      <View className="mt-4">
        {isRelentless ? (
          <View className="flex-row gap-1">
            <Star size={16} color="#facc15" fill="#facc15" />
            <Star size={16} color="#facc15" fill="#facc15" />
            <Star size={16} color="#facc15" fill="#facc15" />
          </View>
        ) : (
          <Text variant="tiny" className="uppercase tracking-widest">
            {completedPoints.toFixed(0)} / {totalPoints.toFixed(0)} XP
          </Text>
        )}
      </View>
    </View>
  );
};
