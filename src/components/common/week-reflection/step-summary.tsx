import React from 'react';
import { useReflectionStore } from './reflection-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Activity, Target, Zap } from 'lucide-react';

export const StepSummary: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const { summaryData } = useReflectionStore();

    return (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto text-center">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Your Weekly Summary</h1>
                <p className="text-lg text-muted-foreground w-full max-w-xl mx-auto">
                    Before planning the next week, let's look at how you performed this week.
                </p>
            </div>

            <div className="grid gap-6 w-full md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20 backdrop-blur-sm shadow-xl transition-all hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 bg-primary/20 rounded-full text-primary">
                            <Activity size={24} />
                        </div>
                        <h3 className="font-semibold text-lg">Task Completion</h3>
                        <p className="text-3xl font-bold">{summaryData.taskCompletionRate}%</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/20 backdrop-blur-sm shadow-xl transition-all hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-500">
                            <Target size={24} />
                        </div>
                        <h3 className="font-semibold text-lg">Goals Progress</h3>
                        <p className="text-sm text-balance text-muted-foreground">{summaryData.goalSummary || "Consistent daily progress towards core focus."}</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-500/5 border-emerald-500/20 backdrop-blur-sm shadow-xl transition-all hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-500">
                            <Zap size={24} />
                        </div>
                        <h3 className="font-semibold text-lg">Habit Streak</h3>
                        <p className="text-sm text-balance text-muted-foreground">{summaryData.habitSummary || "Morning routine locked in, solid execution."}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-8">
                <Button size="lg" className="px-8 rounded-full text-lg h-14 group shadow-lg" onClick={onNext}>
                    Continue Reflection <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};
