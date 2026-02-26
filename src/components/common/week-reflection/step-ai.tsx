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
        <div className="flex flex-col items-center justify-center space-y-10 w-full max-w-4xl mx-auto px-4 md:px-0">
            {/* Header Section */}
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex p-5 rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_25px_rgba(var(--primary),0.1)] mb-2 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <BrainCircuit size={48} className="relative z-10 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase italic underline-offset-8 decoration-primary/30">
                    AI <span className="text-primary italic">Coach</span> Review
                </h2>
                <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto font-medium tracking-wide border-t border-border/40 pt-2">
                    A brutal, honest breakdown of your week based on your behavior.
                </p>
            </div>

            {/* AI Response Card */}
            <Card className="w-full bg-card border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl relative overflow-hidden group hover:border-primary/20 transition-all duration-500 min-h-[400px]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-rose-500 to-amber-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                
                {/* Decorative background grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                <CardContent className="p-8 md:p-12 w-full relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center space-y-6 py-20 animate-in fade-in duration-500">
                            <div className="relative">
                                <Loader2 size={56} className="text-primary animate-spin" strokeWidth={3} />
                                <Sparkles size={24} className="text-amber-500 absolute -top-2 -right-2 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="font-black text-2xl text-primary tracking-tighter uppercase italic">Deconstructing your performance</p>
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-bold">Scanning for inconsistencies...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Warning Banner */}
                            <div className="flex gap-4 items-center bg-rose-500/5 p-5 rounded-2xl text-rose-500 font-bold border border-rose-500/10 shadow-sm transition-all hover:bg-rose-500/10 hover:border-rose-500/20 group/alert">
                                <AlertOctagon size={24} className="shrink-0 transition-transform group-hover/alert:rotate-12" />
                                <p className="text-xs md:text-sm uppercase tracking-wider leading-tight">
                                    Ignore this feedback at your own risk. Your legacy depends on the actions you take next.
                                </p>
                            </div>

                            {/* Main Analysis Text */}
                            <div className="text-lg md:text-xl leading-[1.8] font-bold tracking-tight text-foreground/90 bg-accent/20 p-8 md:p-10 rounded-[2rem] border border-border/40 shadow-inner group/text transition-all hover:border-primary/10">
                                <div className="first-letter:text-6xl first-letter:font-black first-letter:text-primary first-letter:float-left first-letter:mr-4 first-letter:mt-1 first-letter:drop-shadow-[0_0_10px_rgba(var(--primary),0.3)] whitespace-pre-wrap leading-relaxed tracking-tight">
                                    {aiResponse}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 w-full justify-center">
                <Button 
                    variant="ghost" 
                    size="lg" 
                    className="h-14 px-10 rounded-2xl border-border bg-card/50 hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all duration-300 font-bold uppercase tracking-widest text-[11px]" 
                    onClick={onPrev} 
                    disabled={loading}
                >
                    <ArrowLeft className="mr-3 w-4 h-4" /> Revise Input
                </Button>
                
                <Button 
                    size="lg" 
                    className="h-14 px-12 rounded-2xl shadow-[0_10px_20px_rgba(var(--primary),0.3)] group bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95" 
                    onClick={onNext} 
                    disabled={loading || !aiResponse}
                >
                    Manage Missed Tasks 
                    <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Button>
            </div>
        </div>
    );
};

