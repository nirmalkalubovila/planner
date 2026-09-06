import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useGetHabits, useGetWeekCompletedTasks, useGetWeekPlan } from '@llb/api';
import { WeekUtils, buildWidgetSnapshot } from '@llb/core';
import { writeWidgetSnapshot } from '@/widgets/widget-storage';
import { refreshAndroidWidgets } from '@/widgets/android/refresh-widgets';

/** Same last-35-days + current-week dayStrs construction as
 * use-user-stats.ts's fetchUserStatsCache, so the month heatmap has enough
 * history without an unbounded query. */
function buildDayStrs(): string[] {
  const today = new Date();
  const last35Days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today.getTime() - (34 - i) * 86400000);
    const weekKey = WeekUtils.getWeekFromDate(d);
    const dayNum = d.getDay() === 0 ? 7 : d.getDay();
    return `${weekKey}-${dayNum}`;
  });
  const currentWeek = WeekUtils.getCurrentWeek();
  const currentWeekDays = Array.from({ length: 7 }, (_, i) => `${currentWeek}-${i + 1}`);
  return Array.from(new Set([...last35Days, ...currentWeekDays]));
}

/** Mounted once (in (app)/_layout.tsx) — recomputes buildWidgetSnapshot()
 * whenever the underlying data changes and pushes it to both home-screen
 * widgets and the app icon badge. This is the only place that writes the
 * widget snapshot; native widget code only ever reads it back. */
export function useWidgetSync() {
  const currentWeek = WeekUtils.getCurrentWeek();
  const dayStrs = buildDayStrs();

  const { data: weekPlan } = useGetWeekPlan(currentWeek);
  const { data: habits } = useGetHabits();
  const { data: completedMap } = useGetWeekCompletedTasks(dayStrs);

  useEffect(() => {
    if (!completedMap) return;

    const snapshot = buildWidgetSnapshot({ weekPlan, habits, completedMap });
    writeWidgetSnapshot(snapshot);
    refreshAndroidWidgets();
    Notifications.setBadgeCountAsync(snapshot.today.remaining).catch(() => {});
  }, [weekPlan, habits, completedMap]);
}
