// @llb/tokens — the design system's raw values: Tailwind/NativeWind preset
// (tailwind-preset.js), CSS custom properties (tokens.css), and the plain
// {name, hex} tone constants below for consumers that aren't Tailwind at
// all (a canvas renderer, a native LinearGradient).
import type { LifeBucket, VaultCategory } from '@llb/core';

export interface Tone {
  name: string;
  hex: string;
}

export const BUCKET_TONE: Record<LifeBucket, Tone> = {
  income: { name: 'emerald', hex: '#34d399' },
  asset: { name: 'violet', hex: '#a78bfa' },
  recovery: { name: 'sky', hex: '#38bdf8' },
  relational: { name: 'amber', hex: '#fbbf24' },
};

export const CATEGORY_TONE: Record<VaultCategory, Tone> = {
  ideas: { name: 'cyan', hex: '#22d3ee' },
  problems: { name: 'rose', hex: '#fb7185' },
  future: { name: 'violet', hex: '#a78bfa' },
  nextweek: { name: 'amber', hex: '#fbbf24' },
  quotes: { name: 'emerald', hex: '#34d399' },
  reading: { name: 'teal', hex: '#2dd4bf' },
  resources: { name: 'indigo', hex: '#818cf8' },
};
