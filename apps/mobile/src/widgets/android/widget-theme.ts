'use no memo';

// Shared look for the three home-screen widgets. Kept apart from
// lib/theme-palette.ts on purpose: widgets are drawn by the launcher, not
// by the app, so they can't follow the in-app light/dark toggle and are
// always the dark treatment. Colors are the brand's white/black/silver
// plus one green for "done".

export const WIDGET = {
  bg: '#0A0A0A',
  surface: '#161616',
  hairline: '#242424',
  text: '#FAFAFA',
  textDim: '#A1A1AA',
  textFaint: '#5A5A63',
  done: '#22C55E',
  doneDim: '#14532D',
  track: '#27272A',
  silver: '#C8CDD4',
} as const;

export const LABEL = {
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 1.5,
  color: WIDGET.textDim,
} as const;

/** Widgets are laid out in absolute dp — RemoteViews has no percentage
 * widths — so anything that should fill the card has to be measured from
 * the size the launcher reports. `widgetInfo.width`/`.height` are the full
 * card size in dp, including the padding these subtract. Users can resize
 * these widgets (resizeMode: horizontal|vertical in app.json); without
 * reading the size back, a resized widget just shows the same fixed layout
 * inside more empty card, which is the "wasted space" problem. */
export function contentWidth(widgetWidthDp: number, padding = 16): number {
  return Math.max(0, Math.round(widgetWidthDp - padding * 2));
}

export function contentHeight(widgetHeightDp: number, padding = 16): number {
  return Math.max(0, Math.round(widgetHeightDp - padding * 2));
}

/** How many extra rows of `rowHeight` fit in whatever content height is left
 * over after `usedHeight` (header, hero content, footer, etc.), capped at
 * `max`. The common shape behind "show more when the widget is resized
 * taller" across all three widgets. */
export function extraRowsFor(availableHeight: number, usedHeight: number, rowHeight: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor((availableHeight - usedHeight) / rowHeight)));
}
