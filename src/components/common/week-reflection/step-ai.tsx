import React, { useEffect, useState } from 'react';
import { useReflectionStore } from './reflection-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BrainCircuit, Sparkles, AlertOctagon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';

export const StepAI: React.FC<{ onNext: () => void, onPrev: () => void }> = ({ onNext, onPrev }) => {
    const { goodThings, badThings, summaryData, aiResponse, setAiResponse } = useReflectionStore();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!aiResponse && !loading) {
            generateAIReview();
        }
    }, []);

    const generateAIReview = async () => {
        setLoading(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("API Key missing");
            }

            const prompt = `
Generate a brutal, honest, and psychologically deep review of the user's past week.
User Identity:
- Profession: ${user?.user_metadata?.currentProfession || 'Not set'}
- Primary Life Focus: ${user?.user_metadata?.primaryLifeFocus || 'Not set'}
- Peak Energy: ${user?.user_metadata?.energyPeakTime || 'Not set'}
- Focus Ability: ${user?.user_metadata?.focusAbility || 'normal'}
- Task Shifting: ${user?.user_metadata?.taskShiftingAbility || 'normal'}

Reflection Input:
- Good things this week: "${goodThings || 'None mentioned'}"
- Bad things this week: "${badThings || 'None mentioned'}"

Weekly Data:
- Task Completion Rate: ${summaryData.taskCompletionRate}%
- Goal Progress Status: ${summaryData.goalSummary || 'No data'}
- Habit Performance: ${summaryData.habitSummary || 'No data'}

System Context:
- Current Date: ${format(new Date(), 'MMMM d, yyyy')}

Your Goal: 
1. Provide a "Reality Check" on their performance. 
2. Challenge their excuses in "Bad things".
3. Acknowledge wins but push for more.
4. Keep it concise, high-impact, and slightly aggressive (Coach/Mentor style).
5. Use "Legacy" and "Purpose" as motivating themes.

Return only the text of the review. Max 150 words.
`;

            const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Legacy Life Builder AI Coach'
                },
                body: JSON.stringify({
                    model: "arcee-ai/trinity-large-preview:free",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            const rawResult = await response.json();
            if (!response.ok || !rawResult.choices?.[0]?.message?.content) {
                throw new Error(rawResult.error?.message || "AI response error");
            }

            const reviewText = rawResult.choices[0].message.content.trim();
            setAiResponse(reviewText);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to generate AI Coach feedback. Try again later.");
            // Fallback mock if API fails
            setAiResponse(`You hit ${summaryData.taskCompletionRate}% this week. You noted: "${badThings}". Stop making excuses and get back to work.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto">
            <div className="space-y-4 text-center">
                <div className="inline-block p-4 bg-primary/20 rounded-full text-primary mb-2 shadow-inner">
                    <BrainCircuit size={40} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">AI Coach Review</h2>
                <p className="text-muted-foreground w-full">
                    A brutal, honest breakdown of your week based on your behavior.
                </p>
            </div>

            <Card className="w-full bg-card/40 border-primary/30 shadow-2xl backdrop-blur-md relative overflow-hidden min-h-[300px] flex items-center justify-center">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-rose-500" />
                <CardContent className="p-8 w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-12">
                            <Loader2 size={42} className="text-primary animate-spin" />
                            <p className="font-bold text-xl text-primary animate-pulse tracking-tight">Deconstructing your performance...</p>
                            <div className="flex gap-2">
                                <Sparkles className="text-rose-500 animate-bounce" size={16} />
                                <Sparkles className="text-primary animate-bounce delay-75" size={16} />
                                <Sparkles className="text-amber-500 animate-bounce delay-150" size={16} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex gap-4 items-start bg-rose-500/10 p-4 rounded-xl text-rose-500 font-medium border border-rose-500/20">
                                <AlertOctagon className="shrink-0 mt-0.5" />
                                <p className="leading-relaxed text-sm">Ignore this feedback at your own risk. Your legacy depends on the actions you take next.</p>
                            </div>
                            <div className="text-lg leading-relaxed space-y-4 font-serif italic whitespace-pre-wrap text-foreground/90 first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-1">
                                {aiResponse}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-4 pt-8 w-full justify-center">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-2" onClick={onPrev} disabled={loading}>
                    <ArrowLeft className="mr-2" /> Revise Input
                </Button>
                <Button size="lg" className="h-14 px-8 rounded-full shadow-lg group bg-primary hover:bg-primary/90" onClick={onNext} disabled={loading || !aiResponse}>
                    Manage Missed Tasks <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};

