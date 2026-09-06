/** Mobile twin of apps/web/src/features/statistics/components/insights/
 * insight-themes.ts. Web carries both Tailwind gradient classes and raw
 * canvas stops per theme; RN needs only the raw stops (fed to
 * components/ui/linear-gradient) plus accent hexes, so the Tailwind halves
 * are dropped. Same ids, names, and colors, so a card looks the same on
 * both. */

export interface InsightTheme {
  id: string;
  name: string;
  gradient: [string, string, string];
  accent: string;
  glow: string;
}

export const INSIGHT_THEMES: InsightTheme[] = [
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    gradient: ['#0B3C5D', '#328CC1', '#1D2731'],
    accent: '#34d399',
    glow: 'rgba(52, 211, 153, 0.2)',
  },
  {
    id: 'sunset',
    name: 'Sunset Coral',
    gradient: ['#FE5F55', '#F0B67F', '#7A306C'],
    accent: '#fcd34d',
    glow: 'rgba(251, 191, 36, 0.2)',
  },
  {
    id: 'ocean',
    name: 'Ocean Depth',
    gradient: ['#0F2027', '#203A43', '#2C5364'],
    accent: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.2)',
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    gradient: ['#000000', '#1A1A1A', '#C5A059'],
    accent: '#D4AF37',
    glow: 'rgba(212, 175, 55, 0.2)',
  },
  {
    id: 'neon',
    name: 'Neon Dreams',
    gradient: ['#0F0C29', '#302B63', '#24243E'],
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.2)',
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    gradient: ['#134E5E', '#2E7D32', '#71B280'],
    accent: '#86efac',
    glow: 'rgba(134, 239, 172, 0.2)',
  },
];

/** Deterministic per-deck theme pick — same seed (today's date for weekly,
 * year-month for monthly) yields the same colors all day, so a card doesn't
 * change palette between renders. */
export function getInsightTheme(index: number, seed: string): InsightTheme {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % INSIGHT_THEMES.length;
  return INSIGHT_THEMES[(offset + index) % INSIGHT_THEMES.length];
}
