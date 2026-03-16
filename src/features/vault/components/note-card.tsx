import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VaultNote } from '@/types/vault';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

const TAG_COLORS = [
  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
];

function getTagColor(tag: string): string {
  const idx = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % TAG_COLORS.length;
  return TAG_COLORS[idx];
}

interface NoteCardProps {
  note: VaultNote;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPin, onDelete, onEdit }) => {
  const date = new Date(note.createdAt);
  const tags = note.tags ?? [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl border overflow-hidden flex flex-col bg-card border-border hover:border-primary/40 transition-[border-color,box-shadow] duration-150 break-inside-avoid mb-4"
    >
      <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
          onClick={() => onEdit(note)}
          aria-label="Edit"
        >
          <Edit2 size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 rounded-lg',
            note.is_pinned ? 'text-amber-400' : 'text-muted-foreground hover:text-primary hover:bg-accent'
          )}
          onClick={() => onPin(note.id, !note.is_pinned)}
          aria-label={note.is_pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={13} fill={note.is_pinned ? 'currentColor' : 'none'} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent"
          onClick={() => onDelete(note.id)}
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </Button>
      </div>

      <div className="p-4 pr-12 flex flex-col gap-3">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn('px-2 py-0.5 rounded-md text-[10px] font-medium', getTagColor(tag))}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};
