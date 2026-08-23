import React from 'react';
import { cn } from '@/lib/utils';
import { CATEGORY_META, VaultCategory } from '@/types/vault';
import { Bell } from 'lucide-react';

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
      {tags.map(({ tag, count }) => {
        const meta = CATEGORY_META[tag as VaultCategory];
        if (!meta) return null;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
              activeTag === tag
                ? `${meta.bgClass} ${meta.color}`
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
            )}
          >
            {meta.label} <span className="opacity-60">({count})</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onSelectTag('reminders')}
        className={cn(
          'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border flex items-center gap-1.5',
          activeTag === 'reminders'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
        )}
      >
        <Bell size={11} fill={activeTag === 'reminders' ? 'currentColor' : 'none'} />
        <span>With Reminders</span>
      </button>
    </div>
  );
};
