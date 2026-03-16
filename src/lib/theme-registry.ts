/**
 * Theme registry — scaffold for Free/Pro tier themes.
 * Expose only light/dark in UI for now; future Pro themes (e.g. pro-midnight, pro-gold) can be added here.
 */

export const THEME_IDS = {
  light: "light",
  dark: "dark",
  // Reserved for future Pro tier: "pro-midnight", "pro-gold"
} as const;

export type ThemeId = (typeof THEME_IDS)[keyof typeof THEME_IDS];

export const FREE_THEMES: ThemeId[] = ["light", "dark"];

export function isThemeAvailable(themeId: string, _tier: "free" | "pro" = "free"): boolean {
  return FREE_THEMES.includes(themeId as ThemeId);
}
