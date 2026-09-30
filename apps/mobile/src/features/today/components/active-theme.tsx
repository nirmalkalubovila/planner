import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  ComboChain,
  DailyBossFight,
  DailyThemeProps,
  DisciplineBattery,
  EngineDashboard,
  ForgeSystem,
  TerritoryExpansion,
  XpBurst,
} from './daily-themes';

interface ActiveThemeProps extends DailyThemeProps {
  currentDayStr: string;
}

const THEMES = [ComboChain, DisciplineBattery, ForgeSystem, TerritoryExpansion, XpBurst, EngineDashboard, DailyBossFight];

/** Same rotation as apps/web/src/features/today/components/active-theme.tsx: the day number of the
 * "YYYY-WW-D" string modulo the theme count, so every theme appears in turn and web and mobile agree. */
const dayOrdinal = (dayStr: string): number => {
  const [year, week, day] = dayStr.split('-').map((n) => parseInt(n, 10));
  if ([year, week, day].some(Number.isNaN)) return 0;
  return year * 364 + (week - 1) * 7 + (day - 1);
};

export const ActiveTheme: React.FC<ActiveThemeProps> = ({ currentDayStr, ...props }) => {
  const themeIndex = useMemo(() => dayOrdinal(currentDayStr) % THEMES.length, [currentDayStr]);

  const SelectedTheme = THEMES[themeIndex];

  return (
    <View className="w-full">
      <SelectedTheme {...props} />
    </View>
  );
};
