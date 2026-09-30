// supabase/functions/mcp/index.ts
// Exposes this planner to Claude (or any MCP-capable AI app) as a custom
// connector, so a normal chat in the Claude app can read and change the
// user's real goals, habits and weekly grid.
//
// AUTH: a per-user secret, presented either as a request header
//   X-Connector-Token: <token>        (preferred -- never lands in a URL)
// or, as a fallback, in the URL path:
//   https://<ref>.supabase.co/functions/v1/mcp/<token>
//
// The header form is better precisely because the URL isn't a secret: URLs
// get screenshotted, pasted and written to request logs, headers much less
// so. Both are accepted so an already-pasted link keeps working.
//
// Only the SHA-256 hash of the token is stored (see the
// mcp_connector_tokens migration), so the database never holds anything
// that can be replayed as a working link. The token resolves to exactly
// one user_id, and every query below is filtered by it -- there is no code
// path that can reach another user's rows.
//
// Deploy with:  supabase functions deploy mcp --no-verify-jwt
// (--no-verify-jwt is REQUIRED: Claude has no Supabase JWT to send. The
// path token is the entire authentication story, which is why it is
// high-entropy, hashed at rest, and revocable from Settings.)

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  breakdownLevels, getMilestoneDates, getMilestonePeriods, getMonthPeriods, getWeekPeriods, parseISODate, pickCurrentIndex, todayISO,
  type Period,
} from "./breakdown.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-protocol-version, mcp-session-id, x-connector-token",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
};

const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "legacy-life-builder-planner", version: "1.1.0" };

// Returned to Claude when it connects, so the planning rules apply to every chat without the user repeating them.
const INSTRUCTIONS = `You plan goals, habits and weeks for the user of Legacy Life Builder. Follow these rules every time.

1. EVERY goal, habit and scheduled task belongs to exactly one life bucket: income (paid work, clients), asset (skills, content, learning, side projects), recovery (sleep, rest, exercise, health) or relational (family, friends, real connection). Always pass "bucket". Never create anything without one. place_task may omit it only when goalId is given, and then inherits the goal's bucket.
2. Break every goal down by its type, from the top level to weeks:
   - Year goal: years, then the months of every year, then the weeks of the current month.
   - Month goal: months, then the weeks of the current month.
   - Week goal: weeks only.
   Pass this as "plans" (nested "children"). Counts must match the dates exactly. If create_goal rejects a count, fix it and call again.
3. Weeks of future months are filled in later, automatically, when those months arrive. Do not invent them now.
4. Before scheduling, call get_week_plan and never place work over sleep or habits. Keep the user's hour budget realistic.
5. When you plan a week, set BOTH levels: 1-3 weekly outcomes (set_weekly_outcomes), then exactly one outcome for each day that matters (set_daily_outcomes, or the dailyOutcomes field of set_weekly_outcomes), each linked to the weekly outcome it advances with contributesTo.
6. Read before you write: call get_goals and get_habits first, reuse existing goals instead of creating duplicates, and keep buckets consistent with what the user already chose.`;

