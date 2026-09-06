export interface UpcomingTask {
  name: string;
  time: string;
}

export interface TodayWidgetData {
  /** e.g. "Wed, Aug 27" — the widgets have no other date context. */
  dateLabel: string;
  /** Remaining tasks in start-time order. `remainingTaskList[0]` is "next" —
   * the widget decides at render time how many of these fit, based on how
   * tall the user has resized it. Capped at 8: nothing realistically fits
   * more than that, and the snapshot writer already knows it, so no widget
   * needs to grow its own longer copy of this. */
  remainingTaskList: UpcomingTask[];
  completed: number;
  total: number;
  remaining: number;
  progress: number; // 0-100
  isComplete: boolean;
}

export interface WeekWidgetData {
  /** Monday-first, index 0 = Monday .. 6 = Sunday. */
  heatmap: boolean[];
  /** Tasks completed each day, same Monday-first order as `heatmap` — the
   * count behind each dot, shown once the widget is tall enough for it. */
  dailyTaskCounts: number[];
  /** How many of the 7 days have elapsed (today included), so the widget can
   * dim the days that haven't happened yet rather than showing them missed. */
  daysElapsed: number;
  completedDays: number;
  progress: number; // 0-100, completed days / days elapsed so far this week
  biggestTaskName: string | null;
  /** Tasks completed across the whole week so far. */
  tasksCompleted: number;
}

export interface MonthWidgetData {
  /** e.g. "August" */
  monthLabel: string;
  currentStreak: number;
  longestStreak: number;
  /** One entry per day of the current month, true if any task was completed. */
  heatmap: boolean[];
  /** Weekday column the 1st falls in, Monday-first (0 = Monday .. 6 = Sunday).
   * Without this the grid can't line its columns up with weekday headings —
   * day 1 would always be drawn in the Monday column. */
  firstDayOffset: number;
  /** Index of today within `heatmap`, so it can be marked. */
  todayIndex: number;
  activeDays: number;
  daysInMonth: number;
}

export interface WidgetSnapshot {
  today: TodayWidgetData;
  week: WeekWidgetData;
  month: MonthWidgetData;
}
