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

export const CATEGORY_META: Record<VaultCategory, { label: string; color: string; bgClass: string }> = {
  ideas: { label: 'Ideas', color: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20' },
  problems: { label: 'Problems', color: 'text-rose-400', bgClass: 'bg-rose-500/10 border-rose-500/20' },
  future: { label: 'Future', color: 'text-violet-400', bgClass: 'bg-violet-500/10 border-violet-500/20' },
  nextweek: { label: 'Next Week', color: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  quotes: { label: 'Quotes', color: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  reading: { label: 'Reading', color: 'text-teal-400', bgClass: 'bg-teal-500/10 border-teal-500/20' },
  resources: { label: 'Resources', color: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/20' },
};
