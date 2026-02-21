import React, { useMemo } from 'react';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { useGetHabits } from '@/api/services/habit-service';
import { useGetCompletedTasks, useToggleCompletedTask } from '@/api/services/today-service';
import { WeekUtils } from '@/utils/week-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/global-types';
import { ActiveTheme } from '@/components/today/active-theme';

interface TaskItem {
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    startSlot: number;
    endSlot: number;
}

export const TodayPage: React.FC = () => {
    const currentWeek = WeekUtils.getCurrentWeek();
    const currentDayStr = WeekUtils.getCurrentDay(); // format: YYYY-WW-Day
    const dayIdx = parseInt(currentDayStr.split('-')[2]) - 1; // 0 to 6 (Mon to Sun)

    const { data: weekPlan } = useGetWeekPlan(currentWeek);
    const { data: habits } = useGetHabits();
    const { data: completedTasks } = useGetCompletedTasks(currentDayStr);
    const toggleTask = useToggleCompletedTask();

    const tasks = useMemo(() => {
        const SLOTS_PER_DAY = 48;
        const result: TaskItem[] = [];
        let currentTask: TaskItem | null = null;

        const getCellContent = (slotIdx: number) => {
            // Priority 1: Habit
            const habit = (habits || []).find((h: Habit) => {
                const [hStartH, hStartM] = h.startTime.split(':').map(Number);
                const [hEndH, hEndM] = h.endTime.split(':').map(Number);
                const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
                const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
                const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                const currentDayName = DAYS[dayIdx];
                const todayDate = new Date().toISOString().split('T')[0];

                const isDayMatched = h.daysOfWeek?.includes(currentDayName) ?? true;
                const hasStarted = h.startDate ? h.startDate <= todayDate : true;
                const hasNotEnded = h.endDate ? h.endDate >= todayDate : true;

                return isDayMatched && hasStarted && hasNotEnded && slotIdx >= startSlot && slotIdx < endSlot;
            });
            if (habit) return { type: 'habit', name: habit.name };

            // Priority 2: Planned Session
            return (weekPlan || {})[`${dayIdx}-${slotIdx}`];
        };

        const formatTime = (slot: number) => {
            const hour = Math.floor(slot / 2);
            const min = (slot % 2) * 30;
            return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        };

        for (let i = 0; i < SLOTS_PER_DAY; i++) {
            const content = getCellContent(i);

            if (content) {
                if (currentTask && currentTask.name === content.name && currentTask.type === content.type) {
                    // Extend current task
                    currentTask.endSlot = i + 1;
                    currentTask.endTime = formatTime(i + 1);
                } else {
                    // Push previous and start new
                    if (currentTask) result.push(currentTask);
                    currentTask = {
                        id: `${content.type}-${content.name}-${i}`, // Unique ID
                        name: content.name,
                        type: content.type,
                        startSlot: i,
                        endSlot: i + 1,
                        startTime: formatTime(i),
                        endTime: formatTime(i + 1),
                    };
                }
            } else {
                if (currentTask) {
                    result.push(currentTask);
                    currentTask = null;
                }
            }
        }
        if (currentTask) result.push(currentTask);

        return result;
    }, [weekPlan, habits, currentWeek, dayIdx]);

    // Format current date display
    const currentDateDisplay = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());

    const handleToggle = (taskId: string) => {
        toggleTask.mutate({ dayStr: currentDayStr, taskId });
    };

    const isTaskCompleted = (taskId: string) => (completedTasks || []).includes(taskId);

    // Calculate Points based on the Endowed Progress & Duration Multiplier Math
    const calculateTaskPoints = (task: TaskItem) => {
        const BASE_BONUS = 15;
        const HOURLY_WEIGHT = 20;

        // Slot duration difference (1 slot = 30 minutes = 0.5 hours)
        const durationHours = (task.endSlot - task.startSlot) * 0.5;

        return BASE_BONUS + (durationHours * HOURLY_WEIGHT);
    };

    const pointsData = useMemo(() => {
        let completedPoints = 0;
        let totalPoints = 0;

        tasks.forEach((task) => {
            const taskPoints = calculateTaskPoints(task);
            totalPoints += taskPoints;
            if (isTaskCompleted(task.id)) {
                completedPoints += taskPoints;
            }
        });

        return { completedPoints, totalPoints };
    }, [tasks, completedTasks]);

    return (
        <div className="flex flex-col h-full space-y-4 md:space-y-6 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Today's Plan</h1>
                <p className="text-sm md:text-base text-muted-foreground">{currentDateDisplay}</p>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="border-b bg-accent/20 pb-4">
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Daily Focus Dashboard</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4 md:p-6 bg-card/50">
                    {/* The Active Theme taking prime spot atop the content */}
                    {tasks.length > 0 && (
                        <ActiveTheme
                            completedPoints={pointsData.completedPoints}
                            totalPoints={pointsData.totalPoints}
                            completedTasksCount={(completedTasks || []).length}
                            totalTasksCount={tasks.length}
                            currentDayStr={currentDayStr}
                        />
                    )}

                    <div className="flex justify-between items-center pt-8 pb-4 mb-2 border-b">
                        <h2 className="text-xl font-bold">Your Tasks</h2>
                        <span className="text-sm font-medium text-muted-foreground bg-accent/30 px-3 py-1 rounded-full">
                            {(completedTasks || []).length} / {tasks.length} Completed
                        </span>
                    </div>
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <div className="p-4 bg-accent/30 rounded-full">
                                <Clock size={32} className="text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg">No Tasks for Today</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                You haven't scheduled any tasks or habits for today. Go to the Week Planner to set up your plan.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {tasks.map((task) => {
                                const completed = isTaskCompleted(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => handleToggle(task.id)}
                                        className={cn(
                                            "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                            completed
                                                ? "bg-accent/10 border-accent/20 opacity-70"
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0 flex items-center justify-center">
                                                {completed ? (
                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <Circle size={24} className="text-muted-foreground group-hover:text-primary transition-colors stroke-[1.5]" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "font-semibold text-base transition-all",
                                                    completed && "line-through text-muted-foreground"
                                                )}>
                                                    {task.name}
                                                </span>
                                                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/80 mt-1 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {task.startTime} - {task.endTime}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <span className={cn(
                                                "text-xs px-2.5 py-1 rounded-full font-medium border",
                                                task.type === 'habit' && "bg-muted/50 border-muted/20 text-muted-foreground",
                                                task.type === 'goal' && "bg-primary/10 border-primary/20 text-primary",
                                                task.type === 'custom' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                            )}>
                                                {task.type}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
