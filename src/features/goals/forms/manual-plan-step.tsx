import React, { useState } from 'react';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, ArrowRight } from 'lucide-react';

interface ManualPlanStepProps {
    goal: Goal;
    onSave: (plans: AIGeneratedPlanSlot[]) => void;
    onBack: () => void;
}

export const ManualPlanStep: React.FC<ManualPlanStepProps> = ({ goal, onSave, onBack }) => {
    const [plans, setPlans] = useState<AIGeneratedPlanSlot[]>(
        goal.milestones?.map(m => ({
            date: m.targetDate,
            dayTask: '',
            description: ''
        })) || []
    );

    const updatePlan = (index: number, field: keyof AIGeneratedPlanSlot, value: string) => {
        const newPlans = [...plans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setPlans(newPlans);
    };

    const isComplete = plans.every(p => p.dayTask.trim() !== '');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-xl font-black tracking-tight">Craft Your Plan</h3>
                    <p className="text-sm text-muted-foreground font-medium">Define your core tasks for each milestone phase.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
                    <Button
                        size="sm"
                        disabled={!isComplete}
                        onClick={() => onSave(plans)}
                        className="bg-primary text-primary-foreground font-black"
                    >
                        Save Master Plan <ArrowRight size={14} className="ml-1" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {plans.map((plan, index) => {
                    const milestone = goal.milestones?.[index];
                    return (
                        <div key={index} className="p-5 rounded-2xl border-2 border-border/50 bg-card/50 hover:border-primary/30 transition-all space-y-4 relative group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                                            {milestone?.title || `Phase ${index + 1}`}
                                        </h4>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                            <Calendar size={10} /> {plan.date}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Core Task Name</label>
                                    <Input
                                        value={plan.dayTask}
                                        onChange={(e) => updatePlan(index, 'dayTask', e.target.value)}
                                        placeholder="What is the main task for this milestone?"
                                        className="bg-background/80 border-border/60 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Strategy & Details</label>
                                    <textarea
                                        value={plan.description}
                                        onChange={(e) => updatePlan(index, 'description', e.target.value)}
                                        placeholder="Describe how you will achieve this..."
                                        className="w-full text-sm bg-background/80 border border-border/60 rounded-xl p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isComplete && (
                <p className="text-center text-xs text-destructive font-bold animate-pulse">
                    Please provide a task name for all milestone phases.
                </p>
            )}
        </div>
    );
};
