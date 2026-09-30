import React, { useMemo } from 'react';
import {
    ComboChain,
    DisciplineBattery,
    ForgeSystem,
    TerritoryExpansion,
    XpBurst,
    EngineDashboard,
    DailyBossFight,
    DailyThemeProps
} from './daily-themes/index';

interface ActiveThemeProps extends DailyThemeProps {
    currentDayStr: string; // e.g. '2026-08-3'
}

const THEMES = [
    ComboChain,
    DisciplineBattery,
    ForgeSystem,
    TerritoryExpansion,
    XpBurst,
    EngineDashboard,
    DailyBossFight
];

/**
 * Day number from a "YYYY-WW-D" day string (year, week 1-52, weekday 1-7). Consecutive days give consecutive
 * numbers, so the themes below rotate strictly in order: every theme appears once per cycle, and none
 * repeats back-to-back the way a random pick can.
 */
const dayOrdinal = (dayStr: string): number => {
    const [year, week, day] = dayStr.split('-').map((n) => parseInt(n, 10));
    if ([year, week, day].some(Number.isNaN)) return 0;
    return year * 364 + (week - 1) * 7 + (day - 1);
};

export const ActiveTheme: React.FC<ActiveThemeProps> = ({ currentDayStr, ...props }) => {
    const themeIndex = useMemo(() => dayOrdinal(currentDayStr) % THEMES.length, [currentDayStr]);

    const SelectedTheme = THEMES[themeIndex];

    return (
        // CSS zoom keeps layout in step with the scaled graphic: about 70% size on phones, full size from sm
        <div className="w-full [zoom:0.7] sm:[zoom:1]">
            <SelectedTheme {...props} />
        </div>
    );
};
