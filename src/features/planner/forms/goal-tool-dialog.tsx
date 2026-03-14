import React from 'react';
import { X, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/global-types';
import { AIGeneratedPlanSlot } from '@/types/global-types';
import { Input } from '@/components/ui/input';

interface GoalToolDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeGoals: Goal[];
    selectedGoalId: string;
    setSelectedGoalId: (id: string) => void;
    onAllocate: (goalId: string, hours: number) => void;
}

const findNextActiveSlot = (goal: Goal): AIGeneratedPlanSlot | null => {
    if (!goal.plans) return null;
    let nextSlot: AIGeneratedPlanSlot | null = null;
    let found = false;

    const traverse = (slots: AIGeneratedPlanSlot[]) => {
        for (const slot of slots) {
            if (found) return;
            // Check completed status from milestones (best effort matching)
            const isCompleted = goal.milestones?.find(m => m.targetDate === slot.date)?.completed;
            if (!isCompleted) {
                if (slot.estimatedHours) {
                    nextSlot = slot;
                    found = true;
                    return;
                } else if (slot.subPlans && slot.subPlans.length > 0) {
                    traverse(slot.subPlans);
                } else {
                    nextSlot = slot;
                    found = true;
                    return;
                }
            }
        }
    };

    const sortedPlans = goal.plans.slice().sort((a, b) => a.date.localeCompare(b.date));
    traverse(sortedPlans);
    return nextSlot;
};

export const GoalToolDialog: React.FC<GoalToolDialogProps> = ({
    isOpen,
    onClose,
    activeGoals,
    selectedGoalId,
    setSelectedGoalId,
    onAllocate
}) => {
    const [hours, setHours] = React.useState<string>('');

    React.useEffect(() => {
        if (!isOpen) {
            setHours('');
        }
    }, [isOpen]);

    const activeGoal = activeGoals.find(g => g.id === selectedGoalId);

    // Attempt to parse auto-filled hours if goal is chosen
    const nextSlot = activeGoal ? findNextActiveSlot(activeGoal) : null;

    React.useEffect(() => {
        if (isOpen) {
            setHours('');
        }
    }, [selectedGoalId, isOpen]);

    if (!isOpen) return null;

    const handleAllocate = () => {
        const h = parseFloat(hours);
        if (isNaN(h) || h <= 0) {
            alert("Please enter a valid number of hours.");
            return;
        }
        if (h % 0.5 !== 0) {
            alert("Only integer or X.5 hours are allowed (e.g., 2, 2.5, 3).");
            return;
        }
        onAllocate(selectedGoalId, h);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Target size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Goal Strategy</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                        <X size={18} />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Goal to Focus On</label>
                        <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-accent"
                        >
                            <option value="">-- Choose Goal --</option>
                            {activeGoals.map((g) => (
                                <option key={g.id} value={g.id}>{g.title || g.name}</option>
                            ))}
                        </select>
                    </div>

                    {activeGoal && (
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 animate-in slide-in-from-top-2 duration-300 space-y-3">
                            <div>
                                <h4 className="font-bold text-sm mb-1 text-foreground">Next Pending Phase:</h4>
                                <p className="text-sm font-medium text-primary">
                                    {nextSlot ? nextSlot.dayTask : (activeGoal.title || activeGoal.name)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {nextSlot && nextSlot.date ? `Target: ${nextSlot.date}` : `Overall Goal: ${activeGoal.purpose}`}
                                </p>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-primary/10">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hours to Allocate this week</label>
                                <Input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder="e.g. 5 or 5.5"
                                    className="bg-background text-sm font-medium h-10"
                                />
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 mt-1">
                                    <span>Accepts integers (e.g., 2) or half-hours (e.g., 2.5)</span>
                                    {nextSlot?.estimatedHours && (
                                        <span className="font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Sparkles size={10} />
                                            AI Suggestion: {nextSlot.estimatedHours} hrs to complete
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-muted/10 flex flex-col gap-3">
                    <Button
                        disabled={!selectedGoalId || !hours}
                        onClick={handleAllocate}
                        className="w-full rounded-xl h-12 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80"
                    >
                        <Sparkles className="mr-2" size={18} />
                        Auto-Allocate Time Blocks
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl h-11 text-muted-foreground">
                        Cancel
                    </Button>
                </div>

            </div>
        </div>
    );
};
