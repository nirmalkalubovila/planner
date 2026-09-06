import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';
import type { DailyThemeProps } from './types';

export const EngineDashboard: React.FC<DailyThemeProps> = ({ completedPoints, totalPoints }) => {
  const [rpm, setRpm] = useState(0);
  const [isShifting, setIsShifting] = useState(false);
  const prevPointsRef = useRef(completedPoints);

  const progressPercentage = Math.min((completedPoints / Math.max(totalPoints, 1)) * 100, 100);
  const isMaxGear = progressPercentage >= 100;
  const gear = isMaxGear ? 'MAX' : Math.min(Math.floor(progressPercentage / 20) + 1, 6);

  useEffect(() => {
    if (isMaxGear) {
      const interval = setInterval(() => setRpm(8500 + Math.random() * 500), 100);
      return () => clearInterval(interval);
    }

    if (completedPoints > prevPointsRef.current) {
      setRpm(8500);
      setIsShifting(true);
      const shiftTimeout = setTimeout(() => {
        setRpm(1500 + (typeof gear === 'number' ? gear : 6) * 500);
        setIsShifting(false);
      }, 600);
      prevPointsRef.current = completedPoints;
      return () => clearTimeout(shiftTimeout);
    } else if (completedPoints < prevPointsRef.current) {
      prevPointsRef.current = completedPoints;
      setRpm(1000);
      const t = setTimeout(() => setRpm(1500), 400);
      return () => clearTimeout(t);
    } else {
      setRpm(completedPoints > 0 ? 1500 + (typeof gear === 'number' ? gear : 6) * 400 + Math.random() * 200 - 100 : 0);
    }
  }, [completedPoints, gear, isMaxGear]);

  const calculateRotation = (currentRpm: number) => {
    const minRotation = -120;
    const rpmRatio = Math.min(Math.max(currentRpm / 9000, 0), 1);
    return minRotation + rpmRatio * 240;
  };

  const needleRotation = calculateRotation(rpm);

  return (
    <View className="w-full max-w-md self-center gap-6 my-6">
      <View className="items-center justify-center">
        <View
          className={cn(
            'w-48 h-48 rounded-full bg-slate-900 border-4 items-center justify-center overflow-hidden',
            isMaxGear ? 'border-red-500' : isShifting ? 'border-red-500/50' : 'border-slate-800'
          )}
        >
          <View className="absolute inset-2 rounded-full border border-slate-700/50" />

          <View
            style={{
              position: 'absolute',
              width: 3,
              height: 76,
              bottom: '50%',
              left: '50%',
              marginLeft: -1.5,
              transform: [{ translateY: 76 }, { rotate: `${needleRotation}deg` }, { translateY: -76 }],
            }}
          >
            <View
              className={cn('w-full rounded-full', isShifting || isMaxGear ? 'bg-white' : 'bg-red-500')}
              style={{ height: 76, width: isShifting || isMaxGear ? 3 : 2 }}
            />
          </View>

          <View className="absolute w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600" />

          <View className="absolute bottom-6 items-center">
            <Text className={cn('font-mono font-bold', isMaxGear ? 'text-red-500 text-3xl' : 'text-white text-xl')}>
              {isMaxGear ? 'MAX' : Math.floor(rpm / 100) * 100}
            </Text>
            {!isMaxGear && (
              <Text variant="tiny" className="uppercase tracking-widest">
                RPM
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className={cn('bg-card border rounded-xl p-4 gap-3', isMaxGear ? 'border-red-500' : 'border-border')}>
        <View className="flex-row justify-between items-end mb-1">
          <View>
            <Text variant="tiny" className="uppercase tracking-wider font-semibold">
              Gear
            </Text>
            <Text className={cn('font-bold', isMaxGear ? 'text-2xl text-red-500 italic' : 'text-xl text-primary')}>GEAR {gear}</Text>
          </View>
          {!isMaxGear && <Text className="text-sm font-mono font-bold text-foreground">{progressPercentage.toFixed(1)}%</Text>}
        </View>
        <View className="h-3 bg-muted rounded-full overflow-hidden">
          <View
            className={cn('h-full', isMaxGear ? 'bg-red-500' : 'bg-blue-500')}
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>
    </View>
  );
};
