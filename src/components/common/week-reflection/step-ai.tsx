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
4. Keep it concise, high-impact, and professional.
5. Format your response strictly as 3 bullet points, each starting with a strong title. Example: "• Focus Issue: description..."

Return only the text of the review. Max 100 words.
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
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-3xl mx-auto px-4 md:px-0">
            {/* Header Section */}
            <div className="space-y-2 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm mb-1 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <BrainCircuit size={28} className="relative z-10 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    AI Coach Review
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    A brutal, honest breakdown of your week based on your behavior.
                </p>
            </div>

            {/* AI Response Card */}
            <Card className="w-full bg-card border border-border/40 shadow-xl backdrop-blur-3xl relative overflow-hidden group hover:border-primary/20 transition-all duration-500 min-h-[250px]">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-rose-500 to-amber-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                
                {/* Decorative background grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                <CardContent className="p-6 md:p-8 w-full relative flex flex-col justify-center min-h-[250px] z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-10 animate-in fade-in duration-500">
                            <div className="relative">
                                <Loader2 size={36} className="text-primary animate-spin" strokeWidth={3} />
                                <Sparkles size={16} className="text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-bold text-lg text-primary tracking-tight">Deconstructing performance...</p>
                                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Scanning for inconsistencies</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Warning Banner */}
                            <div className="flex gap-3 items-center bg-rose-500/10 p-3 rounded-xl text-rose-500 font-semibold border border-rose-500/20 shadow-sm transition-all group/alert">
                                <AlertOctagon size={18} className="shrink-0 transition-transform group-hover/alert:scale-110" />
                                <p className="text-xs md:text-sm">
                                    Ignore this feedback at your own risk. Your legacy depends on the actions you take next.
                                </p>
                            </div>

                            {/* Main Analysis Text */}
                            <div className="text-sm md:text-base leading-relaxed tracking-normal text-foreground/90 bg-accent/30 p-5 md:p-6 rounded-2xl border border-border/40 shadow-inner group/text transition-all hover:border-primary/20">
                                <div className="whitespace-pre-wrap leading-[1.8] font-medium text-foreground/80 space-y-2">
                                    {aiResponse}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center">
                <Button 
                    variant="outline" 
                    className="h-10 px-6 rounded-full font-semibold border-border bg-card/50 hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all duration-300" 
                    onClick={onPrev} 
                    disabled={loading}
                >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Revise Input
                </Button>
                
                <Button 
                    className="h-10 px-8 rounded-full shadow-md group bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all hover:scale-[1.02] active:scale-95" 
                    onClick={onNext} 
                    disabled={loading || !aiResponse}
                >
                    Manage Missed Tasks 
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
};

