import React from 'react';
import { BrainCircuit, UserCog, Compass } from 'lucide-react';
import { StandardDialog } from '@/components/common/standard-dialog';

interface MilestoneStrategyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'ai' | 'manual') => void;
}

export const MilestoneStrategyDialog: React.FC<MilestoneStrategyDialogProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Plan Your Success"
            subtitle="Choose your strategy"
            icon={Compass}
            maxWidth="xl"
        >
            <div className="p-8 space-y-6">
                <p className="text-muted-foreground font-medium text-center">How would you like to bridge the gap between your goal and reality?</p>

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
        </StandardDialog>
    );
};
