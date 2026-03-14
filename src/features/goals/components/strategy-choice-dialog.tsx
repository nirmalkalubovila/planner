import React from 'react';
import { BrainCircuit, UserCog, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneStrategyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'ai' | 'manual') => void;
}

export const MilestoneStrategyDialog: React.FC<MilestoneStrategyDialogProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card border shadow-3xl rounded-3xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-full hover:bg-muted z-10"
                >
                    <X size={20} />
                </Button>

                <div className="p-8 space-y-8">
                    <div className="text-center space-y-2 pt-4">
                        <h2 className="text-3xl font-black tracking-tight">Plan Your Success</h2>
                        <p className="text-muted-foreground font-medium">How would you like to bridge the gap between your goal and reality?</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            onClick={() => onSelect('ai')}
                            className="group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-300 text-center space-y-4"
                        >
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Recommended</div>
                            <div className="p-4 bg-primary/20 rounded-full text-primary group-hover:scale-110 transition-transform duration-500">
                                <BrainCircuit size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">AI Architect</h3>
                                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed px-2">Gemini 2.5 Flash analyzes your habits and schedule to build the perfect path.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => onSelect('manual')}
                            className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-border/50 bg-background hover:bg-accent/50 hover:border-foreground/20 transition-all duration-300 text-center space-y-4"
                        >
                            <div className="p-4 bg-accent rounded-full text-foreground/70 group-hover:scale-110 transition-transform duration-500">
                                <UserCog size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground/80">Manual Craft</h3>
                                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed px-2">Take full control. Define your own milestones and tasks exactly as you see fit.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
