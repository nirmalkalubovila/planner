import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VaultNote, CATEGORY_META } from '@/types/vault';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface NoteCardProps {
  note: VaultNote;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPin, onDelete, onEdit }) => {
  const date = new Date(note.createdAt);
  const meta = CATEGORY_META[note.category] || CATEGORY_META.ideas;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl border overflow-hidden flex flex-col bg-card border-border hover:border-primary/40 transition-[border-color,box-shadow] duration-150"
    >
      {/* Category accent bar */}
      <div className={cn('h-1 w-full', meta.bgClass.replace('/10', '/40'))} />

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Title + category badge */}
        <div className="flex items-start gap-2">
          {note.is_pinned && (
            <Pin size={12} className="shrink-0 mt-1 text-amber-400" fill="currentColor" />
          )}
          <h3 className="font-bold text-[15px] leading-snug text-foreground tracking-tight flex-1 line-clamp-2">
            {note.title || 'Untitled'}
          </h3>
          <span className={cn('shrink-0 mt-0.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border', meta.bgClass, meta.color)}>
            {meta.label}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-4">
          {note.content}
        </p>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground mt-auto pt-1">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>

      {/* Always-visible action bar at the bottom */}
      <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-t border-border/50">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent" onClick={() => onEdit(note)} aria-label="Edit">
          <Edit2 size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7 rounded-lg', note.is_pinned ? 'text-amber-400' : 'text-muted-foreground hover:text-primary hover:bg-accent')}
          onClick={() => onPin(note.id, !note.is_pinned)}
          aria-label={note.is_pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={13} fill={note.is_pinned ? 'currentColor' : 'none'} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent" onClick={() => onDelete(note.id)} aria-label="Delete">
          <Trash2 size={13} />
        </Button>
      </div>
    </motion.article>
  );
};
