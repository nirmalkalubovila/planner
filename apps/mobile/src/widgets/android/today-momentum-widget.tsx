'use no memo';

// app.json turns on `reactCompiler`, which memoizes components — and
// memoization is implemented with hooks. These "components" are never
// rendered by React: react-native-android-widget walks the returned tree
// and translates it into Android RemoteViews, so any hook the compiler
// injects blows up as "Invalid Hook Call". Every file that builds widget
// JSX opts out.

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { TodayWidgetData } from '@llb/core';
import { LABEL, WIDGET, contentHeight, contentWidth, extraRowsFor } from './widget-theme';

const DEEP_LINK = 'legacylifebuilder://today';

// Rough heights (dp) of each fixed block, used to work out how many of the
// remaining tasks beyond the hero one actually fit — see the module doc.
const HEADER_H = 18;
const HERO_H = 46;
const FOOTER_H = 40;
const ROW_H = 22;
const ROW_GAP = 6;

/** "Today Momentum" — the next task as a hero line, as many of the
 * remaining tasks after it as the card's current height allows, and a real
 * progress bar.
 *
 * Two RemoteViews constraints shape this:
 *  - `justifyContent: 'space-between'` only spreads children if the row is
 *    `width: 'match_parent'`. Without it the row shrink-wraps and the two
 *    ends sit flush ("2 tasks left67%").
 *  - There's no scrolling FlexWidget and no percentage sizing, so "use the
 *    space" means computing, in dp, how many extra rows fit below the hero
 *    task once the header/hero/footer are accounted for — the user can
 *    resize this widget taller (`resizeMode` in app.json), and previously
 *    that just bought more empty card instead of more of today's list.
 */
export function TodayMomentumWidget({
  data,
  widgetWidth,
  widgetHeight,
}: {
  data: TodayWidgetData | null;
  widgetWidth: number;
  widgetHeight: number;
}) {
  'use no memo'; // belt-and-braces with the file-level directive above

  const barWidth = contentWidth(widgetWidth);
  const fillWidth = data ? Math.round((barWidth * Math.min(100, Math.max(0, data.progress))) / 100) : 0;

  const upcoming = data?.remainingTaskList ?? [];
  const hero = upcoming[0] ?? null;
  const rest = upcoming.slice(1);
  const usedHeight = HEADER_H + HERO_H + FOOTER_H;
  const extraRows = extraRowsFor(contentHeight(widgetHeight), usedHeight, ROW_H + ROW_GAP, rest.length);
  const listedRest = rest.slice(0, extraRows);
  const hiddenCount = rest.length - listedRest.length;

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
        <TextWidget text="TODAY" style={LABEL} />
        <TextWidget text={data?.dateLabel ?? ''} style={{ ...LABEL, letterSpacing: 0 }} />
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        {!data ? (
          <TextWidget text="Open the app to sync" style={{ fontSize: 13, color: WIDGET.textDim }} />
        ) : data.isComplete ? (
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget
              text="Day complete"
              style={{ fontSize: 20, color: WIDGET.done, fontWeight: 'bold' }}
            />
            <TextWidget
              text={`All ${data.total} tasks done — great work`}
              style={{ fontSize: 12, color: WIDGET.textDim }}
              maxLines={1}
              truncate="END"
            />
          </FlexWidget>
        ) : (
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
            <TextWidget
              text={hero?.name ?? 'Nothing scheduled'}
              style={{ fontSize: 19, color: WIDGET.text, fontWeight: 'bold' }}
              maxLines={1}
              truncate="END"
            />
            {!!hero?.time && (
              <TextWidget text={hero.time} style={{ fontSize: 12, color: WIDGET.silver, marginTop: 1 }} />
            )}

            {listedRest.length > 0 && (
              <FlexWidget
                style={{
                  width: 'match_parent',
                  flexDirection: 'column',
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: WIDGET.hairline,
                }}
              >
                {listedRest.map((task, idx) => (
                  <FlexWidget
                    key={idx}
                    style={{
                      width: 'match_parent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: idx === listedRest.length - 1 ? 0 : ROW_GAP,
                    }}
                  >
                    <TextWidget
                      text={task.name}
                      style={{ fontSize: 12, color: idx === 0 ? WIDGET.textDim : WIDGET.textFaint }}
                      maxLines={1}
                      truncate="END"
                    />
                    <TextWidget
                      text={task.time}
                      style={{ fontSize: 11, color: WIDGET.textFaint, marginLeft: 8 }}
                    />
                  </FlexWidget>
                ))}
                {hiddenCount > 0 && (
                  <TextWidget
                    text={`+${hiddenCount} more`}
                    style={{ fontSize: 10, color: WIDGET.textFaint, marginTop: ROW_GAP }}
                  />
                )}
              </FlexWidget>
            )}
          </FlexWidget>
        )}
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
        <FlexWidget
          style={{
            width: barWidth,
            height: 6,
            borderRadius: 3,
            backgroundColor: WIDGET.track,
            flexDirection: 'row',
          }}
        >
          {fillWidth > 0 && (
            <FlexWidget
              style={{
                width: fillWidth,
                height: 6,
                borderRadius: 3,
                backgroundColor: data?.isComplete ? WIDGET.done : WIDGET.text,
              }}
            />
          )}
        </FlexWidget>

        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 7,
          }}
        >
          <TextWidget
            text={data ? `${data.completed}/${data.total} done` : ''}
            style={{ fontSize: 11, color: WIDGET.textDim }}
          />
          <TextWidget
            text={data ? (data.remaining === 0 ? '100%' : `${data.remaining} left · ${data.progress}%`) : ''}
            style={{ fontSize: 11, color: WIDGET.text, fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
