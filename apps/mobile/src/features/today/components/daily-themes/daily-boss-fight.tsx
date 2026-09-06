import React from 'react';
import { Animated, View } from 'react-native';
import { Skull, Swords, Trophy } from 'lucide-react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';
import { useFlashOnIncrease, usePulseLoop } from './use-theme-animations';

export const DailyBossFight: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const progress = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const bossHp = 100 - progress;
  const isVictory = bossHp <= 0;
  const hit = useFlashOnIncrease(completedPoints, 400);
  const pulseScale = usePulseLoop(isVictory, 1.2, 1.35);

  return (
    <View className="items-center justify-center py-6 w-full max-w-sm self-center">
      <View className="flex-row items-center gap-3 mb-6">
        {!isVictory && <Swords size={20} color="#ef4444" />}
        <Text className={cn('font-black uppercase tracking-widest', isVictory ? 'text-yellow-400 text-3xl' : 'text-red-500 text-lg')}>
          {isVictory ? 'VICTORY' : 'The Daily Grind'}
        </Text>
        {!isVictory && <Swords size={20} color="#ef4444" />}
      </View>

      <View className="mb-10 items-center">
        <Animated.View style={{ transform: [{ scale: isVictory ? pulseScale : hit ? 0.9 : 1 }, { translateX: hit && !isVictory ? 6 : 0 }] }}>
          {isVictory ? (
            <View className="items-center justify-center">
              <Skull size={110} color="#1e293b" strokeWidth={1} />
              <Trophy size={72} color="#eab308" fill="#eab308" style={{ position: 'absolute' }} />
            </View>
          ) : (
            <Skull size={92} color="#1e293b" strokeWidth={1.5} />
          )}
        </Animated.View>
        {hit && !isVictory && (
          <Text className="absolute text-3xl font-black italic text-white" style={{ top: '35%' }}>
            CRITICAL!
          </Text>
        )}
        {!isVictory && bossHp > 0 && bossHp <= 15 && (
          <Text className="absolute -bottom-8 text-sm font-black text-red-500 uppercase tracking-widest">
            FINISH HIM!
          </Text>
        )}
      </View>

      {!isVictory && (
        <View className="w-full">
          <View className="flex-row justify-between mb-2 px-1">
            <Text variant="tiny" className="uppercase font-bold">
              Boss HP
            </Text>
            <Text variant="tiny" className="font-bold">
              {bossHp.toFixed(1)}%
            </Text>
          </View>
          <View className="h-5 bg-slate-900 border-2 border-slate-700 rounded-sm overflow-hidden flex-row justify-end">
            <View className="h-full bg-red-600" style={{ width: `${bossHp}%` }} />
          </View>
        </View>
      )}
    </View>
  );
};
