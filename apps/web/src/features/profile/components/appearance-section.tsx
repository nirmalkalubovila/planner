import React from 'react';
import { useTheme } from 'next-themes';
import { Palette } from 'lucide-react';
import { OptionChips } from '@/components/common/option-chips';

type ThemeChoice = 'dark' | 'light' | 'system';

/** Theme switch. It used to live in the top bar; it belongs with the other preferences. */
export const AppearanceSection: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const current = (theme as ThemeChoice | undefined) ?? 'dark';

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Appearance
            </h3>
            <p className="text-xs text-muted-foreground">Choose how Legacy Life Builder looks on this device.</p>
            <OptionChips<ThemeChoice>
                className="grid-cols-3 sm:grid-cols-3 max-w-md"
                value={current}
                onChange={setTheme}
                options={[
                    { value: 'dark', label: 'Dark', hint: 'Black and gold' },
                    { value: 'light', label: 'Light' },
                    { value: 'system', label: 'System', hint: 'Match device' },
                ]}
            />
        </div>
    );
};
