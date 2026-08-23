import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pin, Trash2, Edit2, Copy, Check, Bell, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VaultNote, CATEGORY_META } from '@/types/vault';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { VaultReminder } from '@/api/services/reminder-service';

interface NoteViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: VaultNote | null;
  reminder?: VaultReminder | null;
  onPin: (id: string, is_pinned: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote) => void;
  onReminderClick?: (note: VaultNote) => void;
}

export const NoteViewDialog: React.FC<NoteViewDialogProps> = ({
  isOpen,
  onClose,
  note,
  reminder,
  onPin,
  onDelete,
  onEdit,
  onReminderClick,
}) => {
  const [copied, setCopied] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!note) return null;

  const date = new Date(note.createdAt);
  const meta = CATEGORY_META[note.category] || CATEGORY_META.ideas;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto min-h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative bg-card border border-border shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Category accent bar */}
            <div className={cn('h-1.5 w-full shrink-0', meta.bgClass.replace('/10', '/60'))} />

            {/* Actions & Category Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/40 bg-muted/5">
              <span className={cn('shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border', meta.bgClass, meta.color)}>
                {meta.label}
              </span>
              
              <div className="flex items-center gap-1.5">
                {onReminderClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8 rounded-lg', reminder ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-accent')}
                    onClick={() => {
                      if (note) onReminderClick(note);
                    }}
                    title={reminder ? 'Configure reminder' : 'Set reminder'}
                  >
                    <Bell size={14} fill={reminder ? 'currentColor' : 'none'} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
                  onClick={handleCopy}
                  title="Copy content"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
                  onClick={() => {
                    onClose();
                    if (note) onEdit(note);
                  }}
                  title="Edit note"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8 rounded-lg', note.is_pinned ? 'text-amber-400 bg-amber-400/5' : 'text-muted-foreground hover:text-primary hover:bg-accent')}
                  onClick={() => {
                    if (note) onPin(note.id, !note.is_pinned);
                  }}
                  title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin size={14} fill={note.is_pinned ? 'currentColor' : 'none'} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent"
                  onClick={() => {
                    onClose();
                    if (note) onDelete(note.id);
                  }}
                  title="Delete note"
                >
                  <Trash2 size={14} />
                </Button>
                <div className="w-px h-5 bg-border/60 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Close"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Note Content Section */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground whitespace-pre-wrap leading-tight">
                  {note.title || 'Untitled'}
                </h2>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Created {format(date, 'PPP p')}
                </div>
              </div>

              <div className="h-px bg-border/50" />

              {note.category === 'quotes' ? (
                <div className="relative py-4 px-2">
                  <div className="absolute left-0 top-0 text-emerald-500/10 pointer-events-none">
                    <Quote size={40} fill="currentColor" />
                  </div>
                  <p className="text-xl text-foreground font-serif italic leading-relaxed pt-2 pl-8 select-text selection:bg-emerald-500/20">
                    "{note.content}"
                  </p>
                  {note.source_page && (
                    <div className="text-right mt-6">
                      <span className="text-sm font-semibold text-muted-foreground font-sans">
                        — {note.source_page}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-base font-normal pt-1 select-text selection:bg-primary/20">
                    {note.content}
                  </p>
                  {note.source_page && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium bg-muted/20 p-3 rounded-xl border border-border/45 mt-4">
                      <span className="font-bold text-foreground">Source Reference:</span> {note.source_page}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
};
