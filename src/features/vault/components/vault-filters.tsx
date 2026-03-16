import React from 'react';
import { cn } from '@/lib/utils';

interface VaultFiltersProps {
  tags: { tag: string; count: number }[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  className?: string;
}

export const VaultFilters: React.FC<VaultFiltersProps> = ({ tags, activeTag, onSelectTag, className }) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onSelectTag(null)}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all',
          !activeTag
            ? 'bg-glass text-primary border border-border shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
        )}
      >
        All
      </button>
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelectTag(tag)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
            activeTag === tag
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
          )}
        >
          #{tag} <span className="opacity-60">({count})</span>
        </button>
      ))}
    </div>
  );
};
