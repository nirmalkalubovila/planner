'use no memo';

// See today-momentum-widget.tsx: the React Compiler's memoization uses
// hooks, and these trees are translated to RemoteViews rather than rendered.

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { MonthWidgetData } from '@llb/core';
import { LABEL, WIDGET, contentHeight, contentWidth } from './widget-theme';

const DEEP_LINK = 'legacylifebuilder://statistics';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const COLUMNS = 7;
const MAX_ROWS = 6;
const HEADER_H = 18;
const WEEKDAY_ROW_H = 14;

/** "Month Streak" — streak stats beside a weekday-aligned calendar grid.
 *
 * Three things drive this layout:
 *  - The grid is padded with `firstDayOffset` blanks so the 1st lands in
 *    its real weekday column. It previously chunked days into rows of 7
 *    from day 1, so the columns meant nothing and no weekday heading was
 *    possible. Today's cell is outlined.
 *  - Stats sit to the LEFT of the grid rather than above it. A 7x6 grid is
 *    taller than it is wide, so stacking it under a header both overflowed
 *    the widget's minimum height and left a band of empty space down the
 *    right.
 *  - Cell size is derived from BOTH the available width and the available
 *    height (divided by however many weeks the month needs), not width
 *    alone — a widget resized taller previously kept the same small cells
 *    with dead space below the grid.
 */
export function MonthStreakWidget({
  data,
  widgetWidth,
  widgetHeight,
}: {
  data: MonthWidgetData | null;
  widgetWidth: number;
  widgetHeight: number;
}) {
  'use no memo'; // belt-and-braces with the file-level directive above

  const width = contentWidth(widgetWidth);
  const gridWidth = Math.round(width * 0.55);

  const cells: (number | null)[] = data
    ? [...Array.from({ length: data.firstDayOffset }, () => null), ...data.heatmap.map((_, i) => i)]
    : [];
  const rowCount = Math.min(MAX_ROWS, Math.max(1, Math.ceil(cells.length / COLUMNS)));

  const gap = 3;
  const cellFromWidth = Math.floor((gridWidth - gap * (COLUMNS - 1)) / COLUMNS);
  const gridAvailableHeight = contentHeight(widgetHeight) - HEADER_H - WEEKDAY_ROW_H;
  const cellFromHeight = Math.floor((gridAvailableHeight - gap * (rowCount - 1)) / rowCount);
  const cell = Math.max(9, Math.min(cellFromWidth, cellFromHeight));

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length && rows.length < MAX_ROWS; i += COLUMNS) {
    const row = cells.slice(i, i + COLUMNS);
    while (row.length < COLUMNS) row.push(null);
    rows.push(row);
  }

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: DEEP_LINK }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET.bg,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}
      >
        <TextWidget text={data ? data.monthLabel.toUpperCase() : 'MONTH'} style={LABEL} />
        <TextWidget
          text={data ? `${data.activeDays}/${data.daysInMonth} active` : ''}
          style={{ ...LABEL, letterSpacing: 0, color: WIDGET.silver }}
        />
      </FlexWidget>

      <FlexWidget
        style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={data && data.currentStreak > 0 ? '🔥' : ''}
            style={{ fontSize: 18, marginBottom: 2 }}
          />
          <TextWidget
            text={data ? `${data.currentStreak}` : '0'}
            style={{ fontSize: 30, color: WIDGET.text, fontWeight: 'bold' }}
          />
          <TextWidget text="DAY STREAK" style={{ ...LABEL, fontSize: 9 }} />
          <TextWidget
            text={data ? `Best ${data.longestStreak}` : ''}
            style={{ fontSize: 11, color: WIDGET.textFaint, marginTop: 6 }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column' }}>
          <FlexWidget style={{ flexDirection: 'row', marginBottom: 4 }}>
            {DAY_LABELS.map((label, idx) => (
              <FlexWidget
                key={idx}
                style={{
                  width: cell,
                  marginRight: idx === COLUMNS - 1 ? 0 : gap,
                  alignItems: 'center',
                }}
              >
                <TextWidget text={label} style={{ fontSize: 8, color: WIDGET.textFaint }} />
              </FlexWidget>
            ))}
          </FlexWidget>

          {rows.map((row, rowIdx) => (
            <FlexWidget key={rowIdx} style={{ flexDirection: 'row', marginBottom: gap }}>
              {row.map((dayIdx, colIdx) => {
                const isBlank = dayIdx === null;
                const done = !isBlank && (data?.heatmap[dayIdx] ?? false);
                const isToday = !isBlank && data?.todayIndex === dayIdx;
                return (
                  <FlexWidget
                    key={colIdx}
                    style={{
                      width: cell,
                      height: cell,
                      marginRight: colIdx === COLUMNS - 1 ? 0 : gap,
                      borderRadius: 4,
                      backgroundColor: isBlank ? WIDGET.bg : done ? WIDGET.done : WIDGET.track,
                      borderWidth: isToday ? 1 : 0,
                      borderColor: WIDGET.text,
                    }}
                  />
                );
              })}
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
