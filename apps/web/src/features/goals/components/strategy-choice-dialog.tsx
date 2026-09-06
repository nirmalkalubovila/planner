import React from 'react';
import { UserCog, Compass } from 'lucide-react';
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
            title="Build Your Roadmap"
            subtitle="Choose how to plan"
            icon={Compass}
            maxWidth="md"
        >
            <div className="p-6 space-y-5">
                <p className="text-sm text-muted-foreground text-center">How should we create your action plan?</p>

                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        onClick={() => onSelect('ai')}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-200 text-center space-y-3"
                    >
                        <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Recommended
                        </div>
                        <img
                            src="/ai-animation-white.gif"
                            alt="Legacy Planner"
                            className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                        <div>
                            <h3 className="text-base font-black">Legacy Planner</h3>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                AI builds your milestones based on your profile & schedule.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelect('manual')}
                        className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 text-center space-y-3"
                    >
                        <div className="p-3.5 bg-muted rounded-full text-muted-foreground group-hover:scale-110 transition-transform duration-300">
                            <UserCog size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">Manual Craft</h3>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                Define your own milestones and tasks step by step.
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </StandardDialog>
    );
};
