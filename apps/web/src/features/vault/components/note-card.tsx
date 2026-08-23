import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Edit2, Bell, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VaultNote, CATEGORY_META } from '@/types/vault';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { VaultReminder } from '@/api/services/reminder-service';
import { QuoteCard } from './quote-card';

interface NoteCardProps {
  note: VaultNote;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick: (note: VaultNote) => void;
  onClick: (note: VaultNote) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
  onClick,
}) => {
  // If it is a quote, render the special QuoteCard component instead
  if (note.category === 'quotes') {
    return (
      <QuoteCard
        note={note}
        reminder={reminder}
        onPin={onPin}
        onDelete={onDelete}
        onEdit={onEdit}
        onReminderClick={onReminderClick}
        onClick={onClick}
      />
    );
  }

  const date = new Date(note.createdAt);
  const meta = CATEGORY_META[note.category] || CATEGORY_META.ideas;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(note)}
      className="group relative rounded-2xl border overflow-hidden flex flex-col bg-card border-border hover:border-primary/40 transition-[border-color,box-shadow] duration-150 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Category accent bar */}
      <div className={cn('h-1 w-full', meta.bgClass.replace('/10', '/40'))} />

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Title + category badge */}
        <div className="flex items-start gap-2 justify-between">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {note.is_pinned && (
              <Pin size={12} className="shrink-0 mt-1 text-amber-400" fill="currentColor" />
            )}
            <h3 className="font-bold text-[15px] leading-snug text-foreground tracking-tight truncate">
              {note.title || 'Untitled'}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {reminder && (
              <span className="p-0.5 rounded-full bg-primary/10 text-primary" title="Reminder Active">
                <Bell size={10} className="animate-pulse" />
              </span>
            )}
            <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border', meta.bgClass, meta.color)}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-4 select-none">
          {note.content}
        </p>

        {/* Source page info for Reading/Resources if present */}
        {note.source_page && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground/80 font-medium">
            <BookOpen size={10} className="text-primary/70 shrink-0" />
            <span className="truncate">{note.source_page}</span>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground mt-auto pt-1 block">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>

      {/* Action bar at the bottom */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-muted/5 relative z-20" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-0.5">
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

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all',
            reminder
              ? 'text-primary bg-primary/5 hover:bg-primary/10'
              : 'text-muted-foreground hover:text-primary hover:bg-accent'
          )}
          onClick={() => onReminderClick(note)}
        >
          <Bell size={11} fill={reminder ? 'currentColor' : 'none'} />
          {reminder ? 'Reminded' : 'Remind'}
        </Button>
      </div>
    </motion.article>
  );
};
