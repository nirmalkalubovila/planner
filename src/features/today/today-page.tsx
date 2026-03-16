import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks, useToggleCompletedTask } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ActiveTheme } from './components/active-theme';
import { useTodayTasks } from './hooks/use-today-tasks';

export const TodayPage: React.FC = () => {
    const navigate = useNavigate();
    const currentWeek = WeekUtils.getCurrentWeek();
    const currentDayStr = WeekUtils.getCurrentDay();
    const dayIdx = parseInt(currentDayStr.split('-')[2]) - 1;

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: completedTasks } = useGetCompletedTasks(currentDayStr);
    const toggleTask = useToggleCompletedTask();

    const { tasks, pointsData } = useTodayTasks(weekPlan, habits, dayIdx, completedTasks);

    const handleToggle = (taskId: string) => {
        toggleTask.mutate({ dayStr: currentDayStr, taskId });
    };

    const isTaskCompleted = (taskId: string) => (completedTasks || []).includes(taskId);

    return (
        <div className="flex flex-col space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12">

            <div className="flex justify-between items-end mb-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">Today's Schedule</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {tasks.length} TASKS
                        </span>
                    </div>
                </div>
                {tasks.length > 0 && (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">Progress</span>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-muted border border-border px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                            <span className="text-xs font-bold text-foreground">
                                {(completedTasks || []).length}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold">/</span>
                            <span className="text-xs font-bold text-muted-foreground">
                                {tasks.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {tasks.length > 0 && (
                <div className="w-full shrink-0">
                    <ActiveTheme
                        completedPoints={pointsData.completedPoints}
                        totalPoints={pointsData.totalPoints}
                        completedTasksCount={(completedTasks || []).length}
                        totalTasksCount={tasks.length}
                        currentDayStr={currentDayStr}
                    />
                </div>
            )}

                {tasks.length === 0 ? (
                    <div className="py-24 text-center">
                        <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6 group-hover:scale-110 group-hover:text-muted-foreground transition-all duration-500" strokeWidth={1} />
                        <h3 className="text-xl font-bold text-muted-foreground tracking-tight leading-none">No Tasks for Today</h3>
                        <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">Your schedule is clear. Use the Week Planner to architect your legacy.</p>
                        <Button
                            onClick={() => navigate('/planner')}
                            variant="link"
                            className="mt-6 text-primary font-bold uppercase tracking-widest text-[10px] hover:text-primary/80"
                        >
                            + Open Planner
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 pb-12">
                        {tasks.map((task) => {
                            const completed = isTaskCompleted(task.id);
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggle(task.id)}
                                    className={cn(
                                        "group relative flex items-center justify-between p-4 md:p-5 rounded-2xl border cursor-pointer overflow-hidden",
                                        "transition-[border-color,opacity,background-color] duration-100",
                                        completed
                                            ? "bg-muted/30 border-border opacity-50"
                                            : "bg-glass border-border hover:border-border hover:bg-accent active:scale-[0.98] active:duration-75"
                                    )}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className="flex-shrink-0 flex items-center justify-center">
                                            {completed ? (
                                                <div className="w-6 h-6 rounded-full bg-intent-goal-muted text-intent-goal flex items-center justify-center border border-intent-goal/30">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors duration-100 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "font-bold text-sm sm:text-base tracking-tight leading-tight truncate",
                                                completed ? "text-muted-foreground line-through" : "text-foreground"
                                            )}>
                                                {task.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    <Clock size={11} className="text-muted-foreground" />
                                                    {task.startTime} - {task.endTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-2">
                                        <span className={cn(
                                            "text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border",
                                            task.type === 'habit' && "bg-blue-500/10 border-blue-500/20 text-blue-400/80",
                                            task.type === 'goal' && "bg-purple-500/10 border-purple-500/20 text-purple-400/80",
                                            task.type === 'custom' && "bg-amber-500/10 border-amber-500/20 text-amber-400/80"
                                        )}>
                                            {task.type}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
        </div>
    );
};
