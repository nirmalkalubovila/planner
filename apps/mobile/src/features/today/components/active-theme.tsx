import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  ComboChain,
  DailyBossFight,
  DailyThemeProps,
  DisciplineBattery,
  EngineDashboard,
  ForgeSystem,
  HeartbeatSystem,
  TerritoryExpansion,
  XpBurst,
} from './daily-themes';

interface ActiveThemeProps extends DailyThemeProps {
  currentDayStr: string;
}

const THEMES = [ComboChain, DisciplineBattery, ForgeSystem, TerritoryExpansion, HeartbeatSystem, XpBurst, EngineDashboard, DailyBossFight];

/** Verbatim port of apps/web/src/features/today/components/active-theme.tsx
 * — same day-string hash so the theme picked for a given date matches web. */
export const ActiveTheme: React.FC<ActiveThemeProps> = ({ currentDayStr, ...props }) => {
  const themeIndex = useMemo(() => {
    const hash = currentDayStr.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return Math.abs(hash) % THEMES.length;
  }, [currentDayStr]);

  const SelectedTheme = THEMES[themeIndex];

  return (
    <View className="w-full">
      <SelectedTheme {...props} />
    </View>
  );
};
