import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Bell, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { WeekUtils, getGoalColor, type GridState, type ReminderItem } from '@llb/core';
import { Text } from '@/components/ui/typography';
import { getBlockExtent, type MovingBlock } from '@/features/planner/hooks/use-planner-handlers';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS_PER_DAY = 48;

/** Web's grid is `h-10` (40px) rows in a `min-w-[700px]` CSS Grid of
 * `45px + 7×1fr`. Yoga has no CSS Grid, so this is the same table rebuilt
 * as fixed-width columns: identical row height and time-column width, with
 * a day width that shows ~3 days at once — what web's own mobile
 * breakpoint shows before scrolling. */
const ROW_HEIGHT = 40;
const TIME_COL_WIDTH = 45;
const DAY_COL_WIDTH = 104;
const HEADER_HEIGHT = 44;
const GRID_HEIGHT = ROW_HEIGHT * SLOTS_PER_DAY;
const CONTENT_WIDTH = DAY_COL_WIDTH * 7;

/** Resolved from @llb/tokens so the hot path can use plain StyleSheet
 * values instead of NativeWind class resolution (see PERF note below). */
const BORDER = '#242428';
const BORDER_SOFT = 'rgba(36,36,40,0.55)';
const MUTED_FG = '#a1a1ab';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  sleep: { bg: '#1e1b4b', text: '#a5b4fc' },
  plan: { bg: '#082f49', text: '#7dd3fc' },
  habit: { bg: '#022c22', text: '#34d399' },
  custom: { bg: '#f59e0b', text: '#ffffff' },
  goal: { bg: '#2563eb', text: '#ffffff' },
};

interface PlannerGridProps {
  currentWeek: string;
  setCurrentWeek: (val: string) => void;
  localGridState: GridState;
  isSleepSlot: (slotIdx: number) => boolean;
  getCellContent: (dayIdx: number, slotIdx: number) => any;
  handleCellClick: (dayIdx: number, slotIdx: number) => void;
  onCellLongPress: (dayIdx: number, slotIdx: number, silent?: boolean) => void;
  movingBlock: MovingBlock | null;
  canPlaceBlock: (targetDay: number, targetStart: number, block: MovingBlock) => boolean;
  onDropBlock: (targetDay: number, targetStart: number) => void;
  onCancelMove: () => void;
  onEditReminder: (reminder: ReminderItem) => void;
}

/** A run of consecutive slots sharing a type+name, drawn as ONE view. */
interface Block {
  startSlot: number;
  span: number;
  name: string;
  bg: string;
  text: string;
}

const EMPTY_REMINDERS: { reminder: ReminderItem; top: number }[] = [];

