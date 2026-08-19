import React, { useMemo } from 'react';
import {
    ComboChain,
    DisciplineBattery,
    ForgeSystem,
    TerritoryExpansion,
    HeartbeatSystem,
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
    HeartbeatSystem,
    XpBurst,
    EngineDashboard,
    DailyBossFight
];

export const ActiveTheme: React.FC<ActiveThemeProps> = ({ currentDayStr, ...props }) => {
    // Generate a pseudo-random index that stays the same for the entire day
    const themeIndex = useMemo(() => {
        // A simple string hashing function
        const hash = currentDayStr.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        // Ensure positive index within array bounds
        return Math.abs(hash) % THEMES.length;
    }, [currentDayStr]);

    const SelectedTheme = THEMES[themeIndex];

    return (
        <div className="w-full">
            <SelectedTheme {...props} />
        </div>
    );
};
