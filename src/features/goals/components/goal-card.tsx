import React, { useMemo } from 'react';
import { Goal, GridState } from '@/types/global-types';
import { Button } from '@/components/ui/button';
import { Target, Calendar as CalendarIcon, Check, Edit2, Trash2, ChevronDown, Clock } from 'lucide-react';
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
    const milestones = goal.milestones || [];
    const totalMilestones = milestones.length;

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
                            const hour = Math.floor(s / 2);
                            const min = (s % 2) * 30;
                            weeklyTasksList.push({
                                id: `goal-${content.name}-${s}`,
                                dayStr: `${currentWeek}-${d + 1}`,
                                name: content.name,
                                dayName: DAYS[d],
                                time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
                            });
                            currentTaskName = content.name;
                        }
                    } else {
                        currentTaskName = null;
                    }
                }
            }
        }

        const tasksWithStatus = weeklyTasksList.map(task => {
            const isCompleted = completedDays && completedDays[task.dayStr] && completedDays[task.dayStr].includes(task.id);
            return { ...task, isCompleted: !!isCompleted };
        });

        const totalWeekly = tasksWithStatus.length;
        const completedWeekly = tasksWithStatus.filter(t => t.isCompleted).length;

        let progressOverride = 0;
        if (goal.startDate && goal.endDate) {
            const startObj = parseISO(goal.startDate);
            const endObj = parseISO(goal.endDate);
            const totalDays = Math.max(1, (endObj.getTime() - startObj.getTime()) / (1000 * 3600 * 24));
            if (currentWeek && totalWeekly > 0) {
                const currentWeekStart = WeekUtils.getDaysForWeek(currentWeek)[0];
                const daysToWeekStart = (currentWeekStart.getTime() - startObj.getTime()) / (1000 * 3600 * 24);
                let totalPassedDays = daysToWeekStart + 7 * (completedWeekly / totalWeekly);
                totalPassedDays = Math.max(0, Math.min(totalPassedDays, totalDays));
                progressOverride = (totalPassedDays / totalDays) * 100;
            }
        }

        return {
            weeklyTasks: tasksWithStatus,
            progressPercentage: progressOverride,
            completedWeeklyTasksCount: completedWeekly
        };
    }, [goal, weekPlan, completedDays, currentWeek]);

    const intensityOpacity = totalMilestones > 0
        ? Math.max(0.4, progressPercentage / 100)
        : 0.4;

    return (
        <div className="flex flex-col w-full">
            {/* Main card */}
            <div
                className={cn(
                    'group relative rounded-2xl border overflow-hidden flex flex-col',
                    'bg-white/[0.03] border-white/10 hover:border-primary/40',
                    'transition-[border-color,box-shadow] duration-150',
                    progressPercentage >= 40 && 'hover:shadow-[0_0_24px_rgba(var(--primary-rgb,99,102,241),0.12)]',
                )}
            >
                {/* Left accent bar */}
                <div
                    className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl"
                    style={{ opacity: intensityOpacity }}
                />

                {/* Action buttons - habit card style */}
                <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 z-10">
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-white/30 hover:text-primary hover:bg-white/10"
                        onClick={() => onToggle(goal.id!)}
                    >
                        <ChevronDown size={13} className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-white/30 hover:text-primary hover:bg-white/10"
                        onClick={() => onEdit(goal)}
                    >
                        <Edit2 size={13} />
                    </Button>
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-white/30 hover:text-destructive hover:bg-white/10"
                        onClick={() => onDelete(goal.id!)}
                    >
                        <Trash2 size={13} />
                    </Button>
                </div>

                <div className="p-4 pl-5 flex flex-col gap-2.5">
                    {/* Row 1: Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pr-24">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                            {goal.goalType}
                        </span>
                        {hasPlan && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Check size={8} /> Plan
                            </span>
                        )}
                        {weeklyTasks.length > 0 && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                {completedWeeklyTasksCount}/{weeklyTasks.length} Done
                            </span>
                        )}
                    </div>

                    {/* Row 2: Title */}
                    <h3 className="font-bold text-[15px] leading-snug text-white/90 tracking-tight">
                        {goal.title || goal.name}
                    </h3>

                    {/* Row 3: Description */}
                    <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2">
                        {goal.name}
                    </p>

                    {/* Row 4: Date range */}
                    <div className="flex items-center gap-1.5 text-[10px] text-white/20">
                        <CalendarIcon size={10} className="text-white/15 shrink-0" />
                        <span>{goal.startDate ? format(parseISO(goal.startDate), 'MMM d') : 'N/A'}</span>
                        <span className="text-white/10">→</span>
                        <span>End: {goal.endDate ? format(parseISO(goal.endDate), 'MMM d') : 'N/A'}</span>
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
                <div className="mt-1 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {weeklyTasks.length > 0 && (
                        <div className="p-3 sm:p-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] md:text-xs font-bold uppercase text-indigo-400 tracking-widest">This Week's Tasks</h4>
                                <span className="text-xs font-bold text-white/40">{completedWeeklyTasksCount} / {weeklyTasks.length}</span>
                            </div>
                            <div className="grid gap-2 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
                                {weeklyTasks.map((task, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-1 p-3 rounded-lg border transition-all duration-100",
                                        task.isCompleted
                                            ? 'bg-emerald-500/10 border-emerald-500/20'
                                            : 'bg-white/[0.03] border-white/10'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-xs font-semibold truncate flex-1",
                                                task.isCompleted ? "text-white/50 line-through" : "text-white/80"
                                            )}>{task.name}</span>
                                            {task.isCompleted && <Check size={12} className="text-emerald-400 ml-2" />}
                                        </div>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/25 flex items-center gap-1">
                                            <CalendarIcon size={10} /> {task.dayName} <Clock size={10} className="ml-1" /> {task.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <MasterActionPlan goal={goal} onUpdate={onUpdateGoal} />
                </div>
            )}
        </div>
    );
};
