import React from 'react';
import { Sparkles } from 'lucide-react';
import { StandardDialog } from './standard-dialog';

interface AILoadingPopupProps {
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    message?: string;
    onClose?: () => void;
}

export const AILoadingPopup: React.FC<AILoadingPopupProps> = ({
    isOpen,
    title = "Analyzing Objectives...",
    subtitle = "Architecting your weekly schedule",
    message = "Please stay tuned while our AI builds your plan...",
    onClose
}) => {
    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose || (() => {})}
            title="AI Strategy"
            icon={Sparkles}
            hideClose={!onClose}
            closeOnBackdrop={false}
            footer={
                <p className="text-xs text-muted-foreground italic font-medium text-center">{message}</p>
            }
        >
            <div className="p-8 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="bg-card border-4 border-primary/30 rounded-full p-6 relative animate-spin">
                        <Sparkles className="text-primary" size={48} />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="font-black text-xl tracking-tight mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
                </div>
                <div className="w-full bg-accent/50 rounded-full h-1 overflow-hidden mt-2">
                    <div className="h-full bg-primary w-2/3 animate-[loading_2s_ease-in-out_infinite]" />
                </div>
            </div>
        </StandardDialog>
    );
};
