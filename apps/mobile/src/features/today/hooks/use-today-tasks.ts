import { useMemo } from 'react';
import {
  calculateTaskPoints,
  deriveDayTasks,
  type Habit,
  type TaskItem,
} from '@llb/core';

export type { TaskItem };
export { calculateTaskPoints };

/** Thin useMemo wrapper around @llb/core's deriveDayTasks — the grid-slot
 * derivation logic itself now lives there (shared with buildWidgetSnapshot(),
 * which needs the exact same "what's due today" rules outside a React tree).
 * apps/web keeps its own separate copy of this hook. */
export function useTodayTasks(
  weekPlan: Record<string, any> | undefined,
  habits: Habit[] | undefined,
  dayIdx: number,
  completedTasks: string[] | undefined
) {
  const tasks = useMemo(() => deriveDayTasks(weekPlan, habits, dayIdx), [weekPlan, habits, dayIdx]);

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
