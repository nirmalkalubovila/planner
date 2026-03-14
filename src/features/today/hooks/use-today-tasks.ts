import { useMemo } from 'react';
import { format } from 'date-fns';
import { Habit } from '@/types/global-types';
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
}

const BASE_BONUS = 15;
const HOURLY_WEIGHT = 20;

export function calculateTaskPoints(task: TaskItem) {
    const durationHours = (task.endSlot - task.startSlot) * 0.5;
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
            if (habit) return { type: 'habit', name: habit.name };
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
