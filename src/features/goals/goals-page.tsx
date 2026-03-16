import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Goal, Milestone } from '@/types/global-types';
import { format, parseISO, addWeeks, addMonths, addYears } from 'date-fns';
import { GoalCard } from './components/goal-card';
import { GoalDefinitionForm, GoalFormValues } from './forms/goal-definition-form';
import { AIGenerationStep } from './forms/ai-generation-step';
import { WeekUtils } from '@/utils/week-utils';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetWeekCompletedTasks } from '@/api/services/today-service';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { StandardDialog } from '@/components/common/standard-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { MilestoneStrategyDialog } from './components/strategy-choice-dialog';
import { ManualPlanStep } from './forms/manual-plan-step';
import { AILoadingPopup } from '@/components/common/ai-loading-popup';
import { useAiPlanGeneration } from './hooks/use-ai-plan-generation';

export const GoalsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
    const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
    const [showStrategyDialog, setShowStrategyDialog] = useState(false);
    const [strategyPendingData, setStrategyPendingData] = useState<Goal | null>(null);
    const [showAiLoader, setShowAiLoader] = useState(false);

    const { generating, tempPlan, generatePlan, clearTempPlan } = useAiPlanGeneration(user);

    useEffect(() => {
        if (generating && showAiLoader) setShowAiLoader(false);
    }, [generating]);

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingValues, setPendingValues] = useState<GoalFormValues | null>(null);

    const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: goals = [], isLoading } = useGetGoals();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    const currentWeek = WeekUtils.getCurrentWeek();
    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const currentWeekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => `${currentWeek}-${i + 1}`), [currentWeek]);
    const { data: completedDays } = useGetWeekCompletedTasks(currentWeekDays);

    const closeDialog = () => {
        setIsFormOpen(false);
        setActiveGoal(null);
        setStep(1);
        clearTempPlan();
    };

    const toggleGoal = (id: string) => {
        setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openNewGoal = () => {
        setActiveGoal(null);
        setStep(1);
        clearTempPlan();
        setIsFormOpen(true);
    };

    const handleEdit = (goal: Goal) => {
        setActiveGoal(goal);
        setStep(1);
        clearTempPlan();
        setIsFormOpen(true);
    };

    const onDefinitionSubmit = (values: GoalFormValues) => {
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
                title,
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

    const isEditing = !!(activeGoal?.id);

    const handleStrategySelect = (type: 'ai' | 'manual') => {
        if (!strategyPendingData) return;
        setShowStrategyDialog(false);

        if (type === 'ai') setShowAiLoader(true);

        const mutation = isEditing ? updateGoal : createGoal;

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
            onError: () => {
                setShowAiLoader(false);
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
                closeDialog();
                toast.success('Goal added to your planner', {
                    description: 'AI action plan saved',
                    action: { label: 'Open Planner', onClick: () => navigate('/planner') },
                });
            },
            onError: (err: any) => { toast.error('DB Error: ' + err.message); }
        });
    };

    const dialogTitle = step === 1
        ? (isEditing ? 'Edit Goal' : 'New Goal')
        : step === 2 ? 'AI Plan Preview' : 'Manual Plan';

    const dialogSubtitle = step === 1
        ? 'Define strategic parameters'
        : step === 2 ? 'Review your AI-generated roadmap' : 'Define milestones manually';

    return (
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">

            <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">Goal Matrix</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{goals.length} STRATEGIC OBJECTIVES</span>
                    </div>
                </div>
                <Button
                    onClick={openNewGoal}
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-full text-foreground hover:bg-accent transition-all duration-150 active:scale-95"
                    title="New Goal"
                >
                    <Plus size={26} strokeWidth={2.5} />
                </Button>
            </div>

            {isLoading ? (
                <PageLoader />
            ) : goals.length === 0 ? (
                <div className="py-24 text-center border border-border rounded-[40px] bg-muted/50 backdrop-blur-sm group hover:border-border transition-colors">
                    <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6 group-hover:scale-110 group-hover:text-muted-foreground transition-all duration-500" strokeWidth={1} />
                    <h3 className="text-xl font-bold text-muted-foreground tracking-tight leading-none">Matrix Inactive</h3>
                    <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">Initialize a strategic objective to begin legacy construction.</p>
                    <Button
                        onClick={openNewGoal}
                        variant="link"
                        className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
                    >
                        + Begin Definition
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full pb-20">
                    {goals.map((goal: Goal) => (
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
                            onUpdateGoal={(updatedGoal) => updateGoal.mutate(updatedGoal)}
                        />
                    ))}
                </div>
            )}

            <StandardDialog
                isOpen={isFormOpen}
                onClose={closeDialog}
                title={dialogTitle}
                subtitle={dialogSubtitle}
                icon={Target}
                maxWidth={step === 2 ? '4xl' : step === 3 ? '2xl' : 'lg'}
            >
                <div className="p-4 sm:p-6">
                    {step === 1 ? (
                        <GoalDefinitionForm
                            key={activeGoal?.id || 'new'}
                            initialValues={activeGoal ? {
                                title: activeGoal.title || activeGoal.name,
                                name: activeGoal.name,
                                goalType: activeGoal.goalType,
                                purpose: activeGoal.purpose || '',
                                startDate: activeGoal.startDate,
                                durationValue: activeGoal.milestones?.length || 1
                            } : {}}
                            onSubmit={onDefinitionSubmit}
                        />
                    ) : step === 2 ? (
                        <AIGenerationStep
                            onGenerate={handleGeneratePlan}
                            generating={generating}
                            previewPlan={tempPlan}
                            onConfirm={handleConfirmPlan}
                            onCancelPreview={() => { clearTempPlan(); setStep(1); }}
                        />
                    ) : activeGoal ? (
                        <ManualPlanStep
                            goal={activeGoal}
                            onBack={() => setStep(1)}
                            onSave={(plans) => {
                                updateGoal.mutate({ ...activeGoal, plans }, {
                                    onSuccess: () => {
                                        closeDialog();
                                        toast.success('Goal added to your planner', {
                                            description: 'Manual action plan saved',
                                            action: { label: 'Open Planner', onClick: () => navigate('/planner') },
                                        });
                                    }
                                });
                            }}
                        />
                    ) : null}
                </div>
            </StandardDialog>

            <MilestoneStrategyDialog
                isOpen={showStrategyDialog}
                onClose={() => setShowStrategyDialog(false)}
                onSelect={handleStrategySelect}
            />

            <AILoadingPopup isOpen={showAiLoader || generating} />

            <ConfirmationDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => pendingValues && executeDefinitionSubmit(pendingValues)}
                title="Update Goal?"
                description="Editing this goal will reset the current plan. You'll need to regenerate it."
                confirmText="Continue"
                cancelText="Cancel"
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
                description="This will permanently delete this goal and all its plans. This can't be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
};

export default GoalsPage;
