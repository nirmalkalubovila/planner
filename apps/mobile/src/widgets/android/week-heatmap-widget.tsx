'use no memo';

// See today-momentum-widget.tsx: the React Compiler's memoization uses
// hooks, and these trees are translated to RemoteViews rather than rendered.

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WeekWidgetData } from '@llb/core';
import { LABEL, WIDGET, contentWidth } from './widget-theme';

const DEEP_LINK = 'legacylifebuilder://statistics';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "Week Heatmap" — Mon–Sun completion, week progress, tasks done, and the
 * biggest win.
 *
 * Days that haven't happened yet render hollow rather than missed, so an
 * early-week glance doesn't read as four failures. Dot size grows with the
 * card's current width — previously it was fixed regardless of how far the
 * user stretched the widget, which left a resized widget mostly empty
 * space. The per-day count is always shown (it's one small text line);
 * `widgetHeight` isn't needed here the way the other two widgets need it.
 */
export function WeekHeatmapWidget({
  data,
  widgetWidth,
}: {
  data: WeekWidgetData | null;
  widgetWidth: number;
}) {
  'use no memo'; // belt-and-braces with the file-level directive above

  const barWidth = contentWidth(widgetWidth);
  const fillWidth = data ? Math.round((barWidth * Math.min(100, Math.max(0, data.progress))) / 100) : 0;
  // Dot size grows with available width, same as before, but now also
  // capped higher so a widget resized wide actually shows it.
  const dotSize = Math.max(16, Math.min(34, Math.floor(barWidth / 8)));

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
        <TextWidget text="THIS WEEK" style={LABEL} />
        <TextWidget
          text={data ? `${data.completedDays}/${data.daysElapsed} days` : ''}
          style={{ ...LABEL, letterSpacing: 0, color: WIDGET.silver }}
        />
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        <FlexWidget
          style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between' }}
        >
          {DAY_LABELS.map((label, idx) => {
            const done = data?.heatmap[idx] ?? false;
            const elapsed = data ? idx < data.daysElapsed : false;
            const count = data?.dailyTaskCounts[idx] ?? 0;
            return (
              <FlexWidget key={idx} style={{ flexDirection: 'column', alignItems: 'center' }}>
                <FlexWidget
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: Math.round(dotSize / 2),
                    backgroundColor: done ? WIDGET.done : elapsed ? WIDGET.track : WIDGET.bg,
                    borderWidth: done ? 0 : 1,
                    borderColor: elapsed ? WIDGET.track : WIDGET.hairline,
                  }}
                />
                <TextWidget
                  text={label}
                  style={{ fontSize: 9, color: elapsed ? WIDGET.textDim : WIDGET.textFaint, marginTop: 4 }}
                />
                <TextWidget
                  text={elapsed ? String(count) : '–'}
                  style={{ fontSize: 9, color: elapsed ? WIDGET.silver : WIDGET.textFaint, marginTop: 1 }}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>

        <FlexWidget
          style={{
            width: barWidth,
            height: 5,
            borderRadius: 3,
            backgroundColor: WIDGET.track,
            flexDirection: 'row',
            marginTop: 12,
          }}
        >
          {fillWidth > 0 && (
            <FlexWidget
              style={{ width: fillWidth, height: 5, borderRadius: 3, backgroundColor: WIDGET.done }}
            />
          )}
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: WIDGET.hairline,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="BIGGEST WIN" style={{ ...LABEL, fontSize: 9 }} />
          <TextWidget
            text={data?.biggestTaskName ?? 'No wins logged yet'}
            style={{ fontSize: 13, color: WIDGET.text, fontWeight: 'bold', marginTop: 2 }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget
            text={data ? `${data.progress}%` : ''}
            style={{ fontSize: 17, color: WIDGET.done, fontWeight: 'bold' }}
          />
          <TextWidget
            text={data ? `${data.tasksCompleted} tasks` : ''}
            style={{ fontSize: 10, color: WIDGET.textFaint }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
