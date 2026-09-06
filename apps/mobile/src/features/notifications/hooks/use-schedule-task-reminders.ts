import { useEffect } from 'react';
import { useGetHabits, useGetWeekPlan } from '@llb/api';
import { useNotificationStore } from '@llb/notifications';
import {
  DAYS_OF_WEEK,
  SLOTS_PER_DAY,
  TASK_LEAD_MINUTES,
  WeekUtils,
  scheduledItemKey,
  slotToTime,
  type Habit,
  type ReminderItem,
} from '@llb/core';
import { CHANNELS, cancelSource, scheduleAt } from '@/lib/push';

const SOURCE = 'task-starting';

/** How far ahead to keep local triggers armed. */
const HORIZON_DAYS = 3;

interface PlannedTask {
  identity: string;
  name: string;
  startTime: string;
  endTime: string;
  at: Date;
}

/**
 * Tier 1 — the 15-minute warning before every habit, goal task and custom
 * block. Uncapped and exact by policy: these are the notifications that
 * actually keep someone on their plan, so they are never batched, delayed
 * or dropped for budget.
 *
 * Scheduling covers a rolling 3-day horizon rather than just today. An
 * earlier pass scheduled only the current day while the server skips task
 * alerts for native devices — so a user who didn't open the app simply
 * stopped getting reminders. Local triggers survive app kills, so arming
 * three days out means an unopened app still fires correctly.
 *
 * Overdue alerts are deliberately absent: they belong to the evening
 * digest now.
 */
export function useScheduleTaskReminders() {
  const currentWeek = WeekUtils.getCurrentWeek();
  const nextWeek = WeekUtils.addWeeks(currentWeek, 1);
  const currentDayStr = WeekUtils.getCurrentDay();
  const todayIdx = parseInt(currentDayStr.split('-')[2], 10) - 1;

  const { data: thisWeekPlan } = useGetWeekPlan(currentWeek);
  const { data: nextWeekPlan } = useGetWeekPlan(nextWeek);
  const { data: habits } = useGetHabits();
  const preferences = useNotificationStore(s => s.preferences);

  useEffect(() => {
    (async () => {
      await cancelSource(SOURCE);
      if (!preferences.enabled || preferences.upcomingTasks === false) return;

      const now = new Date();
      const planned: PlannedTask[] = [];

      for (let offset = 0; offset < HORIZON_DAYS; offset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + offset);
        date.setHours(0, 0, 0, 0);

        // Walking past Sunday rolls into next week's grid.
        const absoluteDayIdx = todayIdx + offset;
        const dayIdx = absoluteDayIdx % 7;
        const plan = absoluteDayIdx > 6 ? nextWeekPlan : thisWeekPlan;
        const dayName = DAYS_OF_WEEK[dayIdx];
        const dateStr = date.toISOString().slice(0, 10);

        // Collapse contiguous slots into blocks, same rule the planner
        // grid uses to draw one bar for a multi-slot task.
        let current: { name: string; type: string; startSlot: number; endSlot: number } | null = null;
        const flush = () => {
          if (!current) return;
          const startTime = slotToTime(current.startSlot);
          const endTime = slotToTime(current.endSlot);
          const [h, m] = startTime.split(':').map(Number);
          const at = new Date(date);
          at.setHours(h, m - TASK_LEAD_MINUTES, 0, 0);
          planned.push({
            identity: scheduledItemKey(current.name, startTime, dayIdx),
            name: current.name,
            startTime,
            endTime,
            at,
          });
          current = null;
        };

        for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
          const cell = (plan || {})[`${dayIdx}-${slot}`];
          let content: { name: string; type: string } | undefined;

          if (cell && cell.type !== 'cleared') {
            content = { name: cell.name, type: cell.type };
          } else if (!cell) {
            const habit = (habits || []).find((h: Habit) => {
              const [hs, hsm] = h.startTime.split(':').map(Number);
              const [he, hem] = h.endTime.split(':').map(Number);
              const startSlot = hs * 2 + (hsm >= 30 ? 1 : 0);
              const endSlot = he * 2 + (hem >= 30 ? 1 : 0);
              const dayMatched = h.daysOfWeek?.includes(dayName) ?? true;
              const started = h.startDate ? h.startDate <= dateStr : true;
              const notEnded = h.endDate ? h.endDate >= dateStr : true;
              return dayMatched && started && notEnded && slot >= startSlot && slot < endSlot;
            });
            if (habit) content = { name: habit.name, type: 'habit' };
          }

          if (content) {
            if (current && current.name === content.name && current.type === content.type) {
              current.endSlot = slot + 1;
            } else {
              flush();
              current = { name: content.name, type: content.type, startSlot: slot, endSlot: slot + 1 };
            }
          } else {
            flush();
          }
        }
        flush();

        // Timed reminders pinned to this day of the grid.
        ((plan?.reminders || []) as ReminderItem[])
          .filter(r => r.dayIdx === dayIdx)
          .forEach(r => {
            const [h, m] = r.time.split(':').map(Number);
            const at = new Date(date);
            at.setHours(h, m - TASK_LEAD_MINUTES, 0, 0);
            planned.push({
              identity: scheduledItemKey(r.name, r.time, dayIdx),
              name: r.name,
              startTime: r.time,
              endTime: r.time,
              at,
            });
          });
      }

      // One notification per perceived item, even if the grid and the
      // saved library both produced it.
      const seen = new Set<string>();
      for (const task of planned) {
        if (seen.has(task.identity)) continue;
        seen.add(task.identity);

        await scheduleAt({
          source: SOURCE,
          id: task.identity,
          title: `${task.name} starts in ${TASK_LEAD_MINUTES} min`,
          body: `Scheduled for ${task.startTime} - ${task.endTime}`,
          date: task.at,
          channelId: CHANNELS.taskAlerts,
          actionUrl: '/today',
        });
      }
    })();
     
  }, [thisWeekPlan, nextWeekPlan, habits, todayIdx, preferences.enabled, preferences.upcomingTasks]);
}
