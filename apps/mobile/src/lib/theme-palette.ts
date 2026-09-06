/**
 * The single source of truth for theme colors on native.
 *
 * Why this exists rather than just using packages/tokens/tokens.css:
 * tokens.css defines `:root` (dark values), `.dark`, and `.light`. On the
 * web next-themes toggles the `.light`/`.dark` class on <html> and it all
 * works — but NativeWind only knows about a `dark` variant, so the `.light`
 * block never applies on native and `:root`'s dark values win in *every*
 * color scheme. That's why the app rendered dark regardless of the toggle
 * while anything reading the color scheme from JS (the tab bar) went light,
 * leaving a white bar under a black app.
 *
 * So on native the palette lives here in JS and is applied by RootLayout via
 * NativeWind's vars() on a wrapper View — one authority feeding both the
 * `bg-background`-style classNames (through vars) and the handful of props
 * that need a literal color string (through resolveThemeColor), which is
 * what keeps the two in sync. Values mirror tokens.css's .dark/.light blocks
 * exactly; keep them aligned if that file changes.
 */

export type ColorScheme = 'light' | 'dark';

const DARK_VARS = {
  '--background': '0 0% 0%',
  '--foreground': '0 0% 98%',
  '--muted': '240 5.9% 10%',
  '--muted-foreground': '240 5% 65%',
  '--accent': '240 5.9% 15%',
  '--accent-foreground': '0 0% 98%',
  '--popover': '0 0% 3%',
  '--popover-foreground': '240 5% 85%',
  '--border': '240 5.9% 15%',
  '--input': '240 5.9% 15%',
  '--card': '0 0% 2%',
  '--card-foreground': '0 0% 98%',
  '--primary': '0 0% 98%',
  '--primary-foreground': '0 0% 0%',
  '--secondary': '240 5.9% 10%',
  '--secondary-foreground': '0 0% 98%',
  '--destructive': '0 63% 31%',
  '--destructive-foreground': '210 40% 98%',
  '--ring': '240 5% 65%',
  '--radius': '0.5rem',
  '--intent-goal': '142 71% 45%',
  '--intent-goal-foreground': '0 0% 100%',
  '--intent-goal-muted': '142 71% 45%',
  '--intent-habit': '217 91% 60%',
  '--intent-habit-foreground': '0 0% 100%',
  '--intent-habit-muted': '217 91% 60%',
  '--intent-warning': '38 92% 50%',
  '--intent-warning-foreground': '0 0% 0%',
  '--intent-warning-muted': '38 92% 50%',
  '--primary-rgb': '99 102 241',
  '--glass': '0 0% 100%',
  '--surface-elevated': '0 0% 4%',
} as const;

const LIGHT_VARS = {
  '--background': '0 0% 100%',
  '--foreground': '222.2 84% 4.9%',
  '--muted': '210 40% 96.1%',
  '--muted-foreground': '215.4 16.3% 46.9%',
  '--accent': '210 40% 96.1%',
  '--accent-foreground': '222.2 47.4% 11.2%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '222.2 84% 4.9%',
  '--border': '214.3 31.8% 91.4%',
  '--input': '214.3 31.8% 91.4%',
  '--card': '0 0% 100%',
  '--card-foreground': '222.2 84% 4.9%',
  '--primary': '222.2 47.4% 11.2%',
  '--primary-foreground': '210 40% 98%',
  '--secondary': '210 40% 96.1%',
  '--secondary-foreground': '222.2 47.4% 11.2%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '210 40% 98%',
  '--ring': '222.2 84% 4.9%',
  '--radius': '0.5rem',
  '--intent-goal': '142 76% 36%',
  '--intent-goal-foreground': '0 0% 100%',
  '--intent-goal-muted': '142 76% 36%',
  '--intent-habit': '217 91% 60%',
  '--intent-habit-foreground': '0 0% 100%',
  '--intent-habit-muted': '217 91% 60%',
  '--intent-warning': '38 92% 50%',
  '--intent-warning-foreground': '0 0% 0%',
  '--intent-warning-muted': '38 92% 50%',
  '--primary-rgb': '30 27 75',
  '--glass': '0 0% 0%',
  '--surface-elevated': '0 0% 98%',
} as const;

export const THEME_VARS: Record<ColorScheme, Record<string, string>> = {
  dark: DARK_VARS,
  light: LIGHT_VARS,
};

/** The brand is white / black / silver — no accent hue. These are the
 * fixed (theme-independent) values the raised "Today" tab button is built
 * from: a black event horizon ringed in bright silver. They stay constant
 * across light and dark because the button is meant to read as the same
 * object in both, rather than inverting with `--primary` the way it did
 * when it took its fill from the theme. */
export const EVENT_HORIZON = '#000000';
export const SILVER = '#C8CDD4';
export const SILVER_BRIGHT = '#F2F4F7';
export const SILVER_DIM = 'rgba(200, 205, 212, 0.35)';
/** Fully transparent *silver* rather than the keyword `transparent`, so a
 * gradient fading out doesn't drift toward black on its way there. */
export const SILVER_CLEAR = 'rgba(200, 205, 212, 0)';

const TOKEN_TO_VAR = {
  background: '--background',
  foreground: '--foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  border: '--border',
  card: '--card',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  destructive: '--destructive',
  intentGoal: '--intent-goal',
  intentHabit: '--intent-habit',
  intentWarning: '--intent-warning',
} as const;

export type ThemeColorToken = keyof typeof TOKEN_TO_VAR;

function hslTripletToHex(triplet: string): string {
  const [hRaw, sRaw, lRaw] = triplet.trim().split(/\s+/);
  const h = parseFloat(hRaw);
  const s = parseFloat(sRaw) / 100;
  const l = parseFloat(lRaw) / 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

/** Literal hex for the call sites that can't take a NativeWind className —
 * lucide icons' `color` prop and React Navigation config objects. Reads the
 * same palette vars() applies, so these can't drift from the classNames. */
export function resolveThemeColor(token: ThemeColorToken, scheme: ColorScheme): string {
  return hslTripletToHex(THEME_VARS[scheme][TOKEN_TO_VAR[token]]);
}
