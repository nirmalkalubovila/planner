import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-xl font-bold">AI Strategy</h2>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                            <X size={18} />
                        </Button>
                    )}
                </div>

                {/* Body */}
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

                {/* Footer */}
                <div className="p-6 border-t bg-muted/10 text-center">
                    <p className="text-xs text-muted-foreground italic font-medium">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};
