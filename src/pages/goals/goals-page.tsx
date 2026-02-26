import React, { useState, useMemo } from 'react';
import { Target, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Goal, AIGeneratedPlanSlot, Milestone } from '@/types/global-types';
import { format, parseISO, addWeeks, addMonths, addYears } from 'date-fns';
import { GoalCard } from './components/goal-card';
import { GoalDefinitionForm, GoalFormValues } from './forms/goal-definition-form';
import { AIGenerationStep } from './forms/ai-generation-step';
import { WeekUtils } from '@/utils/week-utils';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetWeekCompletedTasks } from '@/api/services/today-service';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

export const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Definition, 2: Plan Gen
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [generating, setGenerating] = useState(false);
    const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

    // Confirmation Dialog State
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingValues, setPendingValues] = useState<GoalFormValues | null>(null);

    // Goal Deletion Confirmation state
    const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: goals = [], isLoading } = useGetGoals();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    // Fetch data for accurate progress calculations
    const currentWeek = WeekUtils.getCurrentWeek();
    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const currentWeekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => `${currentWeek}-${i + 1}`), [currentWeek]);
    const { data: completedDays } = useGetWeekCompletedTasks(currentWeekDays);

    const toggleGoal = (id: string) => {
        setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEdit = (goal: Goal) => {
        setActiveGoal(goal);
        setStep(1);
        setIsFormOpen(true);
    };

    const onDefinitionSubmit = (values: GoalFormValues) => {
        // If we are editing, warn the user
        if (activeGoal && activeGoal.id) {
            setPendingValues(values);
            setShowConfirm(true);
        } else {
            executeDefinitionSubmit(values);
        }
    };

    const executeDefinitionSubmit = (values: GoalFormValues) => {
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
            plans: activeGoal?.plans || []
        };

        if (activeGoal && activeGoal.id) {
            updateGoal.mutate({ ...goalData, id: activeGoal.id }, {
                onSuccess: (data) => { setActiveGoal(data); setStep(2); }
            });
        } else {
            createGoal.mutate(goalData, {
                onSuccess: (data) => { setActiveGoal(data); setStep(2); }
            });
        }
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
            const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Legacy Life Builder Planner'
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

            const textResponse = rawResult.choices[0].message.content;
            let cleanJson = textResponse.replace(/^```json\n?/gm, '').replace(/```$/gm, '').trim();
            cleanJson = cleanJson.replace(/^```\n?/gm, '').replace(/```$/gm, '').trim();

            const planSlots: AIGeneratedPlanSlot[] = JSON.parse(cleanJson);
            activeGoal.plans = planSlots;

            updateGoal.mutate(activeGoal, {
                onSuccess: () => {
                    setGenerating(false);
                    setIsFormOpen(false);
                    setStep(1);
                    setActiveGoal(null);
                },
                onError: (err: any) => { toast.error('DB Error: ' + err.message); setGenerating(false); }
            });

        } catch (error: any) {
            toast.error('Generation Failed: ' + (error.message || 'Unknown error'));
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
                <Button onClick={() => { setIsFormOpen(!isFormOpen); setStep(1); setActiveGoal(null); }} variant={isFormOpen ? "outline" : "default"} className="w-full sm:w-auto">
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
                            <GoalDefinitionForm
                                initialValues={activeGoal || {}}
                                onSubmit={onDefinitionSubmit}
                            />
                        ) : (
                            <AIGenerationStep
                                goalName={activeGoal?.name || ""}
                                onGenerate={handleGeneratePlan}
                                onSkip={() => { setIsFormOpen(false); setStep(1); }}
                                generating={generating}
                            />
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
                    goals.map((goal: Goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            isExpanded={!!expandedGoals[goal.id!]}
                            onToggle={toggleGoal}
                            onEdit={handleEdit}
                            onDelete={(id) => { setGoalIdToDelete(id); setShowDeleteConfirm(true); }}
                            weekPlan={weekPlan || {}}
                            completedDays={completedDays || {}}
                            currentWeek={currentWeek}
                        />
                    ))
                )}
            </div>

            <ConfirmationDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => pendingValues && executeDefinitionSubmit(pendingValues)}
                title="Update Goal Definition?"
                description="Changing your goal's definition or duration will automatically reset your current AI action plan. You will need to regenerate the plan to match your new milestones."
                confirmText="Save & Continue"
                cancelText="Go Back"
            />
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    if (goalIdToDelete) {
                        deleteGoal.mutate(goalIdToDelete);
                        setGoalIdToDelete(null);
                        setShowDeleteConfirm(false);
                    }
                }}
                title="Delete Goal?"
                description="Deleting this goal will also permanently remove all its associated plans and milestones. This action cannot be undone."
                confirmText="Delete Goal"
                variant="destructive"
            />
        </div>
    );
};

export default GoalsPage;