const styles = StyleSheet.create({
  hLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  vLine: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: BORDER },
  column: { position: 'absolute', top: 0, width: DAY_COL_WIDTH, height: GRID_HEIGHT },
  block: { position: 'absolute', left: 2, right: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  blockText: { fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center', includeFontPadding: false },
  timeCell: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  timeText: { fontSize: 9, fontWeight: '600', includeFontPadding: false },
  reminder: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 30 },
  reminderLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#f43f5e' },
  reminderDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  reminderChip: { flex: 1, marginLeft: 4, backgroundColor: '#4c0519', borderWidth: 1, borderColor: 'rgba(244,63,94,0.4)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  reminderText: { fontSize: 8, color: '#fecdd3', fontWeight: '900', textTransform: 'uppercase', includeFontPadding: false },
  ghost: { position: 'absolute', width: DAY_COL_WIDTH - 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, zIndex: 100, opacity: 0.92 },
  highlight: { position: 'absolute', width: DAY_COL_WIDTH, borderWidth: 2, borderRadius: 6, zIndex: 40 },
});

const DROP_OK = { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.18)' };
const DROP_BLOCKED = { borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.16)' };

interface DayColumnProps {
  dayIdx: number;
  blocks: Block[];
  reminders: { reminder: ReminderItem; top: number }[];
  isToday: boolean;
  movingSlot: number;
  onCellPress: (dayIdx: number, slotIdx: number) => void;
  onCellLongPress: (dayIdx: number, slotIdx: number, pageX: number, pageY: number) => void;
  onPressEnd: () => void;
  onEditReminder: (reminder: ReminderItem) => void;
}

/** PERF: one day is a single Pressable plus one view per contiguous BLOCK,
 * not 48 cells. A typical day has a handful of blocks, so the week went
 * from ~336 views (each running NativeWind class resolution every render)
 * to a few dozen with static StyleSheet values. The 30-minute rules are
 * drawn once behind all seven columns instead of per cell. */
const DayColumn = React.memo<DayColumnProps>(
  ({ dayIdx, blocks, reminders, isToday, movingSlot, onCellPress, onCellLongPress, onPressEnd, onEditReminder }) => {
    const slotFromY = (y: number) => {
      const idx = Math.floor(y / ROW_HEIGHT);
      return idx < 0 ? 0 : idx > SLOTS_PER_DAY - 1 ? SLOTS_PER_DAY - 1 : idx;
    };

    // `locationY` is measured against the touch TARGET, not the responder.
    // Blocks below are pointer-transparent, so this Pressable is always the
    // target and the value is a true offset within the day.
    const press = useRef({ y: 0, pageX: 0, pageY: 0 });

    return (
      <Pressable
        style={[styles.column, { left: dayIdx * DAY_COL_WIDTH }, isToday && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
        onPressIn={e => {
          press.current = {
            y: e.nativeEvent.locationY,
            pageX: e.nativeEvent.pageX,
            pageY: e.nativeEvent.pageY,
          };
        }}
        onPress={() => onCellPress(dayIdx, slotFromY(press.current.y))}
        onLongPress={() => onCellLongPress(dayIdx, slotFromY(press.current.y), press.current.pageX, press.current.pageY)}
        onPressOut={onPressEnd}
        delayLongPress={250}
      >
        {blocks.map(block => {
          const isMoving = movingSlot >= block.startSlot && movingSlot < block.startSlot + block.span;
          return (
            <View
              key={block.startSlot}
              pointerEvents="none"
              style={[
                styles.block,
                {
                  top: block.startSlot * ROW_HEIGHT + 1,
                  height: block.span * ROW_HEIGHT - 2,
                  backgroundColor: block.bg,
                  opacity: isMoving ? 0.35 : 1,
                },
              ]}
            >
              <RNText numberOfLines={block.span > 1 ? 3 : 2} style={[styles.blockText, { color: block.text }]}>
                {block.name}
              </RNText>
            </View>
          );
        })}

        {reminders.map(({ reminder, top }) => (
          <Pressable key={reminder.id} onPress={() => onEditReminder(reminder)} style={[styles.reminder, { top }]}>
            <View style={styles.reminderLine} />
            <View style={styles.reminderDot}>
              <Bell size={11} color="#fff" />
            </View>
            <View style={styles.reminderChip}>
              <RNText style={styles.reminderText} numberOfLines={1}>
                {reminder.time} - {reminder.name}
              </RNText>
            </View>
          </Pressable>
        ))}
      </Pressable>
    );
  }
);
DayColumn.displayName = 'DayColumn';

/** The 30-minute rules and day dividers, drawn once for the whole week. */
const GridLines = React.memo(() => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {Array.from({ length: SLOTS_PER_DAY }).map((_, i) => (
      <View
        key={i}
        style={[styles.hLine, { top: (i + 1) * ROW_HEIGHT - StyleSheet.hairlineWidth, backgroundColor: i % 2 === 1 ? BORDER : BORDER_SOFT }]}
      />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <View key={i} style={[styles.vLine, { left: (i + 1) * DAY_COL_WIDTH - StyleSheet.hairlineWidth }]} />
    ))}
  </View>
));
GridLines.displayName = 'GridLines';

export const PlannerGrid: React.FC<PlannerGridProps> = ({
  currentWeek,
  setCurrentWeek,
  localGridState,
  isSleepSlot,
  getCellContent,
  handleCellClick,
  onCellLongPress,
  movingBlock,
  canPlaceBlock,
  onDropBlock,
  onCancelMove,
  onEditReminder,
}) => {
  const rootRef = useRef<View>(null);
  const verticalRef = useRef<ScrollView>(null);
  const horizontalRef = useRef<ScrollView>(null);
  const headerScrollRef = useRef<ScrollView>(null);
  const [isTimeColumnVisible, setIsTimeColumnVisible] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const weekDates = useMemo(() => WeekUtils.getDaysForWeek(currentWeek), [currentWeek]);
  const todayString = new Date().toDateString();

  // Stable identities so DayColumn's memo actually holds — the handlers are
  // rebuilt on every render of the screen (createPlannerHandlers runs
  // inline), which would otherwise invalidate all 7 columns every time.
  const clickRef = useRef(handleCellClick);
  const longPressRef = useRef(onCellLongPress);
  const reminderRef = useRef(onEditReminder);
  const dropRef = useRef(onDropBlock);
  const cancelRef = useRef(onCancelMove);
  const canPlaceRef = useRef(canPlaceBlock);

  // ---- drag state (kept in refs / Animated so a drag causes NO re-render)
  const dragArmed = useRef(false);
  const dragGranted = useRef(false);
  /** The block currently in hand, mirrored into a ref so the gesture
   * callbacks can read it without waiting for a re-render. */
  const heldBlock = useRef<MovingBlock | null>(null);

  // All seven of the above used to be assigned inline during render, which
  // is a ref write in render phase. Doing it in a no-dep-array effect keeps
  // every one of them exactly as fresh for the consumers that matter: each
  // is only ever read from a gesture/press callback or a PanResponder
  // handler, and those can't fire until after this commit has flushed.
  useEffect(() => {
    clickRef.current = handleCellClick;
    longPressRef.current = onCellLongPress;
    reminderRef.current = onEditReminder;
    dropRef.current = onDropBlock;
    cancelRef.current = onCancelMove;
    canPlaceRef.current = canPlaceBlock;
    heldBlock.current = movingBlock;
  });
  const dropTarget = useRef<{ d: number; start: number; valid: boolean } | null>(null);
  const rootRect = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const bodyRect = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const scrollY = useRef(0);
  const scrollX = useRef(0);
  const autoScrollStep = useRef({ x: 0, y: 0 });
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // useState's lazy initializer rather than `useRef(...).current` — same
  // single stable instance for the component's life, without a ref read
  // during render.
  const [ghostXY] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [highlightXY] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [ghostLabel, setGhostLabel] = useState<{ name: string; bg: string; text: string; height: number } | null>(null);
  /** Flips only when the drop target crosses a validity boundary, not on
   * every move — so the red/green swap costs at most a shell re-render. */
  const [dropValid, setDropValid] = useState(true);

  const stableCellPress = useCallback((d: number, s: number) => clickRef.current(d, s), []);
  const stableEditReminder = useCallback((r: ReminderItem) => reminderRef.current(r), []);

  /** The touch that armed the drag ended. If the PanResponder never took
   * over, the user long-pressed and simply lifted — disarm, or the NEXT
   * scroll gesture would be captured as a drag. (Ordering is safe: the
   * responder grant sets dragGranted before terminating this Pressable,
   * which is what fires onPressOut.) The held block deliberately survives,
   * so the tap-to-place fallback still works. */
  const stablePressEnd = useCallback(() => {
    if (!dragGranted.current) dragArmed.current = false;
  }, []);

  const remindersByDay = useMemo(() => {
    const map = new Map<number, { reminder: ReminderItem; top: number }[]>();
    const list = (localGridState.reminders || []) as ReminderItem[];
    list.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      const slotIdx = h * 2 + (m >= 30 ? 1 : 0);
      // Same percentage-within-the-slot offset web uses for its pins.
      const top = slotIdx * ROW_HEIGHT + ((m % 30) / 30) * ROW_HEIGHT - 10;
      if (!map.has(r.dayIdx)) map.set(r.dayIdx, []);
      map.get(r.dayIdx)!.push({ reminder: r, top });
    });
    return map;
  }, [localGridState.reminders]);

  /** Collapse each day's 48 slots into contiguous blocks, once per change. */
  const weekBlocks = useMemo(() => {
    const columns: Block[][] = [];
    for (let d = 0; d < 7; d++) {
      const blocks: Block[] = [];
      let current: Block | null = null;
      let prev: any = null;
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        const content = getCellContent(d, s);
        const sameAsPrev = !!(content && prev && content.type === prev.type && content.name === prev.name);
        if (content && sameAsPrev && current) {
          current.span += 1;
        } else if (content) {
          const palette = TYPE_COLORS[content.type] || TYPE_COLORS.custom;
          const bg =
            content.type === 'goal'
              ? getGoalColor(content.goalId || content.name)
              : content.type === 'custom' && content.color
                ? content.color
                : palette.bg;
          current = { startSlot: s, span: 1, name: content.name, bg, text: palette.text };
          blocks.push(current);
        } else {
          current = null;
        }
        prev = content;
      }
      columns.push(blocks);
    }
    return columns;
  }, [getCellContent]);

  const blockAt = useCallback(
    (d: number, s: number) => weekBlocks[d]?.find(b => s >= b.startSlot && s < b.startSlot + b.span) || null,
    [weekBlocks]
  );

  const bodyViewRef = useRef<View>(null);

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y, w, h) => {
      rootRect.current = { x, y, w, h };
    });
  }, []);

  const measureBody = useCallback(() => {
    bodyViewRef.current?.measureInWindow((x, y, w, h) => {
      bodyRect.current = { x, y, w, h };
    });
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    autoScrollStep.current = { x: 0, y: 0 };
  }, []);

  // setDragActive/setGhostLabel are listed even though useState setters are
  // permanently stable: the React Compiler infers them as dependencies and
  // bails out of optimizing the whole component when the written list
  // disagrees with the inferred one. Naming them costs nothing at runtime.
  const endDrag = useCallback(() => {
    dragArmed.current = false;
    dragGranted.current = false;
    stopAutoScroll();
    setDragActive(false);
    setGhostLabel(null);
  }, [stopAutoScroll, setDragActive, setGhostLabel]);

  /** Finger position → the cell under it, in grid content coordinates. */
  const resolveTarget = useCallback(
    (pageX: number, pageY: number) => {
      const timeW = isTimeColumnVisible ? TIME_COL_WIDTH : 0;
      const relX = pageX - bodyRect.current.x - timeW + scrollX.current;
      const relY = pageY - bodyRect.current.y + scrollY.current;
      let d = Math.floor(relX / DAY_COL_WIDTH);
      let s = Math.floor(relY / ROW_HEIGHT);
      d = d < 0 ? 0 : d > 6 ? 6 : d;
      s = s < 0 ? 0 : s > SLOTS_PER_DAY - 1 ? SLOTS_PER_DAY - 1 : s;
      return { d, s };
    },
    [isTimeColumnVisible]
  );

  const updateDragVisuals = useCallback(
    (pageX: number, pageY: number) => {
      ghostXY.setValue({ x: pageX - rootRect.current.x - (DAY_COL_WIDTH - 8) / 2, y: pageY - rootRect.current.y - 24 });

      const block = heldBlock.current;
      const t = resolveTarget(pageX, pageY);

      // The finger holds the same part of the block it grabbed, so the
      // footprint is anchored off the grab offset rather than the finger.
      const rawStart = block ? t.s - block.grabOffset : t.s;
      const maxStart = SLOTS_PER_DAY - (block?.span ?? 1);
      const start = rawStart < 0 ? 0 : rawStart > maxStart ? maxStart : rawStart;

      const valid = block ? canPlaceRef.current(t.d, start, block) : false;
      const prev = dropTarget.current;
      // A tick each time the block snaps to a new slot, the way Calendar
      // marks every step of a drag.
      if (prev && (prev.d !== t.d || prev.start !== start)) haptics.snap();
      dropTarget.current = { d: t.d, start, valid };
      highlightXY.setValue({ x: t.d * DAY_COL_WIDTH, y: start * ROW_HEIGHT });
      setDropValid(p => (p === valid ? p : valid));

      // Edge auto-scroll, so a drag can reach hours and days that are
      // currently off-screen — web relies on the page scrolling for this.
      const EDGE = 70;
      const { x, y, w, h } = bodyRect.current;
      autoScrollStep.current = {
        x: pageX < x + EDGE ? -12 : pageX > x + w - EDGE ? 12 : 0,
        y: pageY < y + EDGE ? -12 : pageY > y + h - EDGE ? 12 : 0,
      };
    },
    [ghostXY, highlightXY, resolveTarget]
  );

  const beginDrag = useCallback(
    (d: number, s: number, pageX: number, pageY: number) => {
      // Extent comes from the grid state, not the rendered blocks, so a
      // task that happens to sit flush against a same-named habit can't
      // drag the habit along with it.
      const extent = getBlockExtent(localGridState, d, s);
      if (!extent) return;
      const painted = blockAt(d, s);

      // Mirror the held block synchronously — the gesture may start before
      // the state round-trip lands.
      heldBlock.current = {
        dayIdx: d,
        startSlot: extent.startSlot,
        span: extent.span,
        grabOffset: s - extent.startSlot,
        name: extent.name,
      };
      longPressRef.current(d, s, true); // sets movingBlock (also enables tap-to-place)
      dragArmed.current = true;
      // Cleared so the first updateDragVisuals of this drag can't read a
      // stale target and fire a snap tick right after the lift tick.
      dropTarget.current = null;
      // The lift tick — fired only once the block is confirmed movable, so
      // long-pressing empty space stays silent.
      haptics.lift();
      setGhostLabel({
        name: extent.name,
        bg: painted?.bg ?? TYPE_COLORS.custom.bg,
        text: painted?.text ?? TYPE_COLORS.custom.text,
        // The ghost shows true duration, capped so a sleep-length block
        // doesn't cover the screen while it follows the finger.
        height: Math.min(extent.span * ROW_HEIGHT, 96),
      });
      updateDragVisuals(pageX, pageY);
    },
    [blockAt, localGridState, updateDragVisuals, setGhostLabel]
  );

  // PanResponder.create() only stores these handlers; RN invokes them from
  // the touch pipeline, never during render. The compiler can't see through
  // that boundary, so it assumes any ref reachable from a function argument
  // might be read while rendering. There's no way to express "deferred
  // callback" here short of dropping PanResponder, and the drag path
  // depends on reading the refs at gesture time precisely so that a drag
  // causes no re-render.
  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- deferred gesture callbacks, see above
      PanResponder.create({
        // Capture phase: this runs BEFORE the ScrollViews get a say, which
        // is the only way to take a gesture away from them mid-touch.
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          dragArmed.current && heldBlock.current !== null && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
        onPanResponderGrant: () => {
          dragGranted.current = true;
          setDragActive(true);
          if (!autoScrollTimer.current) {
            autoScrollTimer.current = setInterval(() => {
              const step = autoScrollStep.current;
              if (step.y !== 0) {
                const next = Math.max(0, Math.min(GRID_HEIGHT - bodyRect.current.h, scrollY.current + step.y));
                verticalRef.current?.scrollTo({ y: next, animated: false });
              }
              if (step.x !== 0) {
                const maxX = CONTENT_WIDTH - (bodyRect.current.w - (isTimeColumnVisible ? TIME_COL_WIDTH : 0));
                const next = Math.max(0, Math.min(Math.max(0, maxX), scrollX.current + step.x));
                horizontalRef.current?.scrollTo({ x: next, animated: false });
              }
            }, 16);
          }
        },
        onPanResponderMove: (e, _g) => {
          updateDragVisuals(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
        onPanResponderRelease: () => {
          const target = dropTarget.current;
          // Always route through the drop handler — it re-validates and
          // owns the success/collision feedback, so the drag and the
          // tap-to-place path can't disagree about what is allowed.
          if (target) dropRef.current(target.d, target.start);
          else cancelRef.current();
          dropTarget.current = null;
          endDrag();
        },
        onPanResponderTerminate: () => {
          cancelRef.current();
          dropTarget.current = null;
          endDrag();
        },
      }),
    [endDrag, isTimeColumnVisible, updateDragVisuals]
  );

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  // If the move is resolved or cancelled elsewhere, disarm. This used to
  // also setGhostLabel(null) here; the ghost's visibility is now derived
  // from movingBlock at the render site below instead, so a stale label
  // simply isn't drawn and no state has to be cleared from an effect.
  useEffect(() => {
    if (!movingBlock) {
      dragArmed.current = false;
    }
  }, [movingBlock]);

  const onVerticalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  const onBodyHorizontalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x: scrollX.current, animated: false });
  };

  // Auto-scroll to the first non-sleep slot (wake time) on mount / week
  // change — mirrors web, which does the same and only on week change.
  useEffect(() => {
    let firstActiveSlot = 0;
    for (let i = 0; i < SLOTS_PER_DAY; i++) {
      if (!isSleepSlot(i)) {
        firstActiveSlot = i;
        break;
      }
    }
    const y = Math.max(0, firstActiveSlot * ROW_HEIGHT - 20);
    const id = setTimeout(() => verticalRef.current?.scrollTo({ y, animated: false }), 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  // Web keeps the time column in flow at `w-0` when hidden rather than
  // unmounting it, so the day columns never shift out from under the
  // header. Same trick here — width goes to 0, the element stays.
  const timeColWidth = isTimeColumnVisible ? TIME_COL_WIDTH : 0;

  /** Memoised so opening a dialog or dragging can't re-render 48 rows. */
  const timeColumn = useMemo(
    () => (
      <View style={{ width: timeColWidth, backgroundColor: '#000' }}>
        {isTimeColumnVisible &&
          Array.from({ length: SLOTS_PER_DAY }).map((_, slotIdx) => {
            const hour = Math.floor(slotIdx / 2);
            const min = (slotIdx % 2) * 30;
            const isHourStart = min === 0;
            return (
              <View key={slotIdx} style={[styles.timeCell, { borderBottomColor: isHourStart ? BORDER : BORDER_SOFT }]}>
                {/* Web labels every 30-minute slot, not just the hour. */}
                <RNText style={[styles.timeText, { color: isHourStart ? MUTED_FG : 'rgba(161,161,171,0.6)' }]}>
                  {`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`}
                </RNText>
              </View>
            );
          })}
      </View>
    ),
    [isTimeColumnVisible, timeColWidth]
  );

  const dayHeader = useMemo(
    () => (
      <View className="flex-row border-b border-border bg-card z-20">
        <View
          style={{ width: timeColWidth, height: HEADER_HEIGHT }}
          className={cn('bg-background items-center justify-center', isTimeColumnVisible && 'border-r border-border')}
        >
          {isTimeColumnVisible && (
            <Pressable onPress={() => setIsTimeColumnVisible(false)} className="w-full h-full items-center justify-center">
              <EyeOff size={12} color={MUTED_FG} />
            </Pressable>
          )}
        </View>

        <ScrollView ref={headerScrollRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {weekDates.map((date, dayIdx) => {
              const isToday = date.toDateString() === todayString;
              return (
                <View
                  key={dayIdx}
                  style={{ width: DAY_COL_WIDTH, height: HEADER_HEIGHT }}
                  className="items-center justify-center border-r border-border"
                >
                  <View className={cn('px-2 rounded-lg', isToday && 'bg-primary')}>
                    <Text
                      style={{ fontSize: 11, includeFontPadding: false }}
                      className={cn('font-bold uppercase tracking-widest', isToday ? 'text-primary-foreground' : 'text-foreground')}
                    >
                      {DAYS[dayIdx]}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, includeFontPadding: false }} className="text-muted-foreground mt-0.5">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Collapsed, the toggle has nowhere to live, so it floats over the
            first day column — web does exactly this. */}
        {!isTimeColumnVisible && (
          <Pressable
            onPress={() => setIsTimeColumnVisible(true)}
            style={{ position: 'absolute', left: 0, top: 0, height: HEADER_HEIGHT, width: 28 }}
            className="bg-background/95 border-r border-b border-border rounded-br-lg items-center justify-center z-30"
          >
            <Eye size={12} color={MUTED_FG} />
          </Pressable>
        )}
      </View>
    ),
    [isTimeColumnVisible, timeColWidth, weekDates, todayString, setIsTimeColumnVisible]
  );

  return (
    <View ref={rootRef} onLayout={measureRoot} className="flex-1 bg-card" {...panResponder.panHandlers}>
      {/* Week navigation — always visible above the grid, as on web. */}
      <View className="flex-row items-center justify-center py-1.5 border-b border-border/50">
        <Pressable
          onPress={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, -1))}
          className="h-8 w-8 items-center justify-center rounded-lg active:bg-muted/50"
        >
          <ChevronLeft size={16} color={MUTED_FG} />
        </Pressable>
        <Text className="text-xs font-bold px-3 min-w-[130px] text-center tracking-wider text-foreground/70">
          {WeekUtils.formatWeekDisplay(currentWeek)}
        </Text>
        <Pressable
          onPress={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, 1))}
          className="h-8 w-8 items-center justify-center rounded-lg active:bg-muted/50"
        >
          <ChevronRight size={16} color={MUTED_FG} />
        </Pressable>
      </View>

      {dayHeader}

      <View ref={bodyViewRef} className="flex-1" onLayout={measureBody}>
        <ScrollView
          ref={verticalRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dragActive}
          scrollEventThrottle={16}
          onScroll={onVerticalScroll}
        >
          <View className="flex-row">
            {timeColumn}

            <ScrollView
              ref={horizontalRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={!dragActive}
              scrollEventThrottle={16}
              onScroll={onBodyHorizontalScroll}
            >
              <View style={{ width: CONTENT_WIDTH, height: GRID_HEIGHT }}>
                <GridLines />

                {DAYS.map((_, dayIdx) => (
                  <DayColumn
                    key={dayIdx}
                    dayIdx={dayIdx}
                    blocks={weekBlocks[dayIdx]}
                    reminders={remindersByDay.get(dayIdx) || EMPTY_REMINDERS}
                    isToday={weekDates[dayIdx].toDateString() === todayString}
                    movingSlot={movingBlock && movingBlock.dayIdx === dayIdx ? movingBlock.startSlot : -1}
                    onCellPress={stableCellPress}
                    onCellLongPress={beginDrag}
                    onPressEnd={stablePressEnd}
                    onEditReminder={stableEditReminder}
                  />
                ))}

                {dragActive && !!movingBlock && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.highlight,
                      dropValid ? DROP_OK : DROP_BLOCKED,
                      // The outline is the block's real footprint, so you
                      // can see a 1.5h task won't fit in a 1h gap.
                      { height: movingBlock.span * ROW_HEIGHT, transform: highlightXY.getTranslateTransform() },
                    ]}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* The lifted block, following the finger. Driven entirely by
          Animated.setValue, so a drag triggers zero React renders.
          `movingBlock` gates it so the label left over from the last drag
          isn't drawn once the move is resolved or cancelled. */}
      {dragActive && !!movingBlock && !!ghostLabel && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { height: ghostLabel.height, backgroundColor: ghostLabel.bg, transform: ghostXY.getTranslateTransform() },
          ]}
        >
          <RNText numberOfLines={2} style={[styles.blockText, { color: ghostLabel.text }]}>
            {ghostLabel.name}
          </RNText>
        </Animated.View>
      )}
    </View>
  );
};