// ─── Date / week / slot helpers ────────────────────────────────
// These mirror WeekUtils in @llb/core exactly. They're restated here
// because Deno can't consume the npm workspace symlink -- the same reason
// send-push-notifications restates the notification tier rules.

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || "").trim());
  if (!m) throw new Error(`Invalid date "${s}" -- expected YYYY-MM-DD`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateToWeekStr(d: Date): string {
  const year = d.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const days = Math.floor((d.getTime() - startOfYear) / 86400000);
  const startDay = new Date(startOfYear).getUTCDay() || 7;
  const week = Math.ceil((days + startDay) / 7);
  return `${year}-${String(week).padStart(2, "0")}`;
}

function dateToDayIdx(d: Date): number {
  return (d.getUTCDay() + 6) % 7; // Monday = 0, matching the grid's "<dayIdx>-<slotIdx>" keys
}

function getDaysForWeek(weekStr: string): Date[] {
  const [year, week] = weekStr.split("-").map(Number);
  const startOfYear = Date.UTC(year, 0, 1);
  const startDay = new Date(startOfYear).getUTCDay() || 7;
  const startOfWeek = Date.UTC(year, 0, 1 + (week - 1) * 7 - (startDay - 1));
  return Array.from({ length: 7 }, (_, i) => new Date(startOfWeek + i * 86400000));
}

/** Must byte-match WeekUtils.formatWeekDisplay -- it IS the week_plans.week key. */
function formatWeekDisplay(weekStr: string): string {
  const dates = getDaysForWeek(weekStr);
  const start = dates[0];
  const end = dates[6];
  const y1 = start.getUTCFullYear();
  const y2 = end.getUTCFullYear();
  const left = `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}${y1 !== y2 ? `, ${y1}` : ""}`;
  return `${left} - ${MONTHS[end.getUTCMonth()]} ${end.getUTCDate()}, ${y2}`;
}

function timeToSlot(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
  if (!m) throw new Error(`Invalid time "${t}" -- expected HH:mm`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Invalid time "${t}"`);
  return h * 2 + (min >= 30 ? 1 : 0);
}

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2) % 24;
  return `${String(h).padStart(2, "0")}:${slot % 2 ? "30" : "00"}`;
}

/** Exclusive end slot, so 09:00-10:00 covers slots 18 and 19. */
function timeToEndSlot(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
  if (!m) throw new Error(`Invalid time "${t}" -- expected HH:mm`);
  return Math.ceil((Number(m[1]) * 60 + Number(m[2])) / 30);
}

// ─── Buckets ───────────────────────────────────────────────────

const BUCKETS = ["income", "asset", "recovery", "relational"] as const;
type Bucket = typeof BUCKETS[number];
const BUCKET_HELP = "income (paid work), asset (skills, content, learning), recovery (sleep, rest, exercise, health) or relational (family, friends)";

function parseBucket(value: unknown, what: string): Bucket {
  if (typeof value === "string" && (BUCKETS as readonly string[]).includes(value)) return value as Bucket;
  throw new Error(`Every ${what} needs a life bucket: ${BUCKET_HELP}. Got ${value === undefined ? "nothing" : JSON.stringify(value)}.`);
}

/** Copies a bucket onto a whole plan tree (used when a goal's bucket changes). */
function applyBucket(plans: any[], bucket: Bucket): any[] {
  return (plans || []).map((p) => ({ ...p, bucket, ...(p.subPlans ? { subPlans: applyBucket(p.subPlans, bucket) } : {}) }));
}

// ─── Goal breakdown: years -> months -> weeks ──────────────────

interface PlanNode { title?: string; description?: string; estimatedHours?: number; children?: PlanNode[] }

function nodeToSlot(node: PlanNode, date: string, period: { start: string; end: string }, bucket: Bucket, where: string) {
  if (!node || typeof node.title !== "string" || !node.title.trim()) throw new Error(`${where} needs a "title".`);
  const hours = Number(node.estimatedHours);
  return {
    date,
    dayTask: node.title.trim(),
    description: String(node.description ?? "").trim(),
    ...(Number.isFinite(hours) && hours > 0 ? { estimatedHours: hours } : {}),
    periodStart: period.start,
    periodEnd: period.end,
    bucket,
  };
}

const describePeriods = (periods: Period[]) => periods.map((p, i) => `${i + 1}. ${p.label} (${p.start} to ${p.end})`).join("; ");

function expectCount(where: string, unit: string, periods: Period[], got: number) {
  if (got !== periods.length) {
    throw new Error(`${where} must have exactly ${periods.length} ${unit} but ${got} were given. Expected: ${describePeriods(periods)}.`);
  }
}

/**
 * Validates Claude's nested plan against the goal's real dates and turns it into the stored plans tree.
 * Rolling rule: every year gets its months; only the current month must get its weeks (others are optional).
 */
function buildPlans(goalType: string, startDate: string, milestoneDates: string[], nodes: PlanNode[], bucket: Bucket) {
  const tops = getMilestonePeriods(startDate, milestoneDates);
  const unit = goalType === "Year" ? "years" : goalType === "Month" ? "months" : "weeks";
  if (!Array.isArray(nodes) || nodes.length !== tops.length) {
    throw new Error(`"plans" must have exactly ${tops.length} ${unit} (one per milestone) but ${Array.isArray(nodes) ? nodes.length : 0} were given. Expected: ${describePeriods(tops.map((t) => ({ ...t, label: t.end })))}.`);
  }

  const today = todayISO();
  const curTop = pickCurrentIndex(tops, today);
  let curMonthIdx = -1;

  // Which month is "current" depends on the current year's month periods
  if (goalType === "Year") curMonthIdx = pickCurrentIndex(getMonthPeriods(tops[curTop].start, tops[curTop].end), today);

  return nodes.map((node, i) => {
    const top = nodeToSlot(node, milestoneDates[i], tops[i], bucket, `Phase ${i + 1} ("plans[${i}]")`) as any;
    const levels = breakdownLevels(goalType as any);
    if (levels.length === 0) {
      if (node.children?.length) throw new Error("A Week goal is already at week level: remove the children.");
      return top;
    }

    if (goalType === "Year") {
      const months = getMonthPeriods(tops[i].start, tops[i].end);
      const kids = node.children || [];
      expectCount(`Year ${i + 1} ("plans[${i}].children")`, "months", months, kids.length);
      top.subPlans = kids.map((m, j) => {
        const slot = nodeToSlot(m, months[j].label, months[j], bucket, `Month ${j + 1} of year ${i + 1}`) as any;
        const weeks = getWeekPeriods(months[j].start, months[j].end);
        const isCurrent = i === curTop && j === curMonthIdx;
        const wk = m.children || [];
        if (wk.length > 0 || isCurrent) {
          expectCount(`${months[j].label} ("plans[${i}].children[${j}].children")`, "weeks", weeks, wk.length);
          slot.subPlans = wk.map((w, k) => nodeToSlot(w, weeks[k].label, weeks[k], bucket, `Week ${k + 1} of ${months[j].label}`));
        }
        return slot;
      });
    } else {
      // Month goal: the top phases are months, their children are weeks (required for the current month only)
      const weeks = getWeekPeriods(tops[i].start, tops[i].end);
      const isCurrent = i === curTop;
      const wk = node.children || [];
      if (wk.length > 0 || isCurrent) {
        expectCount(`Month ${i + 1} ("plans[${i}].children")`, "weeks", weeks, wk.length);
        top.subPlans = wk.map((w, k) => nodeToSlot(w, weeks[k].label, weeks[k], bucket, `Week ${k + 1} of month ${i + 1}`));
      }
    }
    return top;
  });
}

interface DailyOutcomeInput { date?: string; text?: string; contributesTo?: number }

/**
 * Writes day outcomes into bucket_actions.dailyWins, keyed the way the app keys them ("<week>-<1..7>").
 * Anything the app stored on a day (completed, linked item) is kept. One outcome per day.
 */
function applyDailyOutcomes(existing: Record<string, any> | undefined, weekStr: string, items: DailyOutcomeInput[], weeklyCount: number) {
  const dates = getDaysForWeek(weekStr).map(dateStr);
  const wins: Record<string, any> = { ...(existing || {}) };
  const seen = new Set<string>();
  for (const item of items || []) {
    const text = typeof item?.text === "string" ? item.text.trim() : "";
    if (!text) throw new Error("Every daily outcome needs text.");
    const iso = String(item.date ?? "");
    const idx = dates.indexOf(iso);
    if (idx === -1) throw new Error(`Daily outcome date "${iso}" is not in this week (${dates[0]} to ${dates[6]}).`);
    if (seen.has(iso)) throw new Error(`Only one outcome per day: ${iso} was given twice.`);
    seen.add(iso);
    let contributesToKey: string | undefined;
    if (item.contributesTo !== undefined) {
      const n = Number(item.contributesTo);
      if (!Number.isInteger(n) || n < 1 || n > 3 || n > weeklyCount) {
        throw new Error(weeklyCount === 0
          ? "Set the weekly outcomes first, then link each day to one with contributesTo."
          : `contributesTo must be a weekly outcome number from 1 to ${weeklyCount}.`);
      }
      contributesToKey = `p${n}`;
    }
    const key = `${weekStr}-${idx + 1}`;
    wins[key] = { ...(wins[key] || {}), text, ...(contributesToKey ? { contributesToKey } : {}) };
  }
  return wins;
}

/** A compact outline of a stored plan so Claude can see what exists and what is still missing. */
function outlinePlans(plans: any[] | null) {
  return (plans || []).map((p) => ({
    phase: p.dayTask,
    period: p.periodStart && p.periodEnd ? `${p.periodStart} to ${p.periodEnd}` : p.date,
    hours: p.estimatedHours ?? null,
    breakdown: (p.subPlans || []).length
      ? (p.subPlans as any[]).map((c) => ({
          phase: c.dayTask,
          period: c.periodStart && c.periodEnd ? `${c.periodStart} to ${c.periodEnd}` : c.date,
          weeks: (c.subPlans || []).length || "not planned yet (filled automatically when the month arrives)",
        }))
      : "not broken down yet",
  }));
}

// ─── Grid reading / writing ────────────────────────────────────

interface PlanSlot {
  type: string;
  name: string;
  goalId?: string;
  description?: string;
  bucket?: string;
}

/** Collapses a day's filled slots into contiguous blocks. */
function blocksForDay(state: Record<string, any>, dayIdx: number) {
  const blocks: { start: string; end: string; name: string; type: string; description?: string; bucket?: string }[] = [];
  let runStart = -1;
  let run: PlanSlot | null = null;

  const flush = (endSlot: number) => {
    if (runStart >= 0 && run) {
      blocks.push({
        start: slotToTime(runStart),
        end: slotToTime(endSlot),
        name: run.name,
        type: run.type,
        ...(run.description ? { description: run.description } : {}),
        ...(run.bucket ? { bucket: run.bucket } : {}),
      });
    }
    runStart = -1;
    run = null;
  };

  for (let slot = 0; slot < 48; slot++) {
    const cell = state?.[`${dayIdx}-${slot}`] as PlanSlot | undefined;
    const active = cell && cell.type !== "cleared" && cell.name ? cell : undefined;
    if (active) {
      if (run && active.name === run.name && active.type === run.type) continue;
      flush(slot);
      runStart = slot;
      run = active;
    } else {
      flush(slot);
    }
  }
  flush(48);
  return blocks;
}

/** The contiguous run of identical slots containing `slot`, or null. */
function findBlockRange(state: Record<string, any>, dayIdx: number, slot: number) {
  const target = state[`${dayIdx}-${slot}`] as PlanSlot | undefined;
  if (!target || !target.name) return null;
  let start = slot;
  while (start > 0) {
    const prev = state[`${dayIdx}-${start - 1}`] as PlanSlot | undefined;
    if (prev && prev.name === target.name && prev.type === target.type) start--;
    else break;
  }
  let end = slot;
  while (end < 47) {
    const next = state[`${dayIdx}-${end + 1}`] as PlanSlot | undefined;
    if (next && next.name === target.name && next.type === target.type) end++;
    else break;
  }
  return { start, end, slot: target };
}

/**
 * Read-modify-write against week_plans with the same optimistic-concurrency
 * stamp the web app uses (week_plans.updated_at, maintained by trigger), so
 * a change made here can't silently clobber one made in an open planner tab
 * a second earlier. One retry, then it gives up rather than overwrite.
 */
async function mutateWeekState<T>(
  admin: any,
  userId: string,
  weekStr: string,
  mutate: (state: Record<string, any>) => T,
): Promise<T> {
  const dbWeekKey = formatWeekDisplay(weekStr);

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: row, error: readErr } = await admin
      .from("week_plans")
      .select("state, updated_at")
      .eq("user_id", userId)
      .eq("week", dbWeekKey)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    const state = ((row?.state as Record<string, any>) || {});
    const result = mutate(state); // may throw (e.g. slot occupied) -- that's intended

    if (!row) {
      const { error } = await admin
        .from("week_plans")
        .insert({ user_id: userId, week: dbWeekKey, state });
      if (!error) return result;
      // Lost an insert race -- fall through and retry as an update.
    } else {
      const { data: updated, error } = await admin
        .from("week_plans")
        .update({ state })
        .eq("user_id", userId)
        .eq("week", dbWeekKey)
        .eq("updated_at", row.updated_at)
        .select("id");
      if (error) throw new Error(error.message);
      if (updated && updated.length > 0) return result;
      // Zero rows updated -- someone wrote first. Re-read and retry.
    }
  }
  throw new Error("That week was being edited somewhere else at the same time. Nothing was changed -- try again.");
}

function sleepBusySlots(sleepStart: string, sleepDuration: string): Set<number> {
  const busy = new Set<number>();
  try {
    const startSlot = timeToSlot(sleepStart);
    const hours = Number(sleepDuration) || 8;
    for (let i = 0; i < Math.round(hours * 2); i++) busy.add((startSlot + i) % 48);
  } catch {
    // Unparseable profile values just mean no sleep blocking.
  }
  return busy;
}

function habitsOnDay(habits: any[], dayIdx: number, onDate: string) {
  return (habits || []).filter((h) => {
    const days = h.daysOfWeek || [];
    const dayMatches = days.length === 0 ||
      days.includes(DAY_NAMES[dayIdx]) || days.includes(SHORT_DAY_NAMES[dayIdx]);
    const started = h.startDate ? h.startDate <= onDate : true;
    const notEnded = h.endDate ? h.endDate >= onDate : true;
    return dayMatches && started && notEnded;
  });
}

// ─── Tool definitions ──────────────────────────────────────────

const DATE_PROP = { type: "string", description: "Calendar date as YYYY-MM-DD" };
const TIME_PROP = { type: "string", description: "24-hour time as HH:mm, on a 30-minute grid" };

const DAILY_OUTCOMES_PROP = {
  type: "array",
  description: "One outcome per day: the single result that makes that day a win. Link each to the weekly outcome it advances.",
  items: {
    type: "object",
    properties: {
      date: DATE_PROP,
      text: { type: "string", description: "Concrete and finishable in a day" },
      contributesTo: { type: "integer", minimum: 1, maximum: 3, description: "Which weekly outcome this advances: 1, 2 or 3 (the order given to set_weekly_outcomes)" },
    },
    required: ["date", "text"],
    additionalProperties: false,
  },
};

const BUCKET_PROP = {
  type: "string",
  enum: ["income", "asset", "recovery", "relational"],
  description: "Life bucket: income (paid work, clients), asset (skills, content, learning, side projects), recovery (sleep, rest, exercise, health) or relational (family, friends).",
};

const PLAN_LEAF = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short, concrete and measurable" },
    description: { type: "string" },
    estimatedHours: { type: "number", description: "Realistic hours for this period" },
  },
  required: ["title"],
};
const PLAN_MID = { ...PLAN_LEAF, properties: { ...PLAN_LEAF.properties, children: { type: "array", items: PLAN_LEAF, description: "The next level down" } } };
const PLAN_TOP = { ...PLAN_LEAF, properties: { ...PLAN_LEAF.properties, children: { type: "array", items: PLAN_MID, description: "The next level down" } } };

const TOOLS = [
  {
    name: "get_goals",
    description: "List the user's goals with their life bucket, milestones, deadlines, progress and the current plan outline (years, months, weeks). Call this before planning work or adjusting milestones.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_habits",
    description: "List the user's recurring habits (name, bucket, time of day, which weekdays). These occupy time on the calendar even when not explicitly placed on the grid.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_week_plan",
    description: "Show one week of the user's calendar: what is scheduled each day, which habits recur, sleep hours, and therefore what time is still free. Call this before placing anything.",
    inputSchema: {
      type: "object",
      properties: { date: { ...DATE_PROP, description: "Any date inside the week to show. Defaults to the current week." } },
      additionalProperties: false,
    },
  },
  {
    name: "get_weekly_outcomes",
    description: "Read the 1-3 headline outcomes the user set for a week, plus any per-day outcomes.",
    inputSchema: {
      type: "object",
      properties: { date: { ...DATE_PROP, description: "Any date inside the week. Defaults to the current week." } },
      additionalProperties: false,
    },
  },
  {
    name: "place_task",
    description: "Schedule a block of work on the user's calendar. Every block needs a life bucket: pass \"bucket\", or pass a goalId and it inherits that goal's bucket. Refuses rather than overwrite anything already there.",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        startTime: TIME_PROP,
        endTime: TIME_PROP,
        name: { type: "string", description: "Short title shown on the grid" },
        description: { type: "string", description: "Optional detail about what to do" },
        goalId: { type: "string", description: "Goal id this advances, from get_goals. Include whenever the block serves a goal." },
        bucket: { ...BUCKET_PROP, description: BUCKET_PROP.description + " Required unless goalId is given." },
        allowOverlap: { type: "boolean", description: "Set true only to deliberately schedule over a habit or sleep hours." },
      },
      required: ["date", "startTime", "endTime", "name"],
      additionalProperties: false,
    },
  },
  {
    name: "move_task",
    description: "Move an already-scheduled block to a different day and/or time, keeping its name and details.",
    inputSchema: {
      type: "object",
      properties: {
        fromDate: DATE_PROP,
        fromTime: { ...TIME_PROP, description: "Any time inside the block being moved" },
        toDate: DATE_PROP,
        toStartTime: TIME_PROP,
        allowOverlap: { type: "boolean", description: "Set true only to deliberately schedule over a habit or sleep hours." },
      },
      required: ["fromDate", "fromTime", "toDate", "toStartTime"],
      additionalProperties: false,
    },
  },
  {
    name: "remove_task",
    description: "Remove a scheduled block from the calendar.",
    inputSchema: {
      type: "object",
      properties: { date: DATE_PROP, time: { ...TIME_PROP, description: "Any time inside the block to remove" } },
      required: ["date", "time"],
      additionalProperties: false,
    },
  },
  {
    name: "create_goal",
    description: "Create a goal with its full breakdown. bucket is required. Provide \"plans\" as the breakdown for the goal type: Year goal = years, each with its months (children), and the weeks (grandchildren) of the current month. Month goal = months, with the weeks of the current month. Week goal = weeks. Counts must match the dates; an error tells you the exact periods expected. Later months' weeks are filled in automatically when they arrive. Milestones are created for you, one per year/month/week.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "What the goal is" },
        purpose: { type: "string", description: "Why it matters to the user" },
        startDate: DATE_PROP,
        endDate: DATE_PROP,
        goalType: { type: "string", enum: ["Week", "Month", "Year"], description: "Week: 1-4 weeks. Month: 2-12 months. Year: 2-10 years." },
        bucket: BUCKET_PROP,
        plans: { type: "array", description: "Top-level phases, one per year (Year goal), month (Month goal) or week (Week goal), each with nested children", items: PLAN_TOP },
      },
      required: ["name", "startDate", "endDate", "goalType", "bucket", "plans"],
      additionalProperties: false,
    },
  },
  {
    name: "update_goal",
    description: "Change a goal's name, purpose, deadline or life bucket. Changing the bucket also updates every phase of its plan.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        name: { type: "string" },
        purpose: { type: "string" },
        endDate: DATE_PROP,
        bucket: BUCKET_PROP,
      },
      required: ["goalId"],
      additionalProperties: false,
    },
  },
  {
    name: "update_milestone",
    description: "Adjust one milestone on a goal -- rename it, move its target date, or mark it complete. Use this to re-baseline a goal when the user has fallen behind or run ahead.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        milestoneTitle: { type: "string", description: "Current title of the milestone to change (exact or close match)" },
        newTitle: { type: "string" },
        targetDate: DATE_PROP,
        completed: { type: "boolean" },
      },
      required: ["goalId", "milestoneTitle"],
      additionalProperties: false,
    },
  },
  {
    name: "create_habit",
    description: "Create a recurring habit. bucket is required. Habits occupy time on the calendar on their days, so check get_habits and get_week_plan first.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        purpose: { type: "string", description: "Why the user does this" },
        startTime: TIME_PROP,
        endTime: TIME_PROP,
        days: { type: "array", items: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }, description: "Weekdays it repeats on. Leave empty for every day." },
        startDate: DATE_PROP,
        endDate: { ...DATE_PROP, description: "Optional last day. Omit to repeat indefinitely." },
        bucket: BUCKET_PROP,
      },
      required: ["name", "purpose", "startTime", "endTime", "startDate", "bucket"],
      additionalProperties: false,
    },
  },
  {
    name: "set_daily_outcomes",
    description: "Set the outcome for each day of a week (one per day). Set the weekly outcomes first, then link each day to the weekly outcome it advances with contributesTo. Days you do not mention are left alone.",
    inputSchema: {
      type: "object",
      properties: {
        date: { ...DATE_PROP, description: "Any date inside the week. Defaults to the current week." },
        outcomes: DAILY_OUTCOMES_PROP,
      },
      required: ["outcomes"],
      additionalProperties: false,
    },
  },
  {
    name: "set_weekly_outcomes",
    description: "Set the 1-3 headline outcomes that define a successful week. You can also pass dailyOutcomes (one per day, each linked to a weekly outcome) so the week and its days are planned in one call.",
    inputSchema: {
      type: "object",
      properties: {
        date: { ...DATE_PROP, description: "Any date inside the week. Defaults to the current week." },
        outcomes: {
          type: "array",
          description: "In priority order, at most 3.",
          items: { type: "string" },
          maxItems: 3,
        },
        dailyOutcomes: DAILY_OUTCOMES_PROP,
      },
      required: ["outcomes"],
      additionalProperties: false,
    },
  },
];

// ─── Tool implementations ──────────────────────────────────────

async function loadProfile(admin: any, userId: string) {
  const { data } = await admin
    .from("user_profiles")
    .select("sleep_start, sleep_duration")
    .eq("user_id", userId)
    .maybeSingle();
  return { sleepStart: data?.sleep_start || "22:00", sleepDuration: data?.sleep_duration || "8" };
}

async function runTool(admin: any, userId: string, name: string, args: any): Promise<string> {
  switch (name) {
    case "get_goals": {
      const { data, error } = await admin.from("goals").select("*").eq("user_id", userId);
      if (error) throw new Error(error.message);
      const goals = (data || []).map((g: any) => {
        const milestones = g.milestones || [];
        const done = milestones.filter((m: any) => m.completed).length;
        return {
          goalId: g.id,
          name: g.name,
          purpose: g.purpose,
          startDate: g.startDate,
          endDate: g.endDate,
          goalType: g.goalType,
          bucket: g.bucket ?? "MISSING -- set one with update_goal before planning work for this goal",
          progress: milestones.length ? `${done}/${milestones.length} milestones complete` : "no milestones",
          milestones: milestones.map((m: any) => ({ title: m.title, targetDate: m.targetDate, completed: !!m.completed })),
          plan: outlinePlans(g.plans),
        };
      });
      return JSON.stringify({ goals }, null, 2);
    }

    case "get_habits": {
      const { data, error } = await admin.from("habits").select("*").eq("user_id", userId);
      if (error) throw new Error(error.message);
      const habits = (data || []).map((h: any) => ({
        habitId: h.id,
        name: h.name,
        bucket: h.bucket ?? "MISSING",
        purpose: h.purpose || undefined,
        startTime: h.startTime,
        endTime: h.endTime,
        days: (h.daysOfWeek || []).length ? h.daysOfWeek : "every day",
        startDate: h.startDate,
        endDate: h.endDate,
      }));
      return JSON.stringify({ habits }, null, 2);
    }

    case "get_week_plan": {
      const anchor = args?.date ? parseDate(args.date) : new Date();
      const weekStr = dateToWeekStr(anchor);
      const dates = getDaysForWeek(weekStr);
      const [{ data: planRow }, { data: habitRows }, profile] = await Promise.all([
        admin.from("week_plans").select("state").eq("user_id", userId).eq("week", formatWeekDisplay(weekStr)).maybeSingle(),
        admin.from("habits").select("*").eq("user_id", userId),
        loadProfile(admin, userId),
      ]);
      const state = (planRow?.state as Record<string, any>) || {};

      const days = dates.map((d, dayIdx) => {
        const iso = dateStr(d);
        return {
          date: iso,
          weekday: DAY_NAMES[dayIdx],
          scheduled: blocksForDay(state, dayIdx),
          habits: habitsOnDay(habitRows || [], dayIdx, iso).map((h: any) => ({
            name: h.name, start: h.startTime, end: h.endTime, bucket: h.bucket || undefined,
          })),
        };
      });

      return JSON.stringify({
        week: weekStr,
        weekLabel: formatWeekDisplay(weekStr),
        sleep: `Sleeps from ${profile.sleepStart} for ${profile.sleepDuration} hours -- do not schedule during these hours.`,
        note: "Anything not listed under 'scheduled' or 'habits' is free time on that day.",
        days,
      }, null, 2);
    }

    case "get_weekly_outcomes": {
      const anchor = args?.date ? parseDate(args.date) : new Date();
      const weekStr = dateToWeekStr(anchor);
      const { data } = await admin
        .from("week_plans").select("bucket_actions")
        .eq("user_id", userId).eq("week", formatWeekDisplay(weekStr)).maybeSingle();
      const raw = (data?.bucket_actions || {}) as Record<string, any>;
      const outcomes = ["p1", "p2", "p3"]
        .map((k, i) => ({ slot: i + 1, text: raw[k]?.text || null, bucket: raw[k]?.bucket || undefined }))
        .filter((o) => o.text);
      return JSON.stringify({
        week: weekStr,
        weekLabel: formatWeekDisplay(weekStr),
        weeklyOutcomes: outcomes,
        dailyOutcomes: Object.entries((raw.dailyWins || {}) as Record<string, any>)
          .map(([key, v]) => {
            const n = Number(key.split("-").pop());
            const day = getDaysForWeek(weekStr)[n - 1];
            return {
              date: day ? dateStr(day) : key,
              text: v?.text || "",
              contributesTo: v?.contributesToKey ? Number(String(v.contributesToKey).replace("p", "")) : undefined,
              completed: v?.completed || false,
            };
          })
          .filter((d) => d.text)
          .sort((a, b) => a.date.localeCompare(b.date)),
      }, null, 2);
    }

    case "place_task": {
      const date = parseDate(args.date);
      const weekStr = dateToWeekStr(date);
      const dayIdx = dateToDayIdx(date);
      const startSlot = timeToSlot(args.startTime);
      const endSlot = Math.max(startSlot + 1, timeToEndSlot(args.endTime));
      if (endSlot > 48) throw new Error("A block cannot run past midnight -- split it across two days.");
      if (!args.name?.trim()) throw new Error("name is required");

      // Every block belongs to a life bucket: explicit, or inherited from the goal it serves
      let bucket: Bucket;
      if (args.bucket !== undefined) {
        bucket = parseBucket(args.bucket, "task");
      } else if (args.goalId) {
        const { data: goalRow, error: goalErr } = await admin.from("goals").select("bucket").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
        if (goalErr) throw new Error(goalErr.message);
        if (!goalRow) throw new Error(`No goal found with id ${args.goalId}.`);
        bucket = parseBucket(goalRow.bucket, "goal (this goal has no bucket yet -- set one with update_goal, or pass bucket here)");
      } else {
        throw new Error(`Every task needs a life bucket: ${BUCKET_HELP}. Pass "bucket", or pass a goalId so it inherits the goal's bucket.`);
      }

      if (!args.allowOverlap) {
        const [{ data: habitRows }, profile] = await Promise.all([
          admin.from("habits").select("*").eq("user_id", userId),
          loadProfile(admin, userId),
        ]);
        const sleeping = sleepBusySlots(profile.sleepStart, profile.sleepDuration);
        for (let s = startSlot; s < endSlot; s++) {
          if (sleeping.has(s)) {
            throw new Error(`${slotToTime(s)} falls inside sleep hours (${profile.sleepStart} for ${profile.sleepDuration}h). Pick another time, or pass allowOverlap: true.`);
          }
        }
        const clashing = habitsOnDay(habitRows || [], dayIdx, args.date).find((h: any) => {
          try {
            return timeToSlot(h.startTime) < endSlot && timeToEndSlot(h.endTime) > startSlot;
          } catch { return false; }
        });
        if (clashing) {
          throw new Error(`That overlaps the habit "${clashing.name}" (${clashing.startTime}-${clashing.endTime}). Pick another time, or pass allowOverlap: true.`);
        }
      }

      await mutateWeekState(admin, userId, weekStr, (state) => {
        for (let s = startSlot; s < endSlot; s++) {
          const existing = state[`${dayIdx}-${s}`] as PlanSlot | undefined;
          if (existing && existing.name && existing.type !== "cleared") {
            throw new Error(`${slotToTime(s)} is already taken by "${existing.name}". Nothing was changed -- pick a free time, or remove that block first.`);
          }
        }
        const slot: PlanSlot = {
          type: args.goalId ? "goal" : "custom",
          name: args.name.trim(),
          ...(args.description ? { description: args.description } : {}),
          ...(args.goalId ? { goalId: args.goalId } : {}),
          bucket,
        };
        for (let s = startSlot; s < endSlot; s++) state[`${dayIdx}-${s}`] = { ...slot };
      });

      return `Scheduled "${args.name.trim()}" (${bucket}) on ${args.date} from ${slotToTime(startSlot)} to ${slotToTime(endSlot)}.`;
    }

    case "move_task": {
      const fromDate = parseDate(args.fromDate);
      const toDate = parseDate(args.toDate);
      const fromWeek = dateToWeekStr(fromDate);
      const toWeek = dateToWeekStr(toDate);
      const fromDayIdx = dateToDayIdx(fromDate);
      const toDayIdx = dateToDayIdx(toDate);
      const fromSlot = timeToSlot(args.fromTime);
      const toStart = timeToSlot(args.toStartTime);

      // Lift the block out first so a same-week move can't collide with itself.
      const lifted = await mutateWeekState(admin, userId, fromWeek, (state) => {
        const range = findBlockRange(state, fromDayIdx, fromSlot);
        if (!range) throw new Error(`Nothing is scheduled at ${args.fromTime} on ${args.fromDate}.`);
        for (let s = range.start; s <= range.end; s++) delete state[`${fromDayIdx}-${s}`];
        // originStart, not fromSlot -- the caller may have named any time
        // inside the block, and putting it back has to use its real start.
        return { slot: range.slot, length: range.end - range.start + 1, originStart: range.start };
      });

      const restoreLifted = () =>
        mutateWeekState(admin, userId, fromWeek, (state) => {
          for (let i = 0; i < lifted.length; i++) {
            state[`${fromDayIdx}-${lifted.originStart + i}`] = { ...lifted.slot };
          }
        });

      const toEnd = toStart + lifted.length;
      if (toEnd > 48) {
        await restoreLifted(); // never leave the user's block simply deleted
        throw new Error("That block would run past midnight at the new time. Nothing was moved.");
      }

      try {
        await mutateWeekState(admin, userId, toWeek, (state) => {
          for (let s = toStart; s < toEnd; s++) {
            const existing = state[`${toDayIdx}-${s}`] as PlanSlot | undefined;
            if (existing && existing.name && existing.type !== "cleared") {
              throw new Error(`${slotToTime(s)} on ${args.toDate} is already taken by "${existing.name}".`);
            }
          }
          for (let s = toStart; s < toEnd; s++) state[`${toDayIdx}-${s}`] = { ...lifted.slot };
        });
      } catch (err) {
        await restoreLifted(); // a failed move must never lose the block
        throw err;
      }

      return `Moved "${lifted.slot.name}" to ${args.toDate} at ${slotToTime(toStart)}-${slotToTime(toEnd)}.`;
    }

    case "remove_task": {
      const date = parseDate(args.date);
      const weekStr = dateToWeekStr(date);
      const dayIdx = dateToDayIdx(date);
      const slot = timeToSlot(args.time);

      const removed = await mutateWeekState(admin, userId, weekStr, (state) => {
        const range = findBlockRange(state, dayIdx, slot);
        if (!range) throw new Error(`Nothing is scheduled at ${args.time} on ${args.date}.`);
        for (let s = range.start; s <= range.end; s++) delete state[`${dayIdx}-${s}`];
        return range.slot.name;
      });

      return `Removed "${removed}" from ${args.date}.`;
    }

    case "create_goal": {
      const bucket = parseBucket(args.bucket, "goal");
      if (!args.name?.trim()) throw new Error("name is required");
      const goalType = args.goalType;
      if (!["Week", "Month", "Year"].includes(goalType)) throw new Error('goalType must be "Week", "Month" or "Year".');
      if (!parseISODate(args.startDate) || !parseISODate(args.endDate)) throw new Error("startDate and endDate must be valid YYYY-MM-DD dates.");

      const milestoneDates = getMilestoneDates(goalType, args.startDate, args.endDate);
      if (milestoneDates.length === 0) throw new Error("endDate must be after startDate.");
      const limits: Record<string, [number, number]> = { Week: [1, 4], Month: [2, 12], Year: [2, 10] };
      const [min, max] = limits[goalType];
      if (milestoneDates.length < min || milestoneDates.length > max) {
        throw new Error(`A ${goalType} goal must span ${min}-${max} ${goalType.toLowerCase()}s, but these dates span ${milestoneDates.length}. Adjust the dates or the goalType.`);
      }

      const plans = buildPlans(goalType, args.startDate, milestoneDates, args.plans, bucket);
      const unit = goalType;
      const milestones = milestoneDates.map((date: string, i: number) => ({
        id: `m-${Date.now()}-${i}`,
        title: `End of ${unit} ${i + 1}`,
        targetDate: date,
        completed: false,
      }));

      const { data, error } = await admin.from("goals").insert({
        user_id: userId,
        name: args.name,
        title: args.name,
        purpose: args.purpose || "",
        startDate: args.startDate,
        endDate: milestoneDates[milestoneDates.length - 1],
        goalType,
        bucket,
        milestones,
        plans,
      }).select("id").single();
      if (error) throw new Error(error.message);

      const monthCount = plans.reduce((n: number, p: any) => n + (goalType === "Year" ? (p.subPlans || []).length : 0), 0);
      const weekCount = plans.reduce((n: number, p: any) => n + (goalType === "Year"
        ? (p.subPlans || []).reduce((m: number, c: any) => m + (c.subPlans || []).length, 0)
        : (p.subPlans || []).length), 0);
      return `Created ${goalType} goal "${args.name}" (id ${data.id}, bucket ${bucket}) with ${milestones.length} ${unit.toLowerCase()}-level phase(s)` +
        `${monthCount ? `, ${monthCount} month(s)` : ""}${weekCount ? ` and ${weekCount} week(s)` : ""}. Weeks for later months are planned automatically when those months arrive.`;
    }

    case "update_goal": {
      const patch: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (args.name) { patch.name = args.name; patch.title = args.name; }
      if (args.purpose !== undefined) patch.purpose = args.purpose;
      if (args.endDate) patch.endDate = args.endDate;
      if (args.bucket !== undefined) {
        const bucket = parseBucket(args.bucket, "goal");
        patch.bucket = bucket;
        const { data: current } = await admin.from("goals").select("plans").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
        if (current?.plans) patch.plans = applyBucket(current.plans, bucket);
      }

      const { data, error } = await admin.from("goals")
        .update(patch).eq("id", args.goalId).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No goal found with id ${args.goalId}.`);
      return `Updated goal "${data[0].name}".`;
    }

    case "update_milestone": {
      const { data: goal, error } = await admin.from("goals")
        .select("id, name, milestones").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!goal) throw new Error(`No goal found with id ${args.goalId}.`);

      const milestones = (goal.milestones || []) as any[];
      const wanted = String(args.milestoneTitle).trim().toLowerCase();
      const idx = milestones.findIndex((m: any) => String(m.title).trim().toLowerCase() === wanted);
      const fuzzy = idx === -1
        ? milestones.findIndex((m: any) => String(m.title).toLowerCase().includes(wanted))
        : idx;
      if (fuzzy === -1) {
        throw new Error(`No milestone matching "${args.milestoneTitle}" on that goal. It has: ${milestones.map((m: any) => `"${m.title}"`).join(", ") || "none"}.`);
      }

      const before = { ...milestones[fuzzy] };
      if (args.newTitle) milestones[fuzzy].title = args.newTitle;
      if (args.targetDate) milestones[fuzzy].targetDate = args.targetDate;
      if (args.completed !== undefined) milestones[fuzzy].completed = !!args.completed;

      const { error: saveErr } = await admin.from("goals")
        .update({ milestones, updatedAt: new Date().toISOString() })
        .eq("id", goal.id).eq("user_id", userId);
      if (saveErr) throw new Error(saveErr.message);

      return `Updated milestone "${before.title}" on "${goal.name}": ${JSON.stringify(milestones[fuzzy])}`;
    }

    case "create_habit": {
      const bucket = parseBucket(args.bucket, "habit");
      if (!args.name?.trim()) throw new Error("name is required");
      if (!args.purpose?.trim()) throw new Error("purpose is required: say why the user does this habit.");
      timeToSlot(args.startTime);
      timeToEndSlot(args.endTime);
      if (!parseISODate(args.startDate)) throw new Error("startDate must be a valid YYYY-MM-DD date.");
      if (args.endDate && !parseISODate(args.endDate)) throw new Error("endDate must be a valid YYYY-MM-DD date.");
      const days: string[] = (args.days || []).filter((d: string) => DAY_NAMES.includes(d));

      const { data, error } = await admin.from("habits").insert({
        user_id: userId,
        name: args.name.trim(),
        purpose: args.purpose.trim(),
        startTime: args.startTime,
        endTime: args.endTime,
        startDate: args.startDate,
        ...(args.endDate ? { endDate: args.endDate } : {}),
        daysOfWeek: days,
        bucket,
      }).select("id").single();
      if (error) throw new Error(error.message);
      return `Created habit "${args.name.trim()}" (id ${data.id}, bucket ${bucket}) ${args.startTime}-${args.endTime} on ${days.length ? days.join(", ") : "every day"}.`;
    }

    case "set_weekly_outcomes": {
      const anchor = args?.date ? parseDate(args.date) : new Date();
      const weekStr = dateToWeekStr(anchor);
      const dbWeekKey = formatWeekDisplay(weekStr);
      const texts: string[] = (args.outcomes || []).filter((t: any) => typeof t === "string" && t.trim()).slice(0, 3);
      if (texts.length === 0) throw new Error("Provide at least one outcome.");

      const { data: row } = await admin.from("week_plans")
        .select("bucket_actions").eq("user_id", userId).eq("week", dbWeekKey).maybeSingle();
      const existing = (row?.bucket_actions || {}) as Record<string, any>;
      const next: Record<string, any> = { ...existing };
      ["p1", "p2", "p3"].forEach((key, i) => {
        if (texts[i]) next[key] = { ...(existing[key] || {}), text: texts[i] };
        else delete next[key];
      });
      if (Array.isArray(args.dailyOutcomes) && args.dailyOutcomes.length > 0) {
        next.dailyWins = applyDailyOutcomes(existing.dailyWins, weekStr, args.dailyOutcomes, texts.length);
      }

      if (row) {
        const { error } = await admin.from("week_plans")
          .update({ bucket_actions: next }).eq("user_id", userId).eq("week", dbWeekKey);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await admin.from("week_plans")
          .insert({ user_id: userId, week: dbWeekKey, state: {}, bucket_actions: next });
        if (error) throw new Error(error.message);
      }

      const dailyCount = Array.isArray(args.dailyOutcomes) ? args.dailyOutcomes.length : 0;
      return `Set ${texts.length} weekly outcome(s) for ${dbWeekKey}: ${texts.map((t) => `"${t}"`).join(", ")}.${dailyCount ? ` Also set ${dailyCount} daily outcome(s).` : ""}`;
    }

    case "set_daily_outcomes": {
      const anchor = args?.date ? parseDate(args.date) : new Date();
      const weekStr = dateToWeekStr(anchor);
      const dbWeekKey = formatWeekDisplay(weekStr);
      if (!Array.isArray(args.outcomes) || args.outcomes.length === 0) throw new Error("Provide at least one daily outcome.");

      const { data: row } = await admin.from("week_plans")
        .select("bucket_actions").eq("user_id", userId).eq("week", dbWeekKey).maybeSingle();
      const existing = (row?.bucket_actions || {}) as Record<string, any>;
      const weeklyCount = ["p1", "p2", "p3"].filter((k) => existing[k]?.text).length;
      const next = { ...existing, dailyWins: applyDailyOutcomes(existing.dailyWins, weekStr, args.outcomes, weeklyCount) };

      if (row) {
        const { error } = await admin.from("week_plans")
          .update({ bucket_actions: next }).eq("user_id", userId).eq("week", dbWeekKey);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await admin.from("week_plans")
          .insert({ user_id: userId, week: dbWeekKey, state: {}, bucket_actions: next });
        if (error) throw new Error(error.message);
      }
      return `Set ${args.outcomes.length} daily outcome(s) for ${dbWeekKey}: ${args.outcomes.map((o: any) => `${o.date} "${String(o.text).trim()}"`).join("; ")}.`;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP (JSON-RPC 2.0) plumbing ───────────────────────────────

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handleRpc(admin: any, userId: string, message: any): Promise<any | null> {
  const { id, method, params } = message || {};
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      // Echo the client's protocol version when it looks well-formed, so a
      // newer Claude release doesn't get refused by a hardcoded constant.
      const asked = params?.protocolVersion;
      const version = typeof asked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asked)
        ? asked
        : DEFAULT_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const toolName = params?.name;
      try {
        const text = await runTool(admin, userId, toolName, params?.arguments || {});
        return rpcResult(id, { content: [{ type: "text", text }] });
      } catch (err: any) {
        // Tool failures are reported in-band so the model can read the
        // reason and retry sensibly, per the MCP spec.
        return rpcResult(id, {
          content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }],
          isError: true,
        });
      }
    }

    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // Prefer the header; fall back to the last path segment so links issued
    // before header support keep working.
    const headerToken = req.headers.get("x-connector-token")
      || (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const pathTail = new URL(req.url).pathname.split("/").filter(Boolean).pop() || "";
    const token = headerToken.trim() || (pathTail === "mcp" ? "" : pathTail);

    if (!token) {
      return new Response(JSON.stringify({
        error: "Missing connector token. Send it as an X-Connector-Token header, or use the full link that includes it.",
      }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userId, error: resolveErr } = await admin.rpc("resolve_mcp_connector_token", {
      p_token_hash: await sha256Hex(token),
    });
    if (resolveErr) throw new Error(resolveErr.message);
    if (!userId) {
      return new Response(JSON.stringify({ error: "This connector link is not valid (it may have been revoked). Generate a new one in Profile > AI Assistant." }), { status: 401, headers: jsonHeaders });
    }

    // Stateless server: no session to resume on GET, nothing to clean up on DELETE.
    if (req.method === "GET") {
      return new Response(JSON.stringify({ error: "This server does not offer a server-initiated stream." }), { status: 405, headers: jsonHeaders });
    }
    if (req.method === "DELETE") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify(rpcError(null, -32700, "Parse error")), { status: 400, headers: jsonHeaders });
    }

    if (Array.isArray(payload)) {
      const responses = (await Promise.all(payload.map((m) => handleRpc(admin, userId, m)))).filter(Boolean);
      if (responses.length === 0) return new Response(null, { status: 202, headers: corsHeaders });
      return new Response(JSON.stringify(responses), { status: 200, headers: jsonHeaders });
    }

    const response = await handleRpc(admin, userId, payload);
    if (!response) return new Response(null, { status: 202, headers: corsHeaders });
    return new Response(JSON.stringify(response), { status: 200, headers: jsonHeaders });
  } catch (error: any) {
    console.error("mcp error:", error);
    return new Response(JSON.stringify(rpcError(null, -32603, error?.message || "Internal error")), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
