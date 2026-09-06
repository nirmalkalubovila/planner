import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardDialog } from './standard-dialog';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
    variant?: 'default' | 'destructive';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Continue",
    cancelText = "Cancel",
    onCancel,
    variant = "default"
}) => {
    const handleCancel = () => {
        if (onCancel) onCancel();
        onClose();
    };

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={AlertTriangle}
            iconClassName={variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600'}
            footer={
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={handleCancel} className="rounded-xl">
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => { onConfirm(); onClose(); }}
                        className="rounded-xl px-6"
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </StandardDialog>
    );
};
