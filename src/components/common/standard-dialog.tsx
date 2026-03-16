import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
};

interface StandardDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    maxWidth?: keyof typeof maxWidthMap;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    hideClose?: boolean;
    closeOnBackdrop?: boolean;
    /** When false, body has no max-height or scroll - content must fit viewport */
    scrollable?: boolean;
}

export const StandardDialog: React.FC<StandardDialogProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    iconClassName,
    maxWidth = 'md',
    children,
    footer,
    className,
    hideClose = false,
    closeOnBackdrop = true,
    scrollable = true,
}) => {
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
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />

                    <motion.div
                        className={cn(
                            'relative bg-card border border-border shadow-2xl rounded-2xl w-full overflow-hidden flex flex-col',
                            maxWidthMap[maxWidth],
                            !scrollable && 'max-h-[90vh]',
                            className
                        )}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {Icon && (
                                    <div className={cn('p-2 rounded-lg shrink-0', iconClassName || 'bg-primary/10 text-primary')}>
                                        <Icon size={20} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold tracking-tight truncate">{title}</h2>
                                    {subtitle && (
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest truncate">{subtitle}</p>
                                    )}
                                </div>
                            </div>
                            {!hideClose && (
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 shrink-0 ml-2">
                                    <X size={18} />
                                </Button>
                            )}
                        </div>

                        <div className={cn('flex-1 min-h-0', scrollable ? 'max-h-[70vh] overflow-y-auto' : 'overflow-hidden')}>
                            {children}
                        </div>

                        {footer && (
                            <div className="p-6 border-t bg-muted/10">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(dialogContent, document.body);
};
