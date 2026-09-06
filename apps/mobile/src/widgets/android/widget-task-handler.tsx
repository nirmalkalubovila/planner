'use no memo';

// See today-momentum-widget.tsx: this file constructs widget JSX too, so it
// opts out of the React Compiler for the same reason.

import React from 'react';
import type { WidgetTaskHandler } from 'react-native-android-widget';
import { readWidgetSnapshot } from '@/widgets/widget-storage';
import { TodayMomentumWidget } from './today-momentum-widget';
import { WeekHeatmapWidget } from './week-heatmap-widget';
import { MonthStreakWidget } from './month-streak-widget';

/** Runs in a headless JS instance spun up by Android for widget
 * add/update/resize/click events — no React tree or React Query cache from
 * the foreground app exists here, so data comes only from the persisted
 * snapshot (see widget-storage.ts), never from hooks. Registered in
 * index.js, before requiring expo-router/entry.
 *
 * `widgetInfo.width`/`.height` are threaded into each widget because
 * RemoteViews has no percentage sizing — progress bars, heatmap cells, and
 * how many extra rows of "what's next" fit are all measured in dp against
 * the size the launcher actually gave the widget, which changes if the user
 * resizes it. */
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetInfo, renderWidget }) => {
  const snapshot = await readWidgetSnapshot();
  const { width, height } = widgetInfo;

  switch (widgetInfo.widgetName) {
    case 'TodayMomentum':
      renderWidget(
        <TodayMomentumWidget data={snapshot?.today ?? null} widgetWidth={width} widgetHeight={height} />
      );
      break;
    case 'WeekHeatmap':
      renderWidget(<WeekHeatmapWidget data={snapshot?.week ?? null} widgetWidth={width} />);
      break;
    case 'MonthStreak':
      renderWidget(
        <MonthStreakWidget data={snapshot?.month ?? null} widgetWidth={width} widgetHeight={height} />
      );
      break;
  }
};
