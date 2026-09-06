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
// web-only class strings. Raw color per category (for non-Tailwind
// consumers) lives in @llb/tokens' CATEGORY_TONE.
export const CATEGORY_META: Record<VaultCategory, { label: string }> = {
  ideas: { label: 'Ideas' },
  problems: { label: 'Problems' },
  future: { label: 'Future' },
  nextweek: { label: 'Next Week' },
  quotes: { label: 'Quotes' },
  reading: { label: 'Reading' },
  resources: { label: 'Resources' },
};
