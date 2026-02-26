import React from 'react';
import { useReflectionStore } from './reflection-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const StepInput: React.FC<{ onNext: () => void, onPrev: () => void }> = ({ onNext, onPrev }) => {
    const { goodThings, badThings, setGoodThings, setBadThings } = useReflectionStore();

    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-4xl mx-auto">
            <div className="space-y-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How did it really go?</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Be honest. Your AI coach needs the truth to fix your mistakes and accelerate your growth.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 w-full">
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-emerald-500 font-semibold mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-full">
                                <ThumbsUp size={20} />
                            </div>
                            <h3>What went well?</h3>
                        </div>
                        <Textarea
                            placeholder="I sticked to my morning routine and launched the new feature..."
                            className="min-h-[160px] resize-none bg-background/50 border-emerald-500/30 focus-visible:ring-emerald-500"
                            value={goodThings}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoodThings(e.target.value)}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-rose-500/5 border-rose-500/20">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-rose-500 font-semibold mb-2">
                            <div className="p-2 bg-rose-500/10 rounded-full">
                                <ThumbsDown size={20} />
                            </div>
                            <h3>What went wrong?</h3>
                        </div>
                        <Textarea
                            placeholder="I procrastinated on Tuesday and ignored my daily workout..."
                            className="min-h-[160px] resize-none bg-background/50 border-rose-500/30 focus-visible:ring-rose-500"
                            value={badThings}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBadThings(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4 pt-8 w-full justify-center">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full" onClick={onPrev}>
                    <ArrowLeft className="mr-2" /> Back
                </Button>
                <Button size="lg" className="h-14 px-8 rounded-full shadow-lg group" onClick={onNext} disabled={!goodThings && !badThings}>
                    Analyze My Week <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};
