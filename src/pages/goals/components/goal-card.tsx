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


    const [showFullDesc, setShowFullDesc] = React.useState(false);
    const [showFullPurpose, setShowFullPurpose] = React.useState(false);

    return (
        <Card className="h-full overflow-hidden border-border/60 hover:border-primary/40 transition-all group flex flex-col">
            <div className={cn(
                "bg-accent/40 px-3 sm:px-5 pt-4 sm:pt-5 pb-5 sm:pb-6 flex flex-col border-b group/card transition-all duration-300",
                !isExpanded && "min-h-[220px] sm:min-h-[200px]"
            )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="bg-primary/10 text-primary p-2.5 sm:p-3 rounded-xl flex-shrink-0">
                            <Target size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{goal.goalType}</span>
                                {hasPlan && <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-medium flex items-center"><Check size={10} className="mr-1" /> Plan</span>}
                                {weeklyTasks.length > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                                        {completedWeeklyTasksCount}/{weeklyTasks.length} Done
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-base sm:text-lg leading-snug">{goal.title || goal.name}</h3>

                            <div className="mt-1">
                                <p className={cn(
                                    "text-[11px] sm:text-sm text-muted-foreground transition-all duration-300",
                                    (!isExpanded || !showFullDesc) ? "line-clamp-2" : "line-clamp-none"
                                )}>
                                    {goal.name}
                                </p>
                                {isExpanded && goal.name.length > 100 && (
                                    <button
                                        onClick={() => setShowFullDesc(!showFullDesc)}
                                        className="text-[10px] font-bold text-primary hover:underline mt-0.5 uppercase tracking-widest"
                                    >
                                        {showFullDesc ? "Show Less" : "... View"}
                                    </button>
                                )}
                            </div>

                            {isExpanded && goal.purpose && (
                                <div className="mt-2">
                                    <p className={cn(
                                        "text-[10px] sm:text-xs text-muted-foreground/70 italic leading-relaxed",
                                        !showFullPurpose ? "line-clamp-2" : "line-clamp-none"
                                    )}>
                                        {goal.purpose}
                                    </p>
                                    {goal.purpose.length > 80 && (
                                        <button
                                            onClick={() => setShowFullPurpose(!showFullPurpose)}
                                            className="text-[9px] font-bold text-primary/60 hover:text-primary transition-colors mt-0.5 uppercase tracking-widest"
                                        >
                                            {showFullPurpose ? "Show Less" : "... View"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="text-[10px] sm:text-[11px] text-muted-foreground/80 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                                <span className="flex items-center gap-1"><Calendar size={11} /> {goal.startDate ? format(parseISO(goal.startDate), 'MMM d, yy') : 'N/A'}</span>
                                <span className="hidden xs:inline text-muted-foreground/40">&rarr;</span>
                                <span className="flex items-center gap-1">End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d, yy') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center items-center">
                        <Button variant="ghost" size="sm" onClick={() => onToggle(goal.id!)} className="hover:bg-primary/10 p-2">
                            <ChevronDown size={18} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => onEdit(goal)} className="p-2 h-8">
                            <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground p-2 h-8" onClick={() => onDelete(goal.id!)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>

                <div className="w-full mt-auto">
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

                    <MasterActionPlan goal={goal} onUpdate={onUpdateGoal} />
                </CardContent>
            )}
        </Card>
    );
};
