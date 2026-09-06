import React, { createContext, useContext, useState } from 'react';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { getMmkvBundle } from '@/lib/mmkv';
import type { ColorScheme } from '@/lib/theme-palette';

const THEME_PREFERENCE_KEY = 'llb-theme-preference';

export type ThemePreference = ColorScheme;

interface ThemeContextType {
  colorScheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'dark',
  setPreference: () => {},
});

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

/** Owns the app's light/dark state. Two deliberate choices here:
 *
 * 1. Defaults to 'dark' rather than following the OS. The app is designed
 *    dark-first and apps/web pins `defaultTheme="dark"` in its next-themes
 *    provider, so following a phone's light mode would have made mobile the
 *    odd one out.
 * 2. There's no 'system' option. NativeWind's own colorScheme is set here
 *    purely so its `dark:` variants stay in step; the actual token values
 *    come from RootLayout applying THEME_VARS via vars() — see
 *    lib/theme-palette.ts for why the CSS classes alone can't do that job
 *    on native.
 *
 * Must be mounted after initMmkv() resolves (inside RootLayout's `ready`
 * gate) — getMmkvBundle() throws otherwise. MMKV reads are synchronous, so
 * the stored choice is read in useState's lazy initializer, which avoids
 * rendering one frame in the wrong scheme before an effect could correct it.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const stored = getMmkvBundle().persistentKvStore.getItem(THEME_PREFERENCE_KEY);
    const initial: ColorScheme = isThemePreference(stored) ? stored : 'dark';
    nativewindColorScheme.set(initial);
    return initial;
  });

  const setPreference = (next: ThemePreference) => {
    setColorSchemeState(next);
    nativewindColorScheme.set(next);
    getMmkvBundle().persistentKvStore.setItem(THEME_PREFERENCE_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setPreference }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
