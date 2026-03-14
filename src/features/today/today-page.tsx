import React from 'react';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks, useToggleCompletedTask } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActiveTheme } from './components/active-theme';
import { useTodayTasks } from './hooks/use-today-tasks';

export const TodayPage: React.FC = () => {
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
        <div className="flex flex-col h-[calc(100vh-64px)] space-y-2 md:space-y-4 pb-20 overflow-y-auto overflow-x-hidden px-2 md:px-4">

            {tasks.length > 0 && (
                <div className="w-full shrink-0 mt-2 mb-4">
                    <ActiveTheme
                        completedPoints={pointsData.completedPoints}
                        totalPoints={pointsData.totalPoints}
                        completedTasksCount={(completedTasks || []).length}
                        totalTasksCount={tasks.length}
                        currentDayStr={currentDayStr}
                    />
                </div>
            )}

            <div className="flex-1 w-full flex flex-col">
                <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4 px-2">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">Today's Schedule</h2>
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest hidden sm:inline">Progress</span>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="text-xs font-bold text-white">
                                {(completedTasks || []).length}
                            </span>
                            <span className="text-[10px] text-white/30 font-bold">/</span>
                            <span className="text-xs font-bold text-white/50">
                                {tasks.length}
                            </span>
                        </div>
                    </div>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 min-h-[300px] border border-white/5 rounded-3xl bg-white/2 backdrop-blur-sm mx-2">
                        <div className="p-5 bg-white/5 rounded-full border border-white/10">
                            <Clock size={40} className="text-white/20" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl text-white">No Tasks for Today</h3>
                            <p className="text-sm text-white/40 max-w-sm mx-auto">
                                Your schedule is clear. Use the Week Planner to architect your legacy.
                            </p>
                        </div>
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
                                        "group relative flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md",
                                        completed
                                            ? "bg-white/2 border-white/5 opacity-50 grayscale-[0.5]"
                                            : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98]"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="flex-shrink-0 flex items-center justify-center">
                                            {completed ? (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-primary transition-colors flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "font-bold text-base transition-all tracking-tight leading-tight",
                                                completed ? "text-white/40 line-through" : "text-white/90"
                                            )}>
                                                {task.name}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                                    <Clock size={11} className="text-white/20" />
                                                    {task.startTime} - {task.endTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <span className={cn(
                                            "text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border",
                                            task.type === 'habit' && "bg-blue-500/10 border-blue-500/20 text-blue-400/80",
                                            task.type === 'goal' && "bg-purple-500/10 border-purple-500/20 text-purple-400/80",
                                            task.type === 'custom' && "bg-amber-500/10 border-amber-500/20 text-amber-400/80"
                                        )}>
                                            {task.type}
                                        </span>
                                    </div>

                                    {!completed && (
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
