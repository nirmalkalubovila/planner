import React, { useState, useMemo } from 'react';
import { Target, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Goal, Milestone } from '@/types/global-types';
import { format, parseISO, addWeeks, addMonths, addYears } from 'date-fns';
import { GoalCard } from './components/goal-card';
import { GoalDefinitionForm, GoalFormValues } from './forms/goal-definition-form';
import { AIGenerationStep } from './forms/ai-generation-step';
import { WeekUtils } from '@/utils/week-utils';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetWeekCompletedTasks } from '@/api/services/today-service';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { MilestoneStrategyDialog } from './components/strategy-choice-dialog';
import { ManualPlanStep } from './forms/manual-plan-step';
import { AILoadingPopup } from '@/components/common/ai-loading-popup';
import { useAiPlanGeneration } from './hooks/use-ai-plan-generation';

export const GoalsPage: React.FC = () => {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
    const [showStrategyDialog, setShowStrategyDialog] = useState(false);
    const [strategyPendingData, setStrategyPendingData] = useState<Goal | null>(null);

    const { generating, tempPlan, generatePlan, clearTempPlan } = useAiPlanGeneration(user);

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
        setIsNewRecord(false);
        setStep(1);
        clearTempPlan();
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

        if (activeGoal?.id) {
            goalData.id = activeGoal.id;
        }

        setStrategyPendingData(goalData);
        setShowStrategyDialog(true);
    };

    const handleStrategySelect = (type: 'ai' | 'manual') => {
        if (!strategyPendingData) return;
        setShowStrategyDialog(false);

        const mutation = activeGoal?.id ? updateGoal : createGoal;

        mutation.mutate(strategyPendingData, {
            onSuccess: (data: Goal) => {
                setActiveGoal(data);
                if (type === 'ai') {
                    setStep(2);
                    generatePlan(data);
                } else {
                    setStep(3);
                }
            },
        });
    };

    const handleGeneratePlan = async (targetGoal?: Goal) => {
        const goalToUse = targetGoal || activeGoal;
        if (!goalToUse) return;
        await generatePlan(goalToUse);
    };

    const handleConfirmPlan = () => {
        if (!activeGoal || !tempPlan) return;

        updateGoal.mutate({ ...activeGoal, plans: tempPlan }, {
            onSuccess: () => {
                setIsFormOpen(false);
                setStep(1);
                setActiveGoal(null);
                clearTempPlan();
                toast.success('Action plan saved!');
            },
            onError: (err: any) => { toast.error('DB Error: ' + err.message); }
        });
    };

    const handleCancelPreview = () => {
        clearTempPlan();
        setStep(1);
    };

    return (
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4">

            {/* Minimalist Header */}
            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 leading-none">Goal Matrix</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{goals.length} STRATEGIC OBJECTIVES</span>
                    </div>
                </div>
                <Button
                    onClick={() => { setIsFormOpen(!isFormOpen); setStep(1); setActiveGoal(null); setIsNewRecord(true); clearTempPlan(); }}
                    variant={isFormOpen && isNewRecord ? "outline" : "default"}
                    className="gap-2 h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300 shadow-lg active:scale-95"
                >
                    {isFormOpen && isNewRecord ? "Cancel Operation" : "Define New Goal"}
                </Button>
            </div>

            {isFormOpen && isNewRecord && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-blue-500/40 opacity-50"></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-3">
                                <Target size={20} className="text-primary/60" />
                                {step === 1 && "Goal Architecture"}
                                {step === 2 && "Neural Plan Generation"}
                                {step === 3 && "Manual Operations Setup"}
                            </CardTitle>
                            <CardDescription className="text-white/40">
                                {step === 1 && "Define the core parameters of your strategic legacy."}
                                {step === 2 && "The AI engine is calculating your optimal path."}
                                {step === 3 && "Manually define the milestones for this objective."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {step === 1 ? (
                                <GoalDefinitionForm
                                    initialValues={activeGoal || {}}
                                    onSubmit={onDefinitionSubmit}
                                />
                            ) : step === 2 ? (
                                <AIGenerationStep
                                    onGenerate={handleGeneratePlan}
                                    generating={generating}
                                    previewPlan={tempPlan}
                                    onConfirm={handleConfirmPlan}
                                    onCancelPreview={handleCancelPreview}
                                />
                            ) : (
                                <ManualPlanStep
                                    goal={activeGoal!}
                                    onBack={() => setStep(1)}
                                    onSave={(plans) => {
                                        updateGoal.mutate({ ...activeGoal!, plans }, {
                                            onSuccess: () => {
                                                setIsFormOpen(false);
                                                setActiveGoal(null);
                                                setIsNewRecord(false);
                                                setStep(1);
                                                toast.success("Goal plan created manually!");
                                            }
                                        });
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Active Matrix</h3>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-24 bg-white/[0.01] border border-white/5 rounded-[40px] animate-pulse">
                        <Loader2 className="animate-spin text-white/20" size={32} />
                    </div>
                ) : goals.length === 0 ? (
                    <div className="py-24 text-center border border-white/5 rounded-[40px] bg-white/[0.01] backdrop-blur-sm group hover:border-white/10 transition-colors">
                        <Target className="w-16 h-16 text-white/5 mx-auto mb-6 group-hover:scale-110 group-hover:text-white/10 transition-all duration-500" strokeWidth={1} />
                        <h3 className="text-xl font-bold text-white/40 tracking-tight leading-none">Matrix Inactive</h3>
                        <p className="text-sm text-white/20 mt-3 max-w-xs mx-auto">Initialize a strategic objective to begin legacy construction.</p>
                        <Button
                            onClick={() => { setIsFormOpen(true); setIsNewRecord(true); }}
                            variant="link"
                            className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
                        >
                            + Begin Definition
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {goals.map((goal: Goal) => (
                            <div key={goal.id} className="space-y-4">
                                <GoalCard
                                    goal={goal}
                                    isExpanded={!!expandedGoals[goal.id!]}
                                    onToggle={toggleGoal}
                                    onEdit={handleEdit}
                                    onDelete={(id) => { setGoalIdToDelete(id); setShowDeleteConfirm(true); }}
                                    weekPlan={weekPlan || {}}
                                    completedDays={completedDays || {}}
                                    currentWeek={currentWeek}
                                    onUpdateGoal={(updatedGoal) => updateGoal.mutate(updatedGoal)}
                                />

                                {isFormOpen && !isNewRecord && activeGoal?.id === goal.id && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <Card className="border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl relative">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-blue-500/30 opacity-40"></div>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg font-bold tracking-tight text-white/90 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Edit2 size={16} className="text-primary/50" />
                                                        Refining: {goal.title || goal.name}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60"
                                                        onClick={() => { setIsFormOpen(false); setActiveGoal(null); setIsNewRecord(false); setStep(1); }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {step === 1 ? (
                                                    <GoalDefinitionForm
                                                        initialValues={activeGoal || {}}
                                                        onSubmit={onDefinitionSubmit}
                                                    />
                                                ) : step === 2 ? (
                                                    <AIGenerationStep
                                                        onGenerate={handleGeneratePlan}
                                                        generating={generating}
                                                        previewPlan={tempPlan}
                                                        onConfirm={handleConfirmPlan}
                                                        onCancelPreview={handleCancelPreview}
                                                    />
                                                ) : (
                                                    <ManualPlanStep
                                                        goal={activeGoal!}
                                                        onBack={() => setStep(1)}
                                                        onSave={(plans) => {
                                                            updateGoal.mutate({ ...activeGoal!, plans }, {
                                                                onSuccess: () => {
                                                                    setIsFormOpen(false);
                                                                    setActiveGoal(null);
                                                                    setStep(1);
                                                                    toast.success("Manual plan saved successfully!");
                                                                }
                                                            });
                                                        }}
                                                    />
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MilestoneStrategyDialog
                isOpen={showStrategyDialog}
                onClose={() => setShowStrategyDialog(false)}
                onSelect={handleStrategySelect}
            />

            <AILoadingPopup isOpen={generating} />

            <ConfirmationDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => pendingValues && executeDefinitionSubmit(pendingValues)}
                title="Shift Strategy?"
                description="Altering this objective's definition will deconstruct the current AI roadmap. A regeneration will be required for alignment."
                confirmText="Continue Architecture"
                cancelText="Retain Current"
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
                title="Delete Strategic Objective?"
                description="This will permanently purge this goal and all associated neural plans from the system. This operation is irreversible."
                confirmText="Confirm Purge"
                variant="destructive"
            />
        </div>
    );
};

export default GoalsPage;
