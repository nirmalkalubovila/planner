import { WeekUtils } from './week';
import { computeStreakMetrics } from './milestone-engine';
import { calculateTaskPoints, deriveDayTasks } from './task-derivation';
import type { Habit } from '../types/domain';
import type { WidgetSnapshot } from '../types/widget';

export interface BuildWidgetSnapshotInput {
  /** Current week's grid state — the same shape deriveDayTasks/useTodayTasks
   * already consume. Only covers the active week, so "week" heatmap/biggest
   * task below are scoped to it (can't look at a different week's grid). */
  weekPlan: Record<string, any> | undefined;
  habits: Habit[] | undefined;
  /** dayStr ("YYYY-WW-D", D=1 Monday..7 Sunday) -> completed task ids.
   * Should span enough history to cover the month heatmap (up to ~31 days
   * back) for a meaningful "Month Streak" widget. */
  completedMap: Record<string, string[]>;
  now?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Built by hand rather than with date-fns/Intl: this runs inside the
 * Android widget's headless JS task, where a locale-formatted string would
 * cost an ICU bridge hop for a label that's read at a glance. */
function formatDateLabel(date: Date): string {
  return `${SHORT_DAY_NAMES[date.getDay()]}, ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function dayStrFor(date: Date): string {
  const weekKey = WeekUtils.getWeekFromDate(date);
  const dayNum = date.getDay() === 0 ? 7 : date.getDay();
  return `${weekKey}-${dayNum}`;
}

/** Composes the mobile home-screen widgets' data from the same primitives
 * the app screens already use — deriveDayTasks (today.tsx's grid logic) and
 * computeStreakMetrics (the milestone/statistics streak logic) — rather than
 * reimplementing "what's due today" or streak math a third time. Pure
 * function, no React/hooks: both the app (via a thin hook wrapper) and
 * native widget code (which has no React tree) can call this directly. */
export function buildWidgetSnapshot({
  weekPlan,
  habits,
  completedMap,
  now = new Date(),
}: BuildWidgetSnapshotInput): WidgetSnapshot {
  // Monday-first index (0=Monday..6=Sunday), matching DAYS_OF_WEEK/dayIdx
  // convention used throughout the planner grid.
  const todayDayIdx = (now.getDay() + 6) % 7;
  const todayDayStr = dayStrFor(now);
  const todayCompletedIds = completedMap[todayDayStr] ?? [];

  const todayTasks = deriveDayTasks(weekPlan, habits, todayDayIdx);
  const remainingTasks = todayTasks.filter((t) => !todayCompletedIds.includes(t.id));
  const completedCount = todayTasks.length - remainingTasks.length;
  const MAX_LISTED_TASKS = 8;

  const today: WidgetSnapshot['today'] = {
    dateLabel: formatDateLabel(now),
    remainingTaskList: remainingTasks.slice(0, MAX_LISTED_TASKS).map((t) => ({
      name: t.name,
      time: t.startTime,
    })),
    completed: completedCount,
    total: todayTasks.length,
    remaining: remainingTasks.length,
    progress: todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0,
    isComplete: todayTasks.length > 0 && remainingTasks.length === 0,
  };

  const weekHeatmap: boolean[] = [];
  const dailyTaskCounts: number[] = [];
  let biggestTaskName: string | null = null;
  let biggestTaskPoints = -Infinity;
  let tasksCompleted = 0;

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = new Date(now);
    date.setDate(now.getDate() - todayDayIdx + dayIdx);
    const dayStr = dayStrFor(date);
    const completedIds = completedMap[dayStr] ?? [];
    weekHeatmap.push(completedIds.length > 0);
    dailyTaskCounts.push(completedIds.length);
    tasksCompleted += completedIds.length;

    const dayTasks = deriveDayTasks(weekPlan, habits, dayIdx);
    for (const task of dayTasks) {
      if (!completedIds.includes(task.id)) continue;
      const points = calculateTaskPoints(task);
      if (points > biggestTaskPoints) {
        biggestTaskPoints = points;
        biggestTaskName = task.name;
      }
    }
  }

  const daysElapsed = todayDayIdx + 1;
  const completedDaysSoFar = weekHeatmap.slice(0, daysElapsed).filter(Boolean).length;

  const week: WidgetSnapshot['week'] = {
    heatmap: weekHeatmap,
    dailyTaskCounts,
    daysElapsed,
    completedDays: completedDaysSoFar,
    progress: Math.round((completedDaysSoFar / daysElapsed) * 100),
    biggestTaskName,
    tasksCompleted,
  };

  const { currentStreak, longestStreak } = computeStreakMetrics(completedMap);

  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthHeatmap: boolean[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const completedIds = completedMap[dayStrFor(date)] ?? [];
    monthHeatmap.push(completedIds.length > 0);
  }

  const monthData: WidgetSnapshot['month'] = {
    monthLabel: MONTH_NAMES[month],
    currentStreak,
    // Overall longest streak, not month-scoped — completedMap alone doesn't
    // carry enough to cheaply bound "longest streak within this month" and
    // the widget copy ("Best: N days") reads fine either way.
    longestStreak,
    heatmap: monthHeatmap,
    // Monday-first column for the 1st, so the grid's columns can line up
    // under weekday headings instead of always starting at Monday.
    firstDayOffset: (new Date(year, month, 1).getDay() + 6) % 7,
    todayIndex: now.getDate() - 1,
    activeDays: monthHeatmap.filter(Boolean).length,
    daysInMonth,
  };

  return { today, week, month: monthData };
}
