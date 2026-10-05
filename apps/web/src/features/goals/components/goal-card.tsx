import React, { useMemo } from 'react';
import { Goal, GridState } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Check, Edit2, Trash2, ChevronDown, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { GoalProgressBar } from './goal-progress-bar';
import { MasterActionPlan } from './master-action-plan';
import { cn } from '@/lib/utils';
import { calculateGoalProgress } from '@llb/core';

import { BUCKET_META } from '@llb/core';

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
    onBuildPlan?: (goal: Goal) => void;
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
    onUpdateGoal,
    onBuildPlan
}) => {
    const hasPlan = goal.plans && goal.plans.length > 0;
    const milestones = goal.milestones || [];
    const totalMilestones = milestones.length;

    const { weeklyTasks, progressPercentage, completedWeeklyTasksCount, totalAllocatedHours } = useMemo(() => {
        let weeklyTasksList: { id: string, dayStr: string, name: string, time: string, dayName: string }[] = [];

        if (weekPlan && currentWeek) {
            const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            for (let d = 0; d < 7; d++) {
                for (let s = 0; s < 48; s++) {
                    const content = weekPlan[`${d}-${s}`];
                    const isGoalTask = content && content.type === 'goal' && (content as any).goalId === goal.id;
                    if (isGoalTask) {
                        const startSlot = s;
                        let endSlot = s;
                        while (endSlot < 47) {
                            const nextContent = weekPlan[`${d}-${endSlot + 1}`];
                            const isNextGoalTask = nextContent && nextContent.type === 'goal' && (nextContent as any).goalId === goal.id && nextContent.name === content.name;
                            if (isNextGoalTask) {
                                endSlot++;
                            } else {
                                break;
                            }
                        }

                        const startH = Math.floor(startSlot / 2);
                        const startM = (startSlot % 2) * 30;
                        const startTimeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

                        const endH = Math.floor((endSlot + 1) / 2);
                        const endM = ((endSlot + 1) % 2) * 30;
                        const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                        weeklyTasksList.push({
                            id: `goal-${content.name}-${startSlot}`,
                            dayStr: `${currentWeek}-${d + 1}`,
                            name: content.name,
                            dayName: DAYS[d],
                            time: `${startTimeStr} - ${endTimeStr}`
                        });

                        s = endSlot;
                    }
                }
            }
        }

        const tasksWithStatus = weeklyTasksList.map(task => {
            const isCompleted = completedDays && completedDays[task.dayStr] && completedDays[task.dayStr].includes(task.id);
            return { ...task, isCompleted: !!isCompleted };
        });

        const completedWeekly = tasksWithStatus.filter(t => t.isCompleted).length;

        const completedDaysMap = completedDays ? Object.keys(completedDays).reduce<Record<string, string[]>>((acc, key) => {
            acc[key] = completedDays[key];
            return acc;
        }, {}) : undefined;

        const progressOverride = calculateGoalProgress(goal, currentWeek, weekPlan, completedDaysMap);

        let totalSlotsCount = 0;
        if (weekPlan && currentWeek) {
            for (let d = 0; d < 7; d++) {
                for (let s = 0; s < 48; s++) {
                    const content = weekPlan[`${d}-${s}`];
                    const isGoalTask = content && content.type === 'goal' && (content as any).goalId === goal.id;
                    if (isGoalTask) {
                        totalSlotsCount++;
                    }
                }
            }
        }
        const totalAllocatedHours = totalSlotsCount * 0.5;

        return {
            weeklyTasks: tasksWithStatus,
            progressPercentage: progressOverride,
            completedWeeklyTasksCount: completedWeekly,
            totalAllocatedHours
        };
    }, [goal, weekPlan, completedDays, currentWeek]);

    const isCompleted = progressPercentage >= 100;

    const cardBorderClass = 'border-border hover:border-primary/40';
    const cardBgClass = 'bg-card';
    const accentLineClass = 'bg-primary';

    const intensityOpacity = totalMilestones > 0
        ? Math.max(0.4, progressPercentage / 100)
        : 0.4;

    return (
        <div className="flex flex-col w-full">
            {/* Main card */}
            <div
                className={cn(
                    'group relative rounded-2xl border overflow-hidden flex flex-col',
                    cardBorderClass,
                    cardBgClass,
                    'transition-[border-color,box-shadow] duration-150',
                    progressPercentage >= 40 && 'hover:shadow-[0_0_24px_rgba(var(--primary-rgb,210,162,38),0.12)]',
                )}
            >
                                {/* Left accent bar */}
                <div
                    className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl z-10", accentLineClass)}
                    style={{ opacity: intensityOpacity }}
                />

                {/* Action buttons - habit card style */}
                <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 z-20">
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
                        onClick={() => onToggle(goal.id!)}
                    >
                        <ChevronDown size={13} className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                    {!isCompleted && (
                        <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent"
                            onClick={() => onEdit(goal)}
                        >
                            <Edit2 size={13} />
                        </Button>
                    )}
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent"
                        onClick={() => onDelete(goal.id!)}
                    >
                        <Trash2 size={13} />
                    </Button>
                </div>

                <div className="p-4 pl-5 flex flex-col gap-2.5 z-10 relative">
                    {/* Row 1: type + bucket only; progress facts live in the meta line below */}
                    <div className="flex flex-wrap items-center gap-1.5 pr-24">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 rounded">
                            {goal.goalType}
                        </span>
                        {goal.bucket && BUCKET_META[goal.bucket] && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                                {BUCKET_META[goal.bucket].label}
                            </span>
                        )}
                        {hasPlan && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Check size={8} /> Plan
                            </span>
                        )}
                    </div>

                    {/* Row 2: Title */}
                    <h3 className="font-bold text-[15px] leading-snug tracking-tight text-foreground">
                        {goal.title || goal.name}
                    </h3>

                    {goal.goalContext?.why && (
                        <p className="text-[11px] leading-relaxed text-primary/80 line-clamp-2">Why: {goal.goalContext.why}</p>
                    )}

                    {/* Row 3: Description */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {goal.name && goal.name.length > 100 ? `${goal.name.substring(0, 100)}...` : goal.name}
                    </p>

                    {/* Row 4: Date range */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
                        <CalendarIcon size={10} className="text-muted-foreground shrink-0" />
                        <span>{goal.startDate ? format(parseISO(goal.startDate), 'MMM d') : 'N/A'}</span>
                        <span className="text-muted-foreground/60">→</span>
                        <span>End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d') : 'N/A'}</span>
                        {weeklyTasks.length > 0 && <span className="text-muted-foreground/60">· {completedWeeklyTasksCount}/{weeklyTasks.length} done this week</span>}
                        {totalAllocatedHours > 0 && <span className="text-muted-foreground/60">· {totalAllocatedHours}h</span>}
                    </div>

                    {/* Row 5: Milestone timeline */}
                    <GoalProgressBar
                        milestones={milestones}
                        progressPercentage={progressPercentage}
                        startDate={goal.startDate}
                    />
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-1 rounded-2xl border border-border bg-muted/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {weeklyTasks.length > 0 && (
                        <div className="p-3 sm:p-4 border-b border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] md:text-xs font-bold uppercase text-primary tracking-widest">This Week's Tasks</h4>
                                <span className="text-xs font-bold text-muted-foreground">{completedWeeklyTasksCount} / {weeklyTasks.length}</span>
                            </div>
                            <div className="grid gap-2 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
                                {weeklyTasks.map((task, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-1 p-3 rounded-lg border transition-all duration-100",
                                        task.isCompleted
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'bg-card border-border'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-xs font-semibold truncate flex-1",
                                                task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                                            )}>{task.name}</span>
                                            {task.isCompleted && <Check size={12} className="text-primary ml-2" />}
                                        </div>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                                            <CalendarIcon size={10} /> {task.dayName} <Clock size={10} className="ml-1" /> {task.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <MasterActionPlan goal={goal} onUpdate={onUpdateGoal} onBuildPlan={onBuildPlan} />
                </div>
            )}
        </div>
    );
};
