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

// Human-readable titles for each theme to display in the card header
const THEME_TITLES = [
    "Combo Chain",
    "Discipline Battery",
    "Forge System",
    "Territory Expansion",
    "Life Support System",
    "Level Up Identity",
    "Engine Dashboard",
    "Daily Boss Fight"
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
    const themeTitle = THEME_TITLES[themeIndex];

    return (
        <div className="w-full">
            <div className="text-center mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-accent/30 px-2 py-1 rounded-full">
                    Today's Theme: {themeTitle}
                </span>
            </div>
            <SelectedTheme {...props} />
        </div>
    );
};
