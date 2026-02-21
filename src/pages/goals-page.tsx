import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Edit2, Calendar, Target } from 'lucide-react';
import { useGetGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from '@/api/services/goal-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WeekUtils } from '@/utils/week-utils';
import { Goal, GoalWeek } from '@/types/global-types';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
    title: z.string().min(1, "Title is required"),
    totalWeeks: z.number().min(1, "At least 1 week required"),
    startWeek: z.string().regex(/^\d{4}-\d{1,2}$/, "Format: YYYY-WW"),
    weeks: z.array(z.object({
        weekNum: z.number(),
        weekLabel: z.string(),
        hours: z.number().min(0),
        subGoal: z.string(),
        isPaused: z.boolean(),
    })),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export const GoalsPage: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Week Breakdown
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: goals = [], isLoading } = useGetGoals();
    const createGoal = useCreateGoal();
    const updateGoal = useUpdateGoal();
    const deleteGoal = useDeleteGoal();

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            title: '',
            totalWeeks: 4,
            startWeek: WeekUtils.getCurrentWeek(),
            weeks: [],
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "weeks"
    });

    const handleInitializeWeeks = () => {
        const weeksCount = form.getValues('totalWeeks');
        const startWeek = form.getValues('startWeek');
        const newWeeks: GoalWeek[] = [];

        for (let i = 1; i <= weeksCount; i++) {
            newWeeks.push({
                weekNum: i,
                weekLabel: WeekUtils.addWeeks(startWeek, i - 1),
                hours: 0,
                subGoal: '',
                isPaused: false
            });
        }
        replace(newWeeks);
        setStep(2);
    };

    const onSubmit = (values: GoalFormValues) => {
        const goalData: Goal = {
            ...values,
            startDate: new Date().toISOString(),
        };

        if (editingId) {
            updateGoal.mutate({ ...goalData, id: editingId });
            setEditingId(null);
        } else {
            createGoal.mutate(goalData);
        }

        form.reset();
        setStep(1);
        setIsFormOpen(false);
    };

    const handleEdit = (goal: Goal) => {
        setEditingId(goal.id!);
        form.reset({
            title: goal.title,
            totalWeeks: goal.totalWeeks,
            startWeek: goal.startWeek,
            weeks: goal.weeks,
        });
        setStep(2);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Goal Tracker</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Break down long-term goals into weekly sub-goals.</p>
                </div>
                <Button onClick={() => { setIsFormOpen(!isFormOpen); setStep(1); }} variant={isFormOpen ? "outline" : "default"} className="w-full sm:w-auto">
                    {isFormOpen ? "Cancel" : "Define New Goal"}
                </Button>
            </div>

            {isFormOpen && (
                <Card className="border-primary/20 bg-accent/5">
                    <CardHeader>
                        <CardTitle>{editingId ? "Edit Goal" : "New Goal"}</CardTitle>
                        <CardDescription>Step {step}: {step === 1 ? "Basic Details" : "Weekly Breakdown"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Main Goal</label>
                                        <Input {...form.register('title')} placeholder="e.g., Learn Piano" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total Weeks</label>
                                        <Input type="number" {...form.register('totalWeeks', { valueAsNumber: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Start Week</label>
                                        <div className="flex gap-2">
                                            <Input {...form.register('startWeek')} placeholder="YYYY-WW" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue('startWeek', WeekUtils.getCurrentWeek())}>
                                                <Calendar size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleInitializeWeeks} className="w-full">Next: Plan Weeks</Button>
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                                    {fields.map((field, index: number) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-background border items-center">
                                            <div className="text-sm font-bold flex flex-col">
                                                <span>W{field.weekNum}</span>
                                                <span className="text-xs text-muted-foreground font-normal">{field.weekLabel}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Hours</label>
                                                <Input type="number" {...form.register(`weeks.${index}.hours` as const, { valueAsNumber: true })} placeholder="Hours" />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Sub-goal Description</label>
                                                <Input {...form.register(`weeks.${index}.subGoal` as const)} placeholder="Target for this week" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                                    <Button type="submit" className="flex-1">{editingId ? "Update Goal" : "Save Final Goal"}</Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                <h3 className="text-xl font-semibold">Active Goals</h3>
                {isLoading ? (
                    <div>Loading...</div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                        No active goals found. Start planning!
                    </div>
                ) : (
                    goals.map((goal: Goal) => (
                        <Card key={goal.id} className="overflow-hidden border-border/60 hover:border-primary/40 transition-all">
                            <div className="bg-accent/40 p-4 flex items-center justify-between border-b">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{goal.title}</h3>
                                        <p className="text-xs text-muted-foreground">Starts: {WeekUtils.formatWeekDisplay(goal.startWeek)} • {goal.totalWeeks} Weeks Total</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteGoal.mutate(goal.id!)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="flex overflow-x-auto p-4 gap-3 bg-accent/10 scrollbar-hide">
                                    {goal.weeks.map((w: GoalWeek, idx: number) => {
                                        const isCurrent = WeekUtils.getCurrentWeek() === w.weekLabel;
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "min-w-[120px] flex-shrink-0 p-3 rounded-lg border text-center transition-all",
                                                    isCurrent ? "bg-primary text-primary-foreground scale-105 shadow-lg border-primary" : "bg-card text-card-foreground border-border"
                                                )}
                                            >
                                                <div className="font-bold text-sm">W{w.weekNum}</div>
                                                <div className="text-[10px] opacity-70 mb-1">{w.weekLabel}</div>
                                                <div className="text-lg font-black">{w.hours}h</div>
                                                {w.subGoal && <div className="text-[10px] mt-2 line-clamp-2 leading-tight opacity-80">{w.subGoal}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
