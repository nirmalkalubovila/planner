import React, { useMemo } from 'react';
import { Goal, GridState } from '@/types/global-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Check, Edit2, Trash2, ChevronDown, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { GoalProgressBar } from './goal-progress-bar';
import { MasterActionPlan } from './master-action-plan';
import { cn } from '@/lib/utils';
import { WeekUtils } from '@/utils/week-utils';

interface GoalCardProps {
    goal: Goal;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
    weekPlan?: GridState;
    completedDays?: Record<string, string[]>;
    currentWeek?: string;
    onUpdateGoal?: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
    goal,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    weekPlan,
    completedDays,
    currentWeek,
    onUpdateGoal
}) => {
    const hasPlan = goal.plans && goal.plans.length > 0;

    // Calculate Weekly Tasks and Progress mathematically
    const { weeklyTasks, progressPercentage, completedWeeklyTasksCount } = useMemo(() => {
        let weeklyTasksList: { id: string, dayStr: string, name: string, time: string, dayName: string }[] = [];

        if (weekPlan && currentWeek) {
            const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

            for (let d = 0; d < 7; d++) {
                let currentTaskName: string | null = null;
                for (let s = 0; s < 48; s++) {
                    const content = weekPlan[`${d}-${s}`];
                    const isGoalTask = content && content.type === 'goal' && (content as any).goalId === goal.id;

                    if (isGoalTask) {
                        if (currentTaskName !== content.name) {
                            // Start new contiguous block
                            const hour = Math.floor(s / 2);
                            const min = (s % 2) * 30;
                            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                            weeklyTasksList.push({
                                id: `goal-${content.name}-${s}`,
                                dayStr: `${currentWeek}-${d + 1}`,
                                name: content.name,
                                dayName: DAYS[d],
                                time: timeStr
                            });
                            currentTaskName = content.name;
                        }
                    } else {
                        currentTaskName = null;
                    }
                }
            }
        }

        // Add completed status
        const tasksWithStatus = weeklyTasksList.map(task => {
            const isCompleted = completedDays && completedDays[task.dayStr] && completedDays[task.dayStr].includes(task.id);
            return { ...task, isCompleted: !!isCompleted };
        });

        const totalWeekly = tasksWithStatus.length;
        const completedWeekly = tasksWithStatus.filter(t => t.isCompleted).length;

        // Calculate Progress Overall
        let progressOverride = 0;
        if (goal.startDate && goal.endDate) {
            const startObj = parseISO(goal.startDate);
            const endObj = parseISO(goal.endDate);
            const totalDays = Math.max(1, (endObj.getTime() - startObj.getTime()) / (1000 * 3600 * 24));

            if (currentWeek) {
                const currentWeekStart = WeekUtils.getDaysForWeek(currentWeek)[0];
                const daysToWeekStart = (currentWeekStart.getTime() - startObj.getTime()) / (1000 * 3600 * 24);

                let currentWeekProgressDays = 0;
                if (totalWeekly > 0) {
                    // Progress based on actual task completions
                    currentWeekProgressDays = 7 * (completedWeekly / totalWeekly);

                    let totalPassedDays = daysToWeekStart + currentWeekProgressDays;
                    if (totalPassedDays < 0) totalPassedDays = 0;
                    if (totalPassedDays > totalDays) totalPassedDays = totalDays;

                    progressOverride = (totalPassedDays / totalDays) * 100;
                } else {
                    // If no tasks are planned, progress is 0
                    progressOverride = 0;
                }
            }
        }

        return {
            weeklyTasks: tasksWithStatus,
            progressPercentage: progressOverride,
            completedWeeklyTasksCount: completedWeekly
        };
    }, [goal, weekPlan, completedDays, currentWeek]);




    return (
        <Card className={cn(
            "overflow-hidden border-border/60 hover:border-primary/40 transition-all group flex flex-col select-none w-full",
            !isExpanded ? "h-[260px]" : "min-h-[260px]"
        )}>
            <div className={cn(
                "bg-accent/40 px-4 pt-4 pb-3 flex flex-col border-b group/card transition-all duration-300",
                !isExpanded && "flex-1"
            )}>
                <div className="flex flex-row items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500 shadow-inner">
                            <Target size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-tighter">{goal.goalType}</span>
                                {hasPlan && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold flex items-center uppercase tracking-tighter"><Check size={8} className="mr-0.5" /> Plan</span>}
                                {weeklyTasks.length > 0 && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20 uppercase tracking-tighter">
                                        {completedWeeklyTasksCount}/{weeklyTasks.length} Done
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{goal.title || goal.name}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 bg-background/50 rounded-full p-1 backdrop-blur-sm shadow-sm border border-white/5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-primary transition-colors" onClick={() => onToggle(goal.id!)}>
                            <ChevronDown size={14} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-primary transition-colors" onClick={() => onEdit(goal)}>
                            <Edit2 size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-destructive transition-colors" onClick={() => onDelete(goal.id!)}>
                            <Trash2 size={12} />
                        </Button>
                    </div>
                </div>

                <div className="px-1 h-[48px] overflow-hidden mb-2">
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3">
                        {goal.name}
                    </p>
                </div>

                <div className="text-[9px] text-muted-foreground/40 px-1 mb-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {goal.startDate ? format(parseISO(goal.startDate), 'MMM d') : 'N/A'}</span>
                    <span className="flex items-center gap-1">End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d') : 'N/A'}</span>
                </div>

                <div className="mt-auto">
                    <GoalProgressBar 
                        milestones={goal.milestones || []}
                        progressPercentage={progressPercentage}
                    />
                </div>
            </div>

            {isExpanded && (
                <CardContent className="p-0 border-t border-border/50">
                    {/* Weekly Tasks For This Goal */}
                    {weeklyTasks.length > 0 && (
                        <div className="bg-indigo-500/5 p-4 border-b border-indigo-500/10">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] md:text-xs font-bold uppercase text-indigo-500 tracking-widest">Tasks Scheduled</h4>
                                <span className="text-xs font-bold text-muted-foreground">{completedWeeklyTasksCount} / {weeklyTasks.length} Done</span>
                            </div>
                            <div className="grid gap-2 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
                                {weeklyTasks.map((task, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-1 p-3 rounded-lg border shadow-sm transition-all",
                                        task.isCompleted ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-card/50 border-border/50'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-xs font-semibold truncate flex-1",
                                                task.isCompleted ? "text-foreground line-through opacity-70" : "text-foreground"
                                            )}>{task.name}</span>
                                            {task.isCompleted && <Check size={12} className="text-emerald-500 ml-2" />}
                                        </div>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Calendar size={10} /> {task.dayName} <Clock size={10} className="ml-1" /> {task.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <MasterActionPlan goal={goal} onUpdate={onUpdateGoal} />
                </CardContent>
            )}
        </Card>
    );
};
