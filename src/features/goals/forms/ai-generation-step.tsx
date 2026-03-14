import React from 'react';
import { Sparkles, Check, X, RotateCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIGeneratedPlanSlot } from '@/types/global-types';
import { cn } from '@/lib/utils';

interface AIGenerationStepProps {
    onGenerate: () => void;
    generating: boolean;
    previewPlan?: AIGeneratedPlanSlot[] | null;
    onConfirm?: () => void;
    onCancelPreview?: () => void;
}

export const AIGenerationStep: React.FC<AIGenerationStepProps> = ({
    onGenerate,
    generating,
    previewPlan,
    onConfirm,
    onCancelPreview
}) => {
    if (previewPlan) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="text-primary w-5 h-5" />
                            AI Proposed Plan
                        </h3>
                        <p className="text-sm text-muted-foreground">Review your milestones before saving.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onCancelPreview} disabled={generating}>
                            <X size={14} className="mr-1" /> Cancel
                        </Button>
                        <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating}>
                            <RotateCw size={14} className={cn("mr-1", generating && "animate-spin")} />
                            {generating ? "Generating..." : "Remake"}
                        </Button>
                        <Button size="sm" onClick={onConfirm} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700">
                            <Check size={14} className="mr-1" /> Save Plan
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {previewPlan.map((slot, index) => (
                        <div key={index} className="flex gap-4 p-4 rounded-xl border bg-card/50 hover:border-primary/30 transition-all group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {index + 1}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{slot.dayTask}</span>
                                    <span className="text-[10px] uppercase tracking-wider bg-accent px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                                        <Calendar size={10} /> {slot.date}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {slot.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
