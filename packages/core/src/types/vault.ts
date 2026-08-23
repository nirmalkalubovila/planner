export const VAULT_CATEGORIES = ['ideas', 'problems', 'future', 'nextweek', 'quotes', 'reading', 'resources'] as const;
export type VaultCategory = typeof VAULT_CATEGORIES[number];

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  category: VaultCategory;
  tags: string[];
  is_pinned: boolean;
  is_draft: boolean;
  source_page?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type VaultFilter = 'all' | VaultCategory | 'reminders';

// Presentational fields (color/bgClass Tailwind strings) moved to
// apps/web/src/theme/category-classes.ts — shared code must not embed
// web-only class strings. See CATEGORY_TONE below for the raw color.
export const CATEGORY_META: Record<VaultCategory, { label: string }> = {
  ideas: { label: 'Ideas' },
  problems: { label: 'Problems' },
  future: { label: 'Future' },
  nextweek: { label: 'Next Week' },
  quotes: { label: 'Quotes' },
  reading: { label: 'Reading' },
  resources: { label: 'Resources' },
};

export interface CategoryTone {
  name: string;
  hex: string;
}

/** Raw color per category, independent of any styling system. */
export const CATEGORY_TONE: Record<VaultCategory, CategoryTone> = {
  ideas: { name: 'cyan', hex: '#22d3ee' },
  problems: { name: 'rose', hex: '#fb7185' },
  future: { name: 'violet', hex: '#a78bfa' },
  nextweek: { name: 'amber', hex: '#fbbf24' },
  quotes: { name: 'emerald', hex: '#34d399' },
  reading: { name: 'teal', hex: '#2dd4bf' },
  resources: { name: 'indigo', hex: '#818cf8' },
};
