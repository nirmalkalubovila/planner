import React from 'react';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIGenerationStepProps {
    goalName: string;
    onGenerate: () => void;
    onSkip: () => void;
    generating: boolean;
}

export const AIGenerationStep: React.FC<AIGenerationStepProps> = ({
    goalName,
    onGenerate,
    onSkip,
    generating
}) => {
    return (
        <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <BrainCircuit size={32} />
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2">Goal Saved Successfully!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Your goal <span className="font-semibold text-foreground">"{goalName}"</span> has been configured.
                    Now, let Gemini 2.5 Flash analyze your schedule, habits, and preferences to build a custom action plan.
                </p>
            </div>

            <div className="pt-6 border-t flex gap-4 justify-center">
                <Button variant="outline" onClick={onSkip} disabled={generating}>Skip for Now</Button>
                <Button
                    onClick={onGenerate}
                    disabled={generating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                >
                    {generating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Plan...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Make My Plan For The Goal</>
                    )}
                </Button>
            </div>
        </div>
    );
};
