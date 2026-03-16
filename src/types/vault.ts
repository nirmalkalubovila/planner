export interface VaultNote {
  id: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export type VaultFilter = 'all' | 'pinned' | 'nextweek' | 'future' | 'ideas' | 'problems' | 'tag';
