import { useMemo } from 'react';
import { format } from 'date-fns';
import { Habit, ReminderItem } from '@/types/global-types';
import { DAYS_OF_WEEK, SLOTS_PER_DAY } from '@/constants/scheduling';
import { slotToTime } from '@/utils/time';

export interface TaskItem {
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    startSlot: number;
    endSlot: number;
    isReminder?: boolean;
    description?: string;
}

const BASE_BONUS = 15;
const HOURLY_WEIGHT = 20;

export function calculateTaskPoints(task: TaskItem) {
    const durationHours = task.isReminder ? 0.5 : (task.endSlot - task.startSlot) * 0.5;
    return BASE_BONUS + (durationHours * HOURLY_WEIGHT);
}

export function useTodayTasks(
    weekPlan: Record<string, any> | undefined,
    habits: Habit[] | undefined,
    dayIdx: number,
    completedTasks: string[] | undefined,
) {
    const tasks = useMemo(() => {
        const result: TaskItem[] = [];
        let currentTask: TaskItem | null = null;

        const getCellContent = (slotIdx: number) => {
            const habit = (habits || []).find((h: Habit) => {
                const [hStartH, hStartM] = h.startTime.split(':').map(Number);
                const [hEndH, hEndM] = h.endTime.split(':').map(Number);
                const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
                const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);
                const currentDayName = DAYS_OF_WEEK[dayIdx];
                const todayDate = format(new Date(), 'yyyy-MM-dd');

                const isDayMatched = h.daysOfWeek?.includes(currentDayName) ?? true;
                const hasStarted = h.startDate ? h.startDate <= todayDate : true;
                const hasNotEnded = h.endDate ? h.endDate >= todayDate : true;

                return isDayMatched && hasStarted && hasNotEnded && slotIdx >= startSlot && slotIdx < endSlot;
            });
            if (habit) {
                const key = `${dayIdx}-${slotIdx}`;
                const customState = weekPlan?.[key];
                const description = (customState && (customState.type === 'habit' || !customState.type)) 
                    ? customState.description 
                    : habit.description;
                return { type: 'habit', name: habit.name, description };
            }
            return (weekPlan || {})[`${dayIdx}-${slotIdx}`];
        };

        for (let i = 0; i < SLOTS_PER_DAY; i++) {
            const content = getCellContent(i);

            if (content) {
                if (currentTask && currentTask.name === content.name && currentTask.type === content.type) {
                    currentTask.endSlot = i + 1;
                    currentTask.endTime = slotToTime(i + 1);
                } else {
                    if (currentTask) result.push(currentTask);
                    currentTask = {
                        id: `${content.type}-${content.name}-${i}`,
                        name: content.name,
                        type: content.type,
                        startSlot: i,
                        endSlot: i + 1,
                        startTime: slotToTime(i),
                        endTime: slotToTime(i + 1),
                        description: content.description,
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

        // Extract and map specific time reminders
        const dayReminders = ((weekPlan?.reminders || []) as ReminderItem[])
            .filter(r => r.dayIdx === dayIdx);

        const reminderTasks: TaskItem[] = dayReminders.map(r => {
            const [h, m] = r.time.split(':').map(Number);
            const slotIdx = h * 2 + (m >= 30 ? 1 : 0);
            return {
                id: r.id,
                name: r.name,
                type: 'reminder',
                startTime: r.time,
                endTime: r.time,
                startSlot: slotIdx,
                endSlot: slotIdx,
                isReminder: true,
                description: r.description,
            };
        });

        // Merge and sort chronologically by start time
        const timeToMin = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        return [...result, ...reminderTasks].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
    }, [weekPlan, habits, dayIdx]);

    const pointsData = useMemo(() => {
        let completedPoints = 0;
        let totalPoints = 0;

        tasks.forEach((task) => {
            const taskPoints = calculateTaskPoints(task);
            totalPoints += taskPoints;
            if ((completedTasks || []).includes(task.id)) {
                completedPoints += taskPoints;
            }
        });

        return { completedPoints, totalPoints };
    }, [tasks, completedTasks]);

    return { tasks, pointsData };
}
