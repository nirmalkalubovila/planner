import React from 'react';
import { X, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/global-types';

interface GoalToolDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeGoals: Goal[];
    selectedGoalId: string;
    setSelectedGoalId: (id: string) => void;
    isGenerating: boolean;
    onGenerate: () => void;
}

export const GoalToolDialog: React.FC<GoalToolDialogProps> = ({
    isOpen,
    onClose,
    activeGoals,
    selectedGoalId,
    setSelectedGoalId,
    isGenerating,
    onGenerate
}) => {
    if (!isOpen) return null;

    const activeGoal = activeGoals.find(g => g.id === selectedGoalId);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Target size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Goal Strategy</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8" disabled={isGenerating}>
                        <X size={18} />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <div className="bg-card border-4 border-primary/30 rounded-full p-4 relative animate-spin">
                                    <Sparkles className="text-primary" size={32} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Analyzing Objectives...</h3>
                                <p className="text-sm text-muted-foreground">Architecting your weekly schedule</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Goal to Focus On</label>
                                <select
                                    value={selectedGoalId}
                                    onChange={(e) => setSelectedGoalId(e.target.value)}
                                    className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-accent"
                                >
                                    <option value="">-- Choose Goal --</option>
                                    {activeGoals.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedGoalId && (
                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                                    <h4 className="font-bold text-sm mb-1">Impact Strategy</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        We'll generate a custom schedule for <span className="text-foreground font-semibold">"{activeGoal?.name}"</span>
                                        optimized for your specific milestones and constraints.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-muted/10 flex flex-col gap-3">
                    {!isGenerating && (
                        <>
                            <Button
                                disabled={!selectedGoalId}
                                onClick={onGenerate}
                                className="w-full rounded-xl h-12 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80"
                            >
                                <Sparkles className="mr-2" size={18} />
                                Generate Plan
                            </Button>
                            <Button variant="ghost" onClick={onClose} className="w-full rounded-xl h-11 text-muted-foreground">
                                Cancel
                            </Button>
                        </>
                    )}
                    {isGenerating && (
                        <div className="text-center text-xs text-muted-foreground italic py-2">
                            Please stay tuned while our AI builds your plan...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};