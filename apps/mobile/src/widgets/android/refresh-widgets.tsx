'use no memo';

// See today-momentum-widget.tsx: this file constructs widget JSX too, so it
// opts out of the React Compiler for the same reason.

import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate, type WidgetInfo } from 'react-native-android-widget';
import { readWidgetSnapshot } from '@/widgets/widget-storage';
import { TodayMomentumWidget } from './today-momentum-widget';
import { WeekHeatmapWidget } from './week-heatmap-widget';
import { MonthStreakWidget } from './month-streak-widget';

const WIDGET_RENDERERS = {
  TodayMomentum: async (info: WidgetInfo) => {
    const snapshot = await readWidgetSnapshot();
    return (
      <TodayMomentumWidget data={snapshot?.today ?? null} widgetWidth={info.width} widgetHeight={info.height} />
    );
  },
  WeekHeatmap: async (info: WidgetInfo) => {
    const snapshot = await readWidgetSnapshot();
    return <WeekHeatmapWidget data={snapshot?.week ?? null} widgetWidth={info.width} />;
  },
  MonthStreak: async (info: WidgetInfo) => {
    const snapshot = await readWidgetSnapshot();
    return (
      <MonthStreakWidget data={snapshot?.month ?? null} widgetWidth={info.width} widgetHeight={info.height} />
    );
  },
} as const;

/** Forces an immediate re-render of every added widget instance right after
 * the foreground app writes a fresh snapshot, rather than waiting for the
 * ~30min native timeline refresh (app.json's updatePeriodMillis) — no-op if
 * the launcher has no widgets from this app added, and no-op on iOS
 * (Android-only library). */
export function refreshAndroidWidgets() {
  if (Platform.OS !== 'android') return;

  for (const widgetName of Object.keys(WIDGET_RENDERERS) as (keyof typeof WIDGET_RENDERERS)[]) {
    requestWidgetUpdate({
      widgetName,
      renderWidget: WIDGET_RENDERERS[widgetName],
    }).catch(() => {});
  }
}
