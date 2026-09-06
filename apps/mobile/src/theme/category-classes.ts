import type { VaultCategory } from '@llb/core';

// Mirrors apps/web/src/theme/category-classes.ts exactly.
export interface CategoryClasses {
  color: string;
  bgClass: string;
}

export const CATEGORY_CLASSES: Record<VaultCategory, CategoryClasses> = {
  ideas: { color: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20' },
  problems: { color: 'text-rose-400', bgClass: 'bg-rose-500/10 border-rose-500/20' },
  future: { color: 'text-violet-400', bgClass: 'bg-violet-500/10 border-violet-500/20' },
  nextweek: { color: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  quotes: { color: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  reading: { color: 'text-teal-400', bgClass: 'bg-teal-500/10 border-teal-500/20' },
  resources: { color: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/20' },
};
