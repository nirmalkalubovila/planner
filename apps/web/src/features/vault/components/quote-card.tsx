import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Edit2, Quote, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VaultNote, CATEGORY_META } from '@/types/vault';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { VaultReminder } from '@/api/services/reminder-service';

interface QuoteCardProps {
  note: VaultNote;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick: (note: VaultNote) => void;
  onClick: (note: VaultNote) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
  onClick,
}) => {
  const date = new Date(note.createdAt);
  const meta = CATEGORY_META.quotes;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(note)}
      className="group relative rounded-2xl border overflow-hidden flex flex-col bg-card border-border hover:border-emerald-500/40 transition-[border-color,box-shadow] duration-150 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Visual top border */}
      <div className="h-1 w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors" />

      {/* Decorative large quotation mark icon */}
      <div className="absolute right-4 top-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors pointer-events-none">
        <Quote size={80} strokeWidth={1} fill="currentColor" />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header containing pin state and Quote label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {note.is_pinned && (
              <Pin size={12} className="text-amber-400 shrink-0" fill="currentColor" />
            )}
            <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border', meta.bgClass, meta.color)}>
              {meta.label}
            </span>
          </div>
          {reminder && (
            <div 
              title={`Active Reminder: ${reminder.repeat_type} at ${reminder.remind_at || 'random time'}`}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-medium"
            >
              <Bell size={10} className="animate-pulse" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Content styling */}
        <div className="space-y-3 relative z-10">
          <p className="text-[16px] text-foreground/90 font-serif italic leading-relaxed font-normal tracking-wide">
            "{note.content}"
          </p>

          {note.source_page && (
            <div className="text-right">
              <span className="text-[12px] font-semibold text-muted-foreground font-sans">
                — {note.source_page}
              </span>
            </div>
          )}
        </div>

        {/* Title / Quote descriptor & timestamp */}
        <div className="mt-auto pt-2 space-y-1">
          {note.title && note.title !== `Remind: ${note.title}` && (
            <h4 className="text-xs font-bold text-foreground/75 truncate">{note.title}</h4>
          )}
          <span className="text-[10px] text-muted-foreground block">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-muted/5 relative z-20" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
            onClick={() => onEdit(note)}
            aria-label="Edit Quote"
          >
            <Edit2 size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 rounded-lg', note.is_pinned ? 'text-amber-400' : 'text-muted-foreground hover:text-primary hover:bg-accent')}
            onClick={() => onPin(note.id, !note.is_pinned)}
            aria-label={note.is_pinned ? 'Unpin Quote' : 'Pin Quote'}
          >
            <Pin size={13} fill={note.is_pinned ? 'currentColor' : 'none'} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent"
            onClick={() => onDelete(note.id)}
            aria-label="Delete Quote"
          >
            <Trash2 size={13} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all',
            reminder
              ? 'text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
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
