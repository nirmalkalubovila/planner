import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Edit2, Calendar, Target, BrainCircuit, Loader2, Sparkles, Check, ChevronRight } from 'lucide-react';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Goal, AIGeneratedPlanSlot } from '@/types/global-types';
import { differenceInDays, format, parseISO } from 'date-fns';

const goalSchema = z.object({
    name: z.string().min(1, "Goal Name is required"),
    purpose: z.string().min(1, "Purpose is required"),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().min(1, "End Date is required"),
    goalType: z.enum(['Week', 'Month', 'Year']),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Definition, 2: Plan Gen
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [generating, setGenerating] = useState(false);

    const { data: goals = [], isLoading } = useGetGoals();
    const { data: habits = [] } = useGetHabits();

    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            name: '',
            purpose: '',
            startDate: '',
            endDate: '',
            goalType: 'Week',
        },
    });

    const onSubmit = (values: GoalFormValues) => {
        const goalData: Goal = {
            ...values,
            plans: []
        };

        if (activeGoal && activeGoal.id) {
            updateGoal.mutate({ ...goalData, id: activeGoal.id }, {
                onSuccess: (data) => {
                    setActiveGoal(data);
                    setStep(2);
                }
            });
        } else {
            createGoal.mutate(goalData, {
                onSuccess: (data) => {
                    setActiveGoal(data);
                    setStep(2);
                }
            });
        }
    };

    const handleEdit = (goal: Goal) => {
        setActiveGoal(goal);
        form.reset({
            name: goal.name || '',
            purpose: goal.purpose || '',
            startDate: goal.startDate || '',
            endDate: goal.endDate || '',
            goalType: goal.goalType || 'Week',
        });
        setStep(1);
        setIsFormOpen(true);
    };

    const handleGeneratePlan = async () => {
        if (!activeGoal || !user) return;
        setGenerating(true);

        try {
            const numDays = differenceInDays(parseISO(activeGoal.endDate), parseISO(activeGoal.startDate)) + 1;
            const meta = user.user_metadata || {};

            const prompt = `
Generate a detailed daily plan for achieving a goal.
Goal Name: ${activeGoal.name}
Goal Purpose: ${activeGoal.purpose}
Goal Start Date: ${activeGoal.startDate}
Goal End Date: ${activeGoal.endDate}
Number of Days: ${numDays}

User Constraints:
- Minimum task time: ${meta.minTaskTime || 30} minutes
- Maximum task time: ${meta.maxTaskTime || 2} hours
- Sleep Schedule: ${meta.sleepStart || '22:00'} (Duration: ${meta.sleepDuration || 8} hours)
- Expected Free Time needed per day: ${meta.freeTime || 2} hours
- Focus Ability: ${meta.focusAbility || 'normal'}
- Task Shifting Ability: ${meta.taskShiftingAbility || 'normal'}

Existing User Habits (DO NOT overlap with these times):
${habits.map(h => `- ${h.name} from ${h.startTime} to ${h.endTime}`).join('\n')}

Based on this, return a daily schedule as a JSON array of objects.
For each day between Start Date and End Date, generate a MAXIMUM of 3 to 4 task slots per day. Keep descriptions extremely concise (1 short sentence max). DO NOT generate dozens of small tasks.
Each object must have exactly these keys:
{
  "date": "YYYY-MM-DD",
  "fromTime": "HH:mm",
  "toTime": "HH:mm",
  "dayTask": "string - short title of task",
  "description": "string"
}
`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAvlwFdalm7HUhrYtu_ivf4OJBwQ_BLigA';
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        description: "List of daily task slots",
                        items: {
                            type: "OBJECT",
                            properties: {
                                date: { type: "STRING", description: "Format: YYYY-MM-DD" },
                                fromTime: { type: "STRING", description: "Format: HH:mm (24 hour)" },
                                toTime: { type: "STRING", description: "Format: HH:mm (24 hour)" },
                                dayTask: { type: "STRING", description: "Very short title" },
                                description: { type: "STRING", description: "1 sentence description" }
                            },
                            required: ["date", "fromTime", "toTime", "dayTask", "description"]
                        }
                    }
                }
            };

            let response;
            try {
                // Try gemini-2.5-flash first
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
            } catch (networkErr: any) {
                console.warn("Network error on 2.5-flash. This might be blocked by Brave Shields or AdBlock. Error:", networkErr);
                throw new Error("Network blocked. Please disable Brave Shields/Adblockers or check your connection.");
            }

            // Fallback for CORS or model-not-found issues that return 404/403
            if (!response.ok) {
                console.warn("Primary model failed, trying fallback to 1.5-flash...");
                try {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });
                } catch (fallbackErr) {
                    throw new Error("Network blocked (Fallback). Please disable Brave Shields/Adblockers.");
                }
            }

            const rawResult = await response.json();

            if (!response.ok || rawResult.error) {
                throw new Error(rawResult.error?.message || `API Error: ${response.statusText}`);
            }

            if (!rawResult.candidates || rawResult.candidates.length === 0) {
                console.error("Full Gemini Response:", rawResult);
                throw new Error("No response generated. Safety filters might have blocked it.");
            }

            const content = rawResult.candidates[0]?.content;
            if (!content || !content.parts || content.parts.length === 0) {
                console.error("Invalid content payload:", rawResult);
                throw new Error("Response structure was invalid.");
            }

            const textResponse = content.parts[0].text;

            // Cleanup markdown if it accidentally added it
            let cleanJson = textResponse.replace(/^```json\n?/gm, '').replace(/```$/gm, '').trim();
            // Sometimes it has markdown without the "json" tag
            cleanJson = cleanJson.replace(/^```\n?/gm, '').replace(/```$/gm, '').trim();

            let planSlots: AIGeneratedPlanSlot[];
            try {
                planSlots = JSON.parse(cleanJson);
            } catch (err: any) {
                console.error("Failed to parse JSON:", cleanJson);
                throw new Error("AI returned invalid JSON: " + err.message);
            }

            // Save the plan to the active goal
            activeGoal.plans = planSlots;
            updateGoal.mutate(activeGoal, {
                onSuccess: () => {
                    setGenerating(false);
                    setIsFormOpen(false);
                    setStep(1);
                    setActiveGoal(null);
                    form.reset();
                },
                onError: (err: any) => {
                    alert('Error saving plan to database: ' + err.message);
                    setGenerating(false);
                }
            });

        } catch (error: any) {
            console.error('Failed to generate plan', error);
            // Distinguish the network error easily for the user
            if (error.message.includes("Network blocked") || error.message.includes("Failed to fetch")) {
                alert('🔥 Generation Failed: Your browser (like Brave Shields or AdBlocker) is blocking the AI connection. Please turn it off for localhost and try again. AI requires 10-15 seconds to generate.');
            } else {
                alert('Generation Failed: ' + (error.message || 'Unknown error'));
            }
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Goal Tracker</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Define your goals and let AI plan your journey.</p>
                </div>
                <Button onClick={() => { setIsFormOpen(!isFormOpen); setStep(1); setActiveGoal(null); form.reset(); }} variant={isFormOpen ? "outline" : "default"} className="w-full sm:w-auto">
                    {isFormOpen ? "Cancel" : "Define New Goal"}
                </Button>
            </div>

            {isFormOpen && (
                <Card className="border-primary/20 bg-accent/5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {activeGoal && activeGoal.id ? <Edit2 size={18} /> : <Target size={18} />}
                            {activeGoal && activeGoal.id ? "Edit Goal" : "New Goal Setup"}
                        </CardTitle>
                        <CardDescription>Step {step} of 2: {step === 1 ? "Goal Definition" : "AI Plan Generation"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? (
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Goal Name</label>
                                        <Input {...form.register('name')} placeholder="e.g., Master React in 2 weeks" className="bg-background" />
                                        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Goal Purpose (Why?)</label>
                                        <Input {...form.register('purpose')} placeholder="e.g., To build better frontend applications faster" className="bg-background" />
                                        {form.formState.errors.purpose && <p className="text-xs text-destructive">{form.formState.errors.purpose.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Starting Date</label>
                                        <Input type="date" {...form.register('startDate')} className="bg-background" />
                                        {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">End Date</label>
                                        <Input type="date" {...form.register('endDate')} className="bg-background" />
                                        {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Goal Type</label>
                                        <select {...form.register('goalType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="Week">Week Goal (1-3 weeks)</option>
                                            <option value="Month">Month Goal (1-11 months)</option>
                                            <option value="Year">Year Goal (1-10 years)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="w-full sm:w-auto">
                                        Save & Continue <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center py-8">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                    <BrainCircuit size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Goal Saved Successfully!</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Your goal <span className="font-semibold text-foreground">"{activeGoal?.name}"</span> has been configured.
                                        Now, let Gemini 2.5 Flash analyze your schedule, habits, and preferences to build a custom action plan.
                                    </p>
                                </div>

                                <div className="pt-6 border-t flex gap-4 justify-center">
                                    <Button variant="outline" onClick={() => { setIsFormOpen(false); setStep(1); }}>Skip for Now</Button>
                                    <Button
                                        onClick={handleGeneratePlan}
                                        disabled={generating || activeGoal?.goalType !== 'Week'}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                                    >
                                        {generating ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Plan...</>
                                        ) : activeGoal?.goalType === 'Week' ? (
                                            <><Sparkles className="mr-2 h-4 w-4" /> Make My Plan For The Goal</>
                                        ) : (
                                            "Plan Gen Only For Week Goals Currently"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                <h3 className="text-xl font-semibold">Active Goals & Plans</h3>
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                        No active goals found. Start planning!
                    </div>
                ) : (
                    goals.map((goal: Goal) => {
                        const hasPlan = goal.plans && goal.plans.length > 0;
                        return (
                            <Card key={goal.id} className="overflow-hidden border-border/60 hover:border-primary/40 transition-all group">
                                <div className="bg-accent/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b gap-4">
                                    <div className="flex items-start sm:items-center gap-4">
                                        <div className="bg-primary/10 text-primary p-3 rounded-xl">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{goal.goalType} Goal</span>
                                                {hasPlan && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 font-medium flex items-center"><Check size={10} className="mr-1" /> Plan Ready</span>}
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">{goal.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{goal.purpose}</p>
                                            <div className="text-xs text-muted-foreground/80 mt-2 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {goal.startDate && !isNaN(new Date(goal.startDate).getTime()) ? format(new Date(goal.startDate), 'MMM d, yyyy') : 'Invalid Start'}
                                                {' '} - {' '}
                                                {goal.endDate && !isNaN(new Date(goal.endDate).getTime()) ? format(new Date(goal.endDate), 'MMM d, yyyy') : 'Invalid End'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <Button variant="secondary" size="sm" onClick={() => handleEdit(goal)}>
                                            <Edit2 size={14} className="mr-1" /> Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteGoal.mutate(goal.id!)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-0">
                                    {hasPlan ? (
                                        <div className="bg-accent/10 p-4">
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 px-1">AI Generated Schedule</h4>
                                            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                                                {goal.plans!.slice().sort((a, b) => a.date.localeCompare(b.date) || a.fromTime.localeCompare(b.fromTime)).map((slot, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="min-w-[200px] flex-shrink-0 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors shadow-sm"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="text-[10px] uppercase font-bold text-primary">
                                                                {slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'EEE, MMM d') : slot.date}
                                                            </div>
                                                            <div className="text-[10px] font-mono bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{slot.fromTime} - {slot.toTime}</div>
                                                        </div>
                                                        <div className="font-semibold text-sm line-clamp-1">{slot.dayTask}</div>
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 opacity-80">{slot.description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-sm text-muted-foreground bg-accent/5">
                                            No plan generated yet. Edit the goal to run the AI planner.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

