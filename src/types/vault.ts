export const VAULT_CATEGORIES = ['ideas', 'problems', 'future', 'nextweek'] as const;
export type VaultCategory = typeof VAULT_CATEGORIES[number];

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  category: VaultCategory;
  tags: string[];
  is_pinned: boolean;
  is_draft: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export type VaultFilter = 'all' | VaultCategory;

export const CATEGORY_META: Record<VaultCategory, { label: string; color: string; bgClass: string }> = {
  ideas: { label: 'Ideas', color: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20' },
  problems: { label: 'Problems', color: 'text-rose-400', bgClass: 'bg-rose-500/10 border-rose-500/20' },
  future: { label: 'Future', color: 'text-violet-400', bgClass: 'bg-violet-500/10 border-violet-500/20' },
  nextweek: { label: 'Next Week', color: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
};
