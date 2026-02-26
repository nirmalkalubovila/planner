import React, { useMemo } from 'react';
import { Goal, GridState } from '@/types/global-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Check, Edit2, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
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
}

export const GoalCard: React.FC<GoalCardProps> = ({
    goal,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    weekPlan,
    completedDays,
    currentWeek
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
                    // Progress based on actual task completions! 1 week = 7 days.
                    currentWeekProgressDays = 7 * (completedWeekly / totalWeekly);
                } else {
                    // Natural time progression when no tasks are planned
                    const today = new Date();
                    const daysInCurrentWeek = Math.max(0, Math.min(7, (today.getTime() - currentWeekStart.getTime()) / (1000 * 3600 * 24)));
                    currentWeekProgressDays = daysInCurrentWeek;
                }

                let totalPassedDays = daysToWeekStart + currentWeekProgressDays;
                if (totalPassedDays < 0) totalPassedDays = 0;
                if (totalPassedDays > totalDays) totalPassedDays = totalDays;

                progressOverride = (totalPassedDays / totalDays) * 100;
            }
        }

        return {
            weeklyTasks: tasksWithStatus,
            progressPercentage: progressOverride,
            completedWeeklyTasksCount: completedWeekly
        };
    }, [goal, weekPlan, completedDays, currentWeek]);


    return (
        <Card className="overflow-hidden border-border/60 hover:border-primary/40 transition-all group">
            <div className="bg-accent/40 px-5 pt-5 pb-6 flex flex-col border-b group/card transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-xl flex-shrink-0">
                            <Target size={24} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{goal.goalType} Goal</span>
                                {hasPlan && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-medium flex items-center"><Check size={10} className="mr-1" /> Plan Ready</span>}
                                {weeklyTasks.length > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                                        This Week: {completedWeeklyTasksCount}/{weeklyTasks.length} Tasks
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{goal.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{goal.purpose}</p>
                            <div className="text-[11px] text-muted-foreground/80 mt-2 flex items-center gap-2 font-medium">
                                <span className="flex items-center gap-1"><Calendar size={12} /> Start: {goal.startDate ? format(parseISO(goal.startDate), 'MMM d, yy') : 'N/A'}</span>
                                <span>&rarr;</span>
                                <span className="flex items-center gap-1">End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d, yy') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center items-center">
                        <Button variant="ghost" size="sm" onClick={() => onToggle(goal.id!)}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onEdit(goal)}>
                            <Edit2 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => onDelete(goal.id!)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>

                <div className="w-full pl-5 pr-5">
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
                                <h4 className="text-[10px] md:text-xs font-bold uppercase text-indigo-500 tracking-widest">Tasks Scheduled This Week</h4>
                                <span className="text-xs font-bold text-muted-foreground">{completedWeeklyTasksCount} / {weeklyTasks.length} Done</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {weeklyTasks.map((task, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-1 p-3 rounded-lg border shadow-sm transition-all",
                                        task.isCompleted ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-card/50 border-border/50'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-sm font-semibold",
                                                task.isCompleted ? "text-foreground line-through opacity-70" : "text-foreground"
                                            )}>{task.name}</span>
                                            {task.isCompleted && <Check size={14} className="text-emerald-500" />}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Calendar size={10} /> {task.dayName} <Clock size={10} className="ml-1" /> {task.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <MasterActionPlan goal={goal} />
                </CardContent>
            )}
        </Card>
    );
};
