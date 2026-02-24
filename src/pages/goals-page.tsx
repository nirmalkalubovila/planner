import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Edit2, Calendar, Target, BrainCircuit, Loader2, Sparkles, Check, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Goal, AIGeneratedPlanSlot, Milestone } from '@/types/global-types';
import { format, parseISO, addWeeks, addMonths, addYears } from 'date-fns';

const goalSchema = z.object({
    name: z.string().min(1, "Goal Name is required"),
    purpose: z.string().min(1, "Purpose is required"),
    startDate: z.string().min(1, "Start Date is required"),
    goalType: z.enum(['Week', 'Month', 'Year']),
    durationValue: z.number().min(1, "Duration must be at least 1"),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Definition, 2: Plan Gen
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [generating, setGenerating] = useState(false);
    const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

    const toggleGoal = (id: string) => {
        setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const { data: goals = [], isLoading } = useGetGoals();

    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            name: '',
            purpose: '',
            startDate: '',
            goalType: 'Week',
            durationValue: 1,
        },
    });

    const onSubmit = (values: GoalFormValues) => {
        const start = parseISO(values.startDate);
        let end = start;
        const generatedMilestones: Milestone[] = [];

        for (let i = 1; i <= values.durationValue; i++) {
            let milestoneDate = new Date(start);
            let title = "";
            if (values.goalType === 'Week') {
                milestoneDate = addWeeks(start, i);
                title = `End of Week ${i}`;
            } else if (values.goalType === 'Month') {
                milestoneDate = addMonths(start, i);
                title = `End of Month ${i}`;
            } else if (values.goalType === 'Year') {
                milestoneDate = addYears(start, i);
                title = `End of Year ${i}`;
            }
            end = milestoneDate;
            generatedMilestones.push({
                id: crypto.randomUUID(),
                title: title,
                targetDate: format(milestoneDate, 'yyyy-MM-dd'),
                completed: false
            });
        }

        const goalData: Goal = {
            ...values,
            endDate: format(end, 'yyyy-MM-dd'),
            milestones: generatedMilestones,
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
            goalType: goal.goalType || 'Week',
            durationValue: goal.durationValue || 1,
        });
        setStep(1);
        setIsFormOpen(true);
    };

    const handleGeneratePlan = async () => {
        if (!activeGoal || !user) return;
        setGenerating(true);

        try {
            const milestoneDatesStr = activeGoal.milestones
                ? activeGoal.milestones.map(m => `- ${m.title}: ${m.targetDate}`).join('\n')
                : `End Date: ${activeGoal.endDate}`;

            const prompt = `
Generate a detailed milestone action plan for achieving a goal.
Goal Name: ${activeGoal.name}
Goal Purpose: ${activeGoal.purpose}
Goal Start Date: ${activeGoal.startDate}
Target Milestone Dates:
${milestoneDatesStr}

Based on this, break down the main goal into weighted sub-tasks/sub-goals that need to be accomplished by the end of each milestone period.
Return an action plan as a JSON array of objects.

CRITICAL INSTRUCTION: DO NOT generate tiny, daily tasks. Instead, generate exactly ONE major SUB-GOAL or SUB-TASK to be accomplished by EACH "Target Milestone Date" listed above. If there are 3 Milestone Dates, you should only return an array with exactly 3 objects. This single sub-goal per milestone should represent the main objective for that entire period.
The "date" field in your JSON must exactly match the YYYY-MM-DD target dates provided in the milestone list.

Each object must have exactly these keys:
{
  "date": "YYYY-MM-DD",
  "dayTask": "string - short title of the major sub-goal/task",
  "description": "string - 1 to 2 sentences detailing what needs to be achieved during this period to hit this sub-goal."
}
\nRETURN ONLY PARSABLE JSON ARRAY FORMAT NO MARKDOWN TAGS.
`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const requestBody = {
                model: "arcee-ai/trinity-large-preview:free",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            };

            let response;
            try {
                // Call OpenRouter API
                response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Legacy Life Builder Planner'
                    },
                    body: JSON.stringify(requestBody)
                });
            } catch (networkErr: any) {
                console.warn("Network error with OpenRouter. Error:", networkErr);
                throw new Error("Network blocked. Please disable Brave Shields/Adblockers or check your connection.");
            }

            const rawResult = await response.json();

            if (!response.ok || rawResult.error) {
                throw new Error(rawResult.error?.message || `OpenRouter API Error: ${response.statusText}`);
            }

            if (!rawResult.choices || rawResult.choices.length === 0) {
                console.error("Full OpenRouter Response:", rawResult);
                throw new Error("No response generated. Please try again.");
            }

            const contentMessage = rawResult.choices[0]?.message;
            if (!contentMessage || !contentMessage.content) {
                console.error("Invalid content payload:", rawResult);
                throw new Error("Response structure was invalid.");
            }

            const textResponse = contentMessage.content;

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
                alert('Generation Failed: Your browser (like Brave Shields or AdBlocker) is blocking the AI connection. Please turn it off for localhost and try again. AI requires 10-15 seconds to generate.');
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
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Starting Date</label>
                                        <Input type="date" {...form.register('startDate')} className="bg-background" />
                                        {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
                                    </div>
                                    <div className="space-y-2 md:col-span-1">
                                        <label className="text-sm font-medium">Goal Type</label>
                                        <select {...form.register('goalType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="Week">Week Goal (1-3 weeks)</option>
                                            <option value="Month">Month Goal (1-11 months)</option>
                                            <option value="Year">Year Goal (1-10 years)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-1">
                                        <label className="text-sm font-medium">Duration ({form.watch('goalType')}s)</label>
                                        <Input
                                            type="number"
                                            {...form.register('durationValue', { valueAsNumber: true })}
                                            min="1"
                                            max={form.watch('goalType') === 'Week' ? 3 : form.watch('goalType') === 'Month' ? 11 : 10}
                                            className="bg-background"
                                        />
                                        {form.formState.errors.durationValue && <p className="text-xs text-destructive">{form.formState.errors.durationValue.message}</p>}
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
                                    <div className="flex gap-2 self-end sm:self-center items-center">
                                        <Button variant="ghost" size="sm" onClick={() => toggleGoal(goal.id!)}>
                                            {expandedGoals[goal.id!] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleEdit(goal)}>
                                            <Edit2 size={14} className="mr-1" /> Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteGoal.mutate(goal.id!)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                {expandedGoals[goal.id!] && (
                                    <CardContent className="p-0 border-t border-border/50">
                                        {(goal.milestones && goal.milestones.length > 0) && (
                                            <div className="bg-background/50 p-4 border-b border-border/50">
                                                <h4 className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest mb-3">Key Milestones</h4>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {goal.milestones.map((m) => (
                                                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 shadow-sm">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${m.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`} />
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{m.targetDate && !isNaN(parseISO(m.targetDate).getTime()) ? format(parseISO(m.targetDate), 'MMM d, yyyy') : m.targetDate}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {hasPlan ? (
                                            <div className="bg-background pt-2 p-0 md:p-4 rounded-b-xl">
                                                <div className="px-4 md:px-1 py-3 border-b md:border-none flex items-center justify-between">
                                                    <h4 className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest">Master Action Plan</h4>
                                                    <span className="text-[10px] font-bold py-1 px-2 rounded-md bg-accent text-accent-foreground">{goal.plans?.length || 0} Slots</span>
                                                </div>

                                                <div className="md:mt-1 md:border border-border/50 md:rounded-lg overflow-hidden bg-card/50">
                                                    {/* Desktop Header */}
                                                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-accent/30 border-b border-border/50 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                                        <div className="col-span-3">Target Date</div>
                                                        <div className="col-span-3 border-l pl-2 border-border/50">Core Task</div>
                                                        <div className="col-span-6 border-l pl-2 border-border/50">Description</div>
                                                    </div>

                                                    {/* Rows */}
                                                    <div className="flex flex-col mb-4 md:mb-0 divide-y divide-border/50">
                                                        {goal.plans!.slice().sort((a, b) => a.date.localeCompare(b.date)).map((slot, idx) => {
                                                            const validDate = slot.date && !isNaN(parseISO(slot.date).getTime()) ? format(parseISO(slot.date), 'MMM d, yyyy') : slot.date;
                                                            const milestone = goal.milestones?.find(m => m.targetDate === slot.date);

                                                            return (
                                                                <div key={idx} className="group grid grid-cols-1 md:grid-cols-12 gap-y-2 md:gap-4 px-4 py-4 md:py-3 hover:bg-accent/40 transition-colors items-start relative">
                                                                    {/* Desktop Col 1 */}
                                                                    <div className="md:col-span-3 flex flex-col items-start justify-center">
                                                                        {milestone && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{milestone.title}</span>}
                                                                        <div className="text-xs font-semibold text-primary">{validDate}</div>
                                                                    </div>

                                                                    {/* Task */}
                                                                    <div className="md:col-span-3 md:border-l md:border-border/50 md:pl-2 flex items-center">
                                                                        <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">{slot.dayTask}</span>
                                                                    </div>

                                                                    {/* Description */}
                                                                    <div className="md:col-span-6 md:border-l md:border-border/50 md:pl-2 flex items-start md:items-center mt-1 md:mt-0">
                                                                        <span className="text-xs text-muted-foreground/80 leading-relaxed md:leading-snug">{slot.description}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center text-sm text-muted-foreground bg-accent/5">
                                                No plan generated yet. Edit the goal to run the AI planner.
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

