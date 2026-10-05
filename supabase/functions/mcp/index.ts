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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-protocol-version, mcp-session-id, x-connector-token, x-api-key, x-api-token, api-key, api-token, x-auth-token, x-access-token",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
};

const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = {
  name: "legacy-life-builder-planner",
  version: "1.3.0",
  // Branding for clients that read it (MCP 2025-11-25). Claude.ai currently ignores these and uses the favicon of the
  // connector URL's domain instead, which is why the link is served from our own domain (see vercel.json).
  title: "Legacy Life Builder",
  websiteUrl: "https://www.legacylifebuilder.xyz",
  icons: [
    { src: "https://www.legacylifebuilder.xyz/icon-512.png", mimeType: "image/png", sizes: ["512x512"] },
    { src: "https://www.legacylifebuilder.xyz/icon-192.png", mimeType: "image/png", sizes: ["192x192"] },
  ],
};

// Returned to Claude when it connects, so the planning rules apply to every chat without the user repeating them.
const INSTRUCTIONS = `You plan goals, habits and weeks for the user of Legacy Life Builder. Follow these rules every time.

1. EVERY goal, habit and scheduled task belongs to exactly one life bucket: income (paid work, clients), asset (skills, content, learning, side projects), recovery (sleep, rest, exercise, health) or relational (family, friends, real connection). Always pass "bucket". Never create anything without one. place_task may omit it only when goalId is given, and then inherits the goal's bucket.
2. Break every goal down by its type, from the top level to weeks:
   - Year goal: years, then the months of every year, then the weeks of the current month.
   - Month goal: months, then the weeks of the current month.
   - Week goal: weeks only.
   Pass this as "plans" (nested "children"). Counts must match the dates exactly. If create_goal rejects a count, fix it and call again. A goal that shows "No plan yet" needs set_goal_plan. When a new month arrives, fill its weeks with plan_goal_weeks.
3. Weeks of future months are filled in later. Do not invent them now.
4. Before scheduling, call get_profile and get_week_plan. Never place work over sleep or habits, and keep each week inside the user's daily hour budget.
5. When you plan a week, set 1-3 weekly outcomes with set_weekly_outcomes. The app has no daily outcomes.
6. Every goal needs ALL of these fields, exactly as the app's goal form asks: title (short name, 60 characters max), currentState (where the user is today), ultimateGoal (what they want to achieve), constraints (their real limits), why (why it matters to them), plus dates, goalType and bucket. Write them as plain text: never HTML entities such as &amp;, and never the labels "Current State:", "Ultimate Goal:" or "Strict Constraints:" inside the values. Ask the user for anything you do not know rather than guessing or leaving it blank.
7. Never judge what was done from the schedule alone. Use get_day and get_completions: a block is done only when it is ticked. Tick blocks the user says they finished with complete_task.
8. Work that did not happen or does not fit goes to the Missed Library (add_missed_task, then remove_task for a scheduled block), never into a task name such as "MISSED: ...". Put it back with restore_missed_task. Check get_missed_tasks before inventing new tasks.
9. Times are the user's local clock. "Today" means the user's today, which get_day reports as userToday.
10. Never delete goals, habits or notes unless the user asks. Prefer ending a habit with update_habit and an endDate.
11. Read before you write: call get_goals and get_habits first, reuse existing goals instead of creating duplicates, and keep buckets consistent with what the user already chose.
12. Start a conversation with get_overview, then drill down. Anything the user can do in the app you can do with a tool: edit or delete goals, habits, library tasks, Vault notes and reminders; edit a single plan phase (update_goal_plan_item); repeat a week (copy_week); wipe a day safely (clear_day, which saves the work to the Missed Library); change how they work (update_profile).
13. Tools that delete or wipe (delete_goal, delete_habit, delete_vault_note, delete_custom_task, clear_day) need the user's clear request. Say what will be removed first when it is more than one item.`;

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

/** Models sometimes send HTML-escaped text ("&amp;"); the app stores and shows plain characters. */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** A required free-text field: trimmed, decoded, stripped of the form's own labels, and never empty. */
function requireText(value: unknown, field: string, hint: string): string {
  const text = typeof value === "string"
    ? decodeEntities(value).replace(/^\s*(Current State|Ultimate Goal|Strict Constraints):\s*/i, "").trim()
    : "";
  if (!text) throw new Error(`${field} is required: ${hint}`);
  return text;
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

const SITUATION_LABELS: Record<string, string> = {
  student: "Student",
  employed: "Employed",
  self_employed: "Self-employed",
  business_owner: "Business Owner",
  between_jobs: "Between Jobs",
  career_transition: "Career Transition",
  caregiver: "Homemaker / Caregiver",
  other: "Other",
};

/** Everything that applies to the user. Older profiles stored one status ("unemployed" meant between jobs). */
function situationOf(executionProfile: any): string[] {
  const s = executionProfile?.situation;
  if (Array.isArray(s?.statuses) && s.statuses.length) return s.statuses;
  if (!s?.status) return [];
  return [s.status === "unemployed" ? "between_jobs" : s.status];
}

const VAULT_CATEGORY_LIST = ["ideas", "problems", "future", "nextweek", "quotes", "reading", "resources"];

// ─── Local time, day derivation and completions ────────────────
// The app stores times as the user's wall clock and tells the server their offset
// (user_profiles.notification_prefs.timezoneOffset = JS getTimezoneOffset(), minutes WEST of UTC).

/** "Now" shifted so the UTC getters read the user's wall clock. */
function localNow(tzOffset: number): Date {
  return new Date(Date.now() - tzOffset * 60000);
}

function localTodayISO(tzOffset: number): string {
  return dateStr(localNow(tzOffset));
}

function localMinutesNow(tzOffset: number): number {
  const n = localNow(tzOffset);
  return n.getUTCHours() * 60 + n.getUTCMinutes();
}

/** The date a tool should act on: the one given, or the user's today. */
function anchorDate(given: unknown, tzOffset: number): Date {
  return given ? parseDate(String(given)) : parseDate(localTodayISO(tzOffset));
}

/** The key completed_tasks uses for a day: "<YYYY-WW>-<1..7>". */
function dayStrFor(d: Date): string {
  return `${dateToWeekStr(d)}-${dateToDayIdx(d) + 1}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

interface DayTask {
  id: string;
  name: string;
  type: string;
  startSlot: number;
  endSlot: number;
  goalId?: string;
  bucket?: string;
  description?: string;
}

/**
 * Mirrors deriveDayTasks in @llb/core: a day's blocks from the week grid, with habits filling any
 * slot the grid leaves untouched. The id format ("<type>-<name>-<startSlot>") is what completed_tasks stores.
 */
function deriveDay(state: Record<string, any>, habits: any[], dayIdx: number, iso: string): DayTask[] {
  const out: DayTask[] = [];
  const todaysHabits = habitsOnDay(habits, dayIdx, iso).map((h: any) => {
    let startSlot = -1;
    let endSlot = -1;
    try {
      startSlot = timeToSlot(h.startTime);
      endSlot = timeToSlot(h.endTime);
    } catch { /* a habit with unreadable times never matches */ }
    return { h, startSlot, endSlot };
  });

  let current: DayTask | null = null;
  for (let s = 0; s < 48; s++) {
    const cell = state?.[`${dayIdx}-${s}`] as PlanSlot | undefined;
    let content: { type: string; name: string; goalId?: string; bucket?: string; description?: string } | undefined;
    if (cell) {
      if (cell.type !== "cleared" && cell.name) content = cell;
    } else {
      const hit = todaysHabits.find((x) => s >= x.startSlot && s < x.endSlot);
      if (hit) content = { type: "habit", name: hit.h.name, description: hit.h.description || undefined, bucket: hit.h.bucket || undefined };
    }

    if (content) {
      if (current && current.name === content.name && current.type === content.type) {
        current.endSlot = s + 1;
      } else {
        if (current) out.push(current);
        current = {
          id: `${content.type}-${content.name}-${s}`,
          name: content.name,
          type: content.type,
          startSlot: s,
          endSlot: s + 1,
          ...(content.goalId ? { goalId: content.goalId } : {}),
          ...(content.bucket ? { bucket: content.bucket } : {}),
          ...(content.description ? { description: content.description } : {}),
        };
      }
    } else if (current) {
      out.push(current);
      current = null;
    }
  }
  if (current) out.push(current);

  for (const r of ((state?.reminders || []) as any[]).filter((r) => r?.dayIdx === dayIdx)) {
    let slot = 0;
    try { slot = timeToSlot(r.time); } catch { /* keep 0 */ }
    out.push({ id: r.id, name: r.name, type: "reminder", startSlot: slot, endSlot: slot, ...(r.description ? { description: r.description } : {}) });
  }
  return out.sort((a, b) => a.startSlot - b.startSlot);
}

/** week_plans rows for several weeks at once, keyed by the "YYYY-WW" week string. */
async function loadWeekStates(admin: any, userId: string, weekStrs: string[]) {
  const unique = [...new Set(weekStrs)];
  const keyToWeek = new Map(unique.map((w) => [formatWeekDisplay(w), w]));
  const { data, error } = await admin.from("week_plans").select("week, state").eq("user_id", userId).in("week", [...keyToWeek.keys()]);
  if (error) throw new Error(error.message);
  const out = new Map<string, Record<string, any>>();
  for (const w of unique) out.set(w, {});
  for (const row of data || []) {
    const w = keyToWeek.get(row.week);
    if (w) out.set(w, (row.state as Record<string, any>) || {});
  }
  return out;
}

async function loadCompleted(admin: any, userId: string, dayStrs: string[]): Promise<Map<string, string[]>> {
  const { data, error } = await admin.from("completed_tasks").select("dayStr, taskIds").eq("user_id", userId).in("dayStr", dayStrs);
  if (error) throw new Error(error.message);
  return new Map((data || []).map((r: any) => [r.dayStr, (r.taskIds as string[]) || []]));
}

type TaskStatus = "done" | "missed" | "pending" | "upcoming";

/** done / missed (day over, or today's block ended, and not ticked) / pending (today, still ahead or running) / upcoming (future day). */
function taskStatus(task: DayTask, done: boolean, iso: string, todayIso: string, nowMinutes: number): TaskStatus {
  if (done) return "done";
  if (iso < todayIso) return "missed";
  if (iso > todayIso) return "upcoming";
  const endMinutes = (task.type === "reminder" ? task.startSlot + 1 : task.endSlot) * 30;
  return nowMinutes >= endMinutes ? "missed" : "pending";
}

const hoursOf = (t: DayTask) => (t.type === "reminder" ? 0 : (t.endSlot - t.startSlot) * 0.5);

/** A run of days in one pass: every task with its status. Used by get_day, get_completions and get_stats. */
async function loadDays(admin: any, userId: string, from: Date, to: Date, tzOffset: number) {
  const dates: Date[] = [];
  for (let d = from; d.getTime() <= to.getTime(); d = addDays(d, 1)) dates.push(d);
  const [states, completed, habitsRes] = await Promise.all([
    loadWeekStates(admin, userId, dates.map(dateToWeekStr)),
    loadCompleted(admin, userId, dates.map(dayStrFor)),
    admin.from("habits").select("*").eq("user_id", userId),
  ]);
  if (habitsRes.error) throw new Error(habitsRes.error.message);
  const todayIso = localTodayISO(tzOffset);
  const nowMinutes = localMinutesNow(tzOffset);

  return dates.map((d) => {
    const iso = dateStr(d);
    const dayIdx = dateToDayIdx(d);
    const ids = completed.get(dayStrFor(d)) || [];
    const tasks = deriveDay(states.get(dateToWeekStr(d)) || {}, habitsRes.data || [], dayIdx, iso).map((t) => ({
      ...t,
      status: taskStatus(t, ids.includes(t.id), iso, todayIso, nowMinutes),
    }));
    return { iso, weekday: DAY_NAMES[dayIdx], dayStr: dayStrFor(d), tasks };
  });
}

const fmtTask = (t: DayTask & { status?: TaskStatus }) => ({
  taskId: t.id,
  name: t.name,
  type: t.type,
  start: slotToTime(t.startSlot),
  end: slotToTime(t.type === "reminder" ? t.startSlot : t.endSlot),
  ...(t.status ? { status: t.status } : {}),
  ...(t.goalId ? { goalId: t.goalId } : {}),
  ...(t.bucket ? { bucket: t.bucket } : {}),
  ...(t.description ? { description: t.description } : {}),
});

// ─── Reminders ─────────────────────────────────────────────────

const REPEAT_TYPES = ["daily", "every_2_days", "weekly", "random", "once"];

/** Next fire time as a UTC instant, for a "HH:mm" on the user's wall clock (mirrors calculateNextFire in @llb/api). */
function nextFireFor(repeat: string, remindAt: string | undefined, onDate: string | undefined, tzOffset: number): Date {
  const shift = tzOffset * 60000;
  const nowLocal = localNow(tzOffset);
  const atLocal = (base: Date, hh: number, mm: number) =>
    new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hh, mm) + shift);

  if (repeat === "random") {
    const base = addDays(nowLocal, 2 + Math.floor(Math.random() * 3));
    return atLocal(base, 9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  }
  if (!remindAt) throw new Error(`time (HH:mm) is required for a ${repeat} reminder.`);
  const m = /^(\d{1,2}):(\d{2})$/.exec(remindAt.trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`Invalid time "${remindAt}" -- expected HH:mm`);
  const hh = Number(m[1]);
  const mm = Number(m[2]);

  if (repeat === "once") {
    if (!onDate) throw new Error("date (YYYY-MM-DD) is required for a one-time reminder.");
    const fire = atLocal(parseDate(onDate), hh, mm);
    if (fire.getTime() <= Date.now()) throw new Error("That date and time is already in the past.");
    return fire;
  }
  let fire = atLocal(nowLocal, hh, mm);
  if (fire.getTime() <= Date.now()) fire = new Date(fire.getTime() + (repeat === "weekly" ? 7 : repeat === "every_2_days" ? 2 : 1) * 86400000);
  return fire;
}

/** Daily goal-work budget: the stated free hours, else the weekday band, else 3h (mirrors getDailyHourBudget in @llb/core). */
function hourBudget(row: any) {
  const FREE: Record<string, number> = { lt1: 1, "1to2": 2, "2to4": 4, "4plus": 5 };
  const ep = (row?.execution_profile || {}) as any;
  const stated = parseFloat(row?.daily_free_hours ?? "");
  const weekdayBand = ep?.situation?.weekdayFree;
  const target = stated > 0 ? stated : weekdayBand ? FREE[weekdayBand] ?? 3 : 3;
  const weekendBand = ep?.situation?.weekendFree;
  return {
    weekdayTargetHours: target,
    weekdayMaxHours: Math.max(target, Math.ceil(target * 1.5)),
    weekendTargetHours: weekendBand ? FREE[weekendBand] ?? target : target,
  };
}

// ─── Tool definitions ──────────────────────────────────────────

const DATE_PROP = { type: "string", description: "Calendar date as YYYY-MM-DD" };
const TIME_PROP = { type: "string", description: "24-hour time as HH:mm, on a 30-minute grid" };

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
    description: "Read the 1-3 headline outcomes the user set for a week.",
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
        title: { type: "string", maxLength: 60, description: "Short name for the goal, 60 characters max" },
        currentState: { type: "string", description: "Where the user is right now, in plain text" },
        ultimateGoal: { type: "string", description: "What the user wants to achieve, in plain text" },
        constraints: { type: "string", description: "The user's real limits: time, money, energy, rules" },
        why: { type: "string", description: "Why this matters to the user. Shown back to them when it gets hard." },
        startDate: DATE_PROP,
        endDate: DATE_PROP,
        goalType: { type: "string", enum: ["Week", "Month", "Year"], description: "Week: 1-4 weeks. Month: 2-12 months. Year: 2-10 years." },
        bucket: BUCKET_PROP,
        plans: { type: "array", description: "Top-level phases, one per year (Year goal), month (Month goal) or week (Week goal), each with nested children", items: PLAN_TOP },
      },
      required: ["title", "currentState", "ultimateGoal", "constraints", "why", "startDate", "endDate", "goalType", "bucket", "plans"],
      additionalProperties: false,
    },
  },
  {
    name: "update_goal",
    description: "Change a goal's title, current state, ultimate goal, constraints, why, deadline or life bucket. Only the fields you pass change. Changing the bucket also updates every phase of its plan. Plain text only, no HTML entities.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        title: { type: "string", maxLength: 60, description: "Short name, 60 characters max" },
        currentState: { type: "string" },
        ultimateGoal: { type: "string" },
        constraints: { type: "string" },
        why: { type: "string" },
        endDate: DATE_PROP,
        bucket: BUCKET_PROP,
      },
      required: ["goalId"],
      additionalProperties: false,
    },
  },
  {
    name: "set_goal_plan",
    description: "Attach (or replace) the full breakdown of a goal that already exists, for example one that shows 'No plan yet'. Provide \"plans\" exactly as for create_goal: Year goal = years, each with its months (children), and the weeks (grandchildren) of the current month. Month goal = months, with the weeks of the current month. Week goal = weeks. Counts must match the goal's milestone dates; an error tells you the exact periods expected. Milestones, dates and bucket are kept as they are.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        plans: { type: "array", description: "Top-level phases, one per milestone, each with nested children", items: PLAN_TOP },
      },
      required: ["goalId", "plans"],
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
    name: "set_weekly_outcomes",
    description: "Set the 1-3 headline outcomes that define a successful week, in priority order, optionally linking each to a goal, habit or library task. Daily outcomes are no longer part of the app.",
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
        links: {
          type: "array",
          description: "Optionally tie an outcome to a goal, habit or Task Library item, as the app's outcomes dialog does. Use clear: true to remove a link.",
          items: {
            type: "object",
            properties: {
              slot: { type: "integer", minimum: 1, maximum: 3, description: "Which outcome: 1, 2 or 3" },
              type: { type: "string", enum: ["goal", "habit", "custom"] },
              id: { type: "string", description: "goalId, habitId or Task Library id" },
              clear: { type: "boolean" },
            },
            required: ["slot"],
            additionalProperties: false,
          },
        },
      },
      required: ["outcomes"],
      additionalProperties: false,
    },
  },
  {
    name: "plan_goal_weeks",
    description: "Fill in the weeks of one month of an existing goal without touching anything else in its plan. Use it when a new month arrives (Year and Month goals). Provide one entry per week of that month; if the count is wrong the error lists the exact weeks expected.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        date: { ...DATE_PROP, description: "Any date inside the month to plan. Defaults to the user's today." },
        weeks: { type: "array", items: PLAN_LEAF, description: "One per week of the month, in order" },
      },
      required: ["goalId", "weeks"],
      additionalProperties: false,
    },
  },
  {
    name: "get_overview",
    description: "One call to get oriented: the user's today and hour budget, this week's outcomes, today's blocks with their status, every goal in brief (bucket, progress, whether it has a plan), habit count, and how many items wait in the Missed Library and the nextweek Vault category. Start with this, then drill down.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_profile",
    description: "Change how the user works: sleep, planning session, daily free hours, energy peak, focus. Only the fields you pass change. Planning respects these values, so ask the user before changing them.",
    inputSchema: {
      type: "object",
      properties: {
        sleepStart: TIME_PROP,
        sleepHours: { type: "number", minimum: 3, maximum: 14, description: "Hours of sleep per night" },
        weekStartsOn: { type: "string", enum: ["Monday", "Sunday", "Saturday"] },
        planningDay: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], description: "The day the weekly planning session happens" },
        planningStart: TIME_PROP,
        planningEnd: TIME_PROP,
        dailyFreeHours: { type: "number", minimum: 0.5, maximum: 16, description: "Hours per day available for goal work" },
        energyPeak: { type: "string", enum: ["Morning", "Afternoon", "Evening", "Night"] },
        focusAbility: { type: "string", enum: ["low", "normal", "high"] },
        taskSwitching: { type: "string", enum: ["low", "normal", "high"], description: "How easily they switch between tasks" },
        situation: { type: "array", items: { type: "string", enum: ["student", "employed", "self_employed", "business_owner", "between_jobs", "career_transition", "caregiver", "other"] }, description: "Everything that applies to the user right now. Several can apply, such as student and business_owner. Their life-balance targets are built from this." },
        primaryLifeFocus: { type: "string" },
        biggestChallenge: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "update_vault_note",
    description: "Edit a Vault note: title, content, category or pinned. Only the fields you pass change. #tags in the content are re-read automatically.",
    inputSchema: {
      type: "object",
      properties: {
        noteId: { type: "string", description: "From get_vault_notes" },
        title: { type: "string" },
        content: { type: "string" },
        category: { type: "string", enum: [...VAULT_CATEGORY_LIST] },
        pinned: { type: "boolean" },
      },
      required: ["noteId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_vault_note",
    description: "Permanently delete a Vault note and its reminders. Only when the user asks.",
    inputSchema: {
      type: "object",
      properties: { noteId: { type: "string", description: "From get_vault_notes" } },
      required: ["noteId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_vault_reminders",
    description: "The user's Vault reminders: what they say, how often they repeat, and when they fire next.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "delete_vault_reminder",
    description: "Stop and remove a Vault reminder. The note stays.",
    inputSchema: {
      type: "object",
      properties: { reminderId: { type: "string", description: "From get_vault_reminders" } },
      required: ["reminderId"],
      additionalProperties: false,
    },
  },
  {
    name: "update_custom_task",
    description: "Edit a Task Library item. Only the fields you pass change.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "From get_custom_tasks" },
        name: { type: "string" },
        description: { type: "string" },
        startTime: TIME_PROP,
        endTime: TIME_PROP,
        days: { type: "array", items: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] } },
        bucket: BUCKET_PROP,
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_custom_task",
    description: "Remove an item from the Task Library. Blocks already on the calendar are not affected.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "From get_custom_tasks" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "add_reminder",
    description: "Put a timed reminder on the week's calendar (it shows on Today at that time). It takes no time block. bucket is required.",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        time: TIME_PROP,
        name: { type: "string" },
        description: { type: "string" },
        bucket: BUCKET_PROP,
      },
      required: ["date", "time", "name", "bucket"],
      additionalProperties: false,
    },
  },
  {
    name: "remove_reminder",
    description: "Remove a reminder from the week's calendar. Identify it by date plus its name or its id (ids are shown by get_week_plan).",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        name: { type: "string" },
        id: { type: "string" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "copy_week",
    description: "Repeat one week's goal and task blocks into another week, for example to reuse a week that worked. Habits are not copied (they repeat on their own). Anything that would land on an occupied or sleep time is skipped and reported, never overwritten.",
    inputSchema: {
      type: "object",
      properties: {
        fromDate: { ...DATE_PROP, description: "Any date inside the week to copy from" },
        toDate: { ...DATE_PROP, description: "Any date inside the week to copy into" },
        includeReminders: { type: "boolean", description: "Also copy the week's reminders. Default false." },
      },
      required: ["fromDate", "toDate"],
      additionalProperties: false,
    },
  },
  {
    name: "clear_day",
    description: "Empty one day's goal and task blocks (habits stay). By default every removed block is saved to the Missed Library so nothing is lost. Use it when the user wants a day wiped and re-planned.",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        keepInMissedLibrary: { type: "boolean", description: "Default true. Set false only if the user explicitly wants the work gone." },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "update_goal_plan_item",
    description: "Edit one phase of a goal's plan (a year, month or week): its title, description or estimated hours. Find it by its current title and/or by a date inside it. If more than one phase matches, the error lists them so you can narrow it down.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "From get_goals" },
        title: { type: "string", description: "The phase's current title (exact or part of it)" },
        date: { ...DATE_PROP, description: "A date inside the phase. The shortest phase containing it is chosen, usually a week." },
        newTitle: { type: "string" },
        description: { type: "string" },
        estimatedHours: { type: "number", minimum: 0 },
      },
      required: ["goalId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_day",
    description: "One day as the app shows it on Today: every block (goal work, habits, custom tasks, reminders) with its taskId and whether it is done, missed, pending (today, still ahead) or upcoming. Defaults to the user's today. Use it for a morning brief or an evening check-in.",
    inputSchema: {
      type: "object",
      properties: { date: { ...DATE_PROP, description: "Defaults to the user's today." } },
      additionalProperties: false,
    },
  },
  {
    name: "get_completions",
    description: "What was done and what was missed over a date range (max 42 days): per day counts, the missed blocks, and rollups per goal and per habit. This is the data behind a weekly review. A block counts as missed when its day is over, or today's block has ended, and it was not ticked.",
    inputSchema: {
      type: "object",
      properties: {
        from: DATE_PROP,
        to: { ...DATE_PROP, description: "Defaults to the user's today." },
      },
      required: ["from"],
      additionalProperties: false,
    },
  },
  {
    name: "complete_task",
    description: "Tick a block as done, exactly as tapping it on Today does. Identify it by date plus either a time inside the block or its name. Safe to repeat.",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        time: { ...TIME_PROP, description: "Any time inside the block" },
        name: { type: "string", description: "The block's name (use when you do not know the time)" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "uncomplete_task",
    description: "Untick a block that was marked done. Identify it like complete_task.",
    inputSchema: {
      type: "object",
      properties: {
        date: DATE_PROP,
        time: { ...TIME_PROP, description: "Any time inside the block" },
        name: { type: "string", description: "The block's name (use when you do not know the time)" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "get_missed_tasks",
    description: "The Missed Library: work that was deferred and not lost. It shows as the Backlog in the planner. Check it before creating new tasks.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "add_missed_task",
    description: "Put work into the Missed Library instead of deleting it (for example when it did not fit this week). Use this rather than renaming a task with a MISSED prefix. To defer a scheduled block, call this and then remove_task.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string", description: "Optional detail, such as the goal it belongs to or the date it was first planned" },
        startTime: { ...TIME_PROP, description: "Preferred start when it is rescheduled" },
        endTime: { ...TIME_PROP, description: "Preferred end when it is rescheduled" },
      },
      required: ["name", "startTime", "endTime"],
      additionalProperties: false,
    },
  },
  {
    name: "restore_missed_task",
    description: "Move a Missed Library item onto the calendar and remove it from the library. Same rules as place_task (bucket or goalId required, never over sleep or habits). Nothing changes if the placement fails.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "From get_missed_tasks" },
        date: DATE_PROP,
        startTime: { ...TIME_PROP, description: "Defaults to the item's own start time" },
        endTime: { ...TIME_PROP, description: "Defaults to the item's own end time" },
        goalId: { type: "string", description: "Goal id this advances, from get_goals" },
        bucket: { ...BUCKET_PROP, description: BUCKET_PROP.description + " Required unless goalId is given." },
      },
      required: ["id", "date"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_missed_task",
    description: "Remove an item from the Missed Library. Only when the user says the work is no longer needed.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "From get_missed_tasks" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_custom_tasks",
    description: "The user's Task Library: reusable tasks they can drop onto the week.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_custom_task",
    description: "Add a reusable task to the Task Library. bucket is required.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        startTime: TIME_PROP,
        endTime: TIME_PROP,
        days: { type: "array", items: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }, description: "Weekdays it usually happens on. Leave empty for none." },
        bucket: BUCKET_PROP,
      },
      required: ["name", "startTime", "endTime", "bucket"],
      additionalProperties: false,
    },
  },
  {
    name: "get_vault_notes",
    description: "Read the user's Vault notes (ideas, problems, future, nextweek, quotes, reading, resources). Notes in the nextweek category show up in the planner Backlog.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...VAULT_CATEGORY_LIST] },
        query: { type: "string", description: "Only notes whose title, content or tags contain this text" },
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Default 30" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "add_vault_note",
    description: "Save a note to the Vault. Use it to capture ideas, problems and things to do next week from a conversation. #tags in the content are picked up automatically.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        category: { type: "string", enum: [...VAULT_CATEGORY_LIST], description: "Default ideas" },
        pinned: { type: "boolean" },
      },
      required: ["content"],
      additionalProperties: false,
    },
  },
  {
    name: "set_vault_reminder",
    description: "Attach a reminder notification to a Vault note. repeat is daily, every_2_days, weekly, random (every 2-4 days at a random daytime hour) or once. Times are the user's local clock.",
    inputSchema: {
      type: "object",
      properties: {
        noteId: { type: "string", description: "From get_vault_notes or add_vault_note" },
        title: { type: "string", description: "Shown in the notification. Defaults to the note's title." },
        body: { type: "string" },
        repeat: { type: "string", enum: [...REPEAT_TYPES] },
        time: { ...TIME_PROP, description: "Not needed for random" },
        date: { ...DATE_PROP, description: "Required for once" },
      },
      required: ["noteId", "repeat"],
      additionalProperties: false,
    },
  },
  {
    name: "get_profile",
    description: "How the user works: sleep, planning day, free hours, energy peak, focus, situation (student, employed, business owner and so on) and the execution profile, plus the daily hour budget to plan within. Read this before building a week.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_stats",
    description: "Trends over the last N days (default 28, max 90): execution rate per week, per-habit consistency, per-goal planned vs done hours, and goals that are behind pace.",
    inputSchema: {
      type: "object",
      properties: { days: { type: "integer", minimum: 7, maximum: 90 } },
      additionalProperties: false,
    },
  },
  {
    name: "update_habit",
    description: "Change a habit. Only the fields you pass change. Changing times or days moves where it appears on the calendar.",
    inputSchema: {
      type: "object",
      properties: {
        habitId: { type: "string", description: "From get_habits" },
        name: { type: "string" },
        purpose: { type: "string" },
        startTime: TIME_PROP,
        endTime: TIME_PROP,
        days: { type: "array", items: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }, description: "Weekdays it repeats on. An empty list means every day." },
        endDate: { ...DATE_PROP, description: "Last day it repeats. Use it to retire a habit without deleting its history." },
        bucket: BUCKET_PROP,
      },
      required: ["habitId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_habit",
    description: "Permanently delete a habit. Prefer update_habit with an endDate. Only delete when the user asks for it.",
    inputSchema: {
      type: "object",
      properties: { habitId: { type: "string", description: "From get_habits" } },
      required: ["habitId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_goal",
    description: "Permanently delete a goal and its plan. Scheduled blocks that point to it stay on the calendar. Only delete when the user asks for it.",
    inputSchema: {
      type: "object",
      properties: { goalId: { type: "string", description: "From get_goals" } },
      required: ["goalId"],
      additionalProperties: false,
    },
  },
  {
    name: "place_tasks",
    description: "Schedule several blocks in one call. Each follows the rules of place_task. Blocks are placed in order and each is reported separately: one failing does not undo the others.",
    inputSchema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          maxItems: 40,
          items: {
            type: "object",
            properties: {
              date: DATE_PROP,
              startTime: TIME_PROP,
              endTime: TIME_PROP,
              name: { type: "string" },
              description: { type: "string" },
              goalId: { type: "string" },
              bucket: BUCKET_PROP,
            },
            required: ["date", "startTime", "endTime", "name"],
            additionalProperties: false,
          },
        },
      },
      required: ["tasks"],
      additionalProperties: false,
    },
  },
];

// ─── Tool implementations ──────────────────────────────────────

async function loadProfile(admin: any, userId: string) {
  const { data } = await admin
    .from("user_profiles")
    .select("sleep_start, sleep_duration, notification_prefs")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    sleepStart: data?.sleep_start || "22:00",
    sleepDuration: data?.sleep_duration || "8",
    tzOffset: Number(data?.notification_prefs?.timezoneOffset ?? 0) || 0,
  };
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
      const anchor = anchorDate(args?.date, (await loadProfile(admin, userId)).tzOffset);
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
          reminders: ((state.reminders as any[]) || []).filter((r) => r?.dayIdx === dayIdx).map((r) => ({ id: r.id, name: r.name, time: r.time })),
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
      const anchor = anchorDate(args?.date, (await loadProfile(admin, userId)).tzOffset);
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
      const title = requireText(args.title, "title", "a short name for the goal, 60 characters max.");
      if (title.length > 60) throw new Error("title must be 60 characters or fewer.");
      const currentState = requireText(args.currentState, "currentState", "describe where the user is right now.");
      const ultimateGoal = requireText(args.ultimateGoal, "ultimateGoal", "describe what the user wants to achieve.");
      const constraints = requireText(args.constraints, "constraints", "state the user's real limits (time, money, energy). Ask them if unknown.");
      const why = requireText(args.why, "why", "say why this matters to the user. Ask them if unknown.");
      // Same packing the app's goal form uses, so these goals open and edit like any other
      const goalName = `Current State:\n${currentState}\n\nUltimate Goal:\n${ultimateGoal}`;
      const goalPurpose = `Strict Constraints:\n${constraints}`;
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
        name: goalName,
        title,
        purpose: goalPurpose,
        goalContext: { why },
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
      return `Created ${goalType} goal "${title}" (id ${data.id}, bucket ${bucket}) with ${milestones.length} ${unit.toLowerCase()}-level phase(s)` +
        `${monthCount ? `, ${monthCount} month(s)` : ""}${weekCount ? ` and ${weekCount} week(s)` : ""}. Weeks for later months are planned automatically when those months arrive.`;
    }

    case "update_goal": {
      const patch: Record<string, any> = { updatedAt: new Date().toISOString() };
      const text = (v: unknown, field: string) => {
        const t = typeof v === "string" ? decodeEntities(v).trim() : "";
        if (!t) throw new Error(`${field} cannot be empty.`);
        return t;
      };
      const touchesText = ["title", "currentState", "ultimateGoal", "constraints", "why"].some((k) => args[k] !== undefined);
      if (touchesText || args.bucket !== undefined) {
        const { data: current } = await admin.from("goals").select("name, purpose, plans, goalContext")
          .eq("id", args.goalId).eq("user_id", userId).maybeSingle();
        if (!current) throw new Error(`No goal found with id ${args.goalId}.`);

        if (touchesText) {
          // Goals pack current state + ultimate goal into name, and constraints into purpose (see create_goal)
          const nameMatch = /^Current State:\n([\s\S]*?)\n\nUltimate Goal:\n([\s\S]*)$/.exec(current.name || "");
          if (args.title !== undefined) {
            const title = text(args.title, "title");
            if (title.length > 60) throw new Error("title must be 60 characters or fewer.");
            patch.title = title;
          }
          if (args.currentState !== undefined || args.ultimateGoal !== undefined) {
            const cs = args.currentState !== undefined ? text(args.currentState, "currentState") : (nameMatch?.[1] ?? "").trim();
            const ug = args.ultimateGoal !== undefined ? text(args.ultimateGoal, "ultimateGoal") : (nameMatch?.[2] ?? "").trim();
            patch.name = `Current State:\n${cs}\n\nUltimate Goal:\n${ug}`;
          }
          if (args.constraints !== undefined) {
            patch.purpose = `Strict Constraints:\n${text(args.constraints, "constraints")}`;
          }
          if (args.why !== undefined) patch.goalContext = { ...(current.goalContext || {}), why: text(args.why, "why") };
        }

        if (args.bucket !== undefined) {
          const bucket = parseBucket(args.bucket, "goal");
          patch.bucket = bucket;
          if (current.plans) patch.plans = applyBucket(current.plans, bucket);
        }
      }
      if (args.endDate) patch.endDate = args.endDate;

      const { data, error } = await admin.from("goals")
        .update(patch).eq("id", args.goalId).eq("user_id", userId).select("name, title");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No goal found with id ${args.goalId}.`);
      return `Updated goal "${data[0].title || data[0].name}".`;
    }

    case "set_goal_plan": {
      const { data: goal, error } = await admin.from("goals")
        .select("id, name, title, goalType, startDate, bucket, milestones").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!goal) throw new Error(`No goal found with id ${args.goalId}.`);

      const milestoneDates = ((goal.milestones || []) as any[]).map((m) => m.targetDate).filter(Boolean).sort();
      if (milestoneDates.length === 0) throw new Error("This goal has no milestones to plan against.");
      const bucket = parseBucket(goal.bucket, "goal");
      const plans = buildPlans(goal.goalType, goal.startDate, milestoneDates, args.plans, bucket);

      const { error: saveErr } = await admin.from("goals")
        .update({ plans, updatedAt: new Date().toISOString() }).eq("id", goal.id).eq("user_id", userId);
      if (saveErr) throw new Error(saveErr.message);

      const monthCount = plans.reduce((n: number, p: any) => n + (goal.goalType === "Year" ? (p.subPlans || []).length : 0), 0);
      const weekCount = plans.reduce((n: number, p: any) => n + (goal.goalType === "Year"
        ? (p.subPlans || []).reduce((m: number, c: any) => m + (c.subPlans || []).length, 0)
        : (p.subPlans || []).length), 0);
      return `Planned "${goal.title || goal.name}": ${plans.length} phase(s)${monthCount ? `, ${monthCount} month(s)` : ""}${weekCount ? ` and ${weekCount} week(s)` : ""}. Weeks for later months are planned automatically when those months arrive.`;
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
      const anchor = anchorDate(args?.date, (await loadProfile(admin, userId)).tzOffset);
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

      for (const link of Array.isArray(args.links) ? args.links : []) {
        const slot = Number(link?.slot);
        if (!Number.isInteger(slot) || slot < 1 || slot > texts.length) throw new Error(`links: slot must be between 1 and ${texts.length} (the outcomes you gave).`);
        const key = `p${slot}`;
        if (link.clear) {
          for (const f of ["linkedItemId", "linkedItemType", "linkedItemName"]) delete next[key][f];
          continue;
        }
        const table = link.type === "goal" ? "goals" : link.type === "habit" ? "habits" : link.type === "custom" ? "custom_tasks" : "";
        if (!table || !link.id) throw new Error("links: pass type (goal, habit or custom) and id, or clear: true.");
        const { data: item } = await admin.from(table).select("*").eq("id", link.id).eq("user_id", userId).maybeSingle();
        if (!item) throw new Error(`links: no ${link.type} with id ${link.id}.`);
        next[key] = {
          ...next[key],
          linkedItemId: link.id,
          linkedItemType: link.type,
          linkedItemName: item.title || String(item.name).slice(0, 60),
          ...(item.bucket ? { bucket: item.bucket } : {}),
        };
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

      return `Set ${texts.length} weekly outcome(s) for ${dbWeekKey}: ${texts.map((t) => `"${t}"`).join(", ")}.`;
    }

    case "plan_goal_weeks": {
      const { data: goal, error } = await admin.from("goals")
        .select("id, name, title, goalType, startDate, bucket, milestones, plans").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!goal) throw new Error(`No goal found with id ${args.goalId}.`);
      if (goal.goalType === "Week") throw new Error("A Week goal is already planned in weeks: there is nothing below them to add.");
      if (!Array.isArray(goal.plans) || goal.plans.length === 0) throw new Error("This goal has no plan yet: call set_goal_plan first.");
      if (!Array.isArray(args.weeks) || args.weeks.length === 0) throw new Error("Provide the weeks of the month.");

      const { tzOffset } = await loadProfile(admin, userId);
      const iso = dateStr(anchorDate(args.date, tzOffset));
      const bucket = parseBucket(goal.bucket, "goal");
      const milestoneDates = ((goal.milestones || []) as any[]).map((m) => m.targetDate).filter(Boolean).sort();
      const tops = getMilestonePeriods(goal.startDate, milestoneDates);
      const topIdx = tops.findIndex((p) => p.start <= iso && iso <= p.end);
      if (topIdx === -1) throw new Error(`${iso} is outside this goal (${tops[0]?.start} to ${tops[tops.length - 1]?.end}).`);

      const plans = JSON.parse(JSON.stringify(goal.plans)) as any[];
      let slot: any;
      let period: { start: string; end: string; label?: string };
      if (goal.goalType === "Year") {
        const months = getMonthPeriods(tops[topIdx].start, tops[topIdx].end);
        const mIdx = months.findIndex((p) => p.start <= iso && iso <= p.end);
        slot = plans[topIdx]?.subPlans?.[mIdx];
        if (mIdx === -1 || !slot) throw new Error("That year has no months yet: call set_goal_plan with the months first.");
        period = months[mIdx];
      } else {
        slot = plans[topIdx];
        period = tops[topIdx];
      }
      if (!slot) throw new Error("This goal's plan does not cover that date: call set_goal_plan first.");

      const weeks = getWeekPeriods(period.start, period.end);
      const periodLabel = period.label ?? `${period.start} to ${period.end}`;
      expectCount(`${periodLabel} ("weeks")`, "weeks", weeks, args.weeks.length);
      slot.periodStart = slot.periodStart ?? period.start;
      slot.periodEnd = slot.periodEnd ?? period.end;
      slot.subPlans = args.weeks.map((w: PlanNode, k: number) => nodeToSlot(w, weeks[k].label, weeks[k], bucket, `Week ${k + 1} of ${periodLabel}`));

      const { error: saveErr } = await admin.from("goals")
        .update({ plans, updatedAt: new Date().toISOString() }).eq("id", goal.id).eq("user_id", userId);
      if (saveErr) throw new Error(saveErr.message);
      return `Planned ${weeks.length} week(s) of ${periodLabel} for "${goal.title || String(goal.name).slice(0, 60)}". The rest of the plan is unchanged.`;
    }

    case "get_overview": {
      const profile = await loadProfile(admin, userId);
      const tz = profile.tzOffset;
      const today = anchorDate(undefined, tz);
      const todayIso = dateStr(today);
      const weekStr = dateToWeekStr(today);
      const [days, goalsRes, habitsRes, weekRow, missedRes, nextweekRes, profRes] = await Promise.all([
        loadDays(admin, userId, today, today, tz),
        admin.from("goals").select("id, name, title, bucket, goalType, startDate, endDate, milestones, plans").eq("user_id", userId),
        admin.from("habits").select("id").eq("user_id", userId),
        admin.from("week_plans").select("bucket_actions").eq("user_id", userId).eq("week", formatWeekDisplay(weekStr)).maybeSingle(),
        admin.from("missed_tasks").select("id").eq("user_id", userId),
        admin.from("vault_notes").select("id").eq("user_id", userId).eq("category", "nextweek"),
        admin.from("user_profiles").select("daily_free_hours, execution_profile").eq("user_id", userId).maybeSingle(),
      ]);
      for (const r of [goalsRes, habitsRes, missedRes, nextweekRes]) if (r.error) throw new Error(r.error.message);

      const budget = hourBudget(profRes.data);
      const raw = (weekRow.data?.bucket_actions || {}) as Record<string, any>;
      const real = days[0].tasks.filter((t) => t.type !== "reminder");
      const count = (s: TaskStatus) => real.filter((t) => t.status === s).length;
      const nowMs = Date.parse(todayIso);

      return JSON.stringify({
        userToday: todayIso,
        weekday: days[0].weekday,
        week: weekStr,
        dailyHourBudget: budget,
        weeklyOutcomes: ["p1", "p2", "p3"].map((k, i) => ({ slot: i + 1, text: raw[k]?.text || null, linked: raw[k]?.linkedItemName || undefined })).filter((o) => o.text),
        today: {
          summary: { done: count("done"), missed: count("missed"), pending: count("pending"), upcoming: count("upcoming") },
          blocks: days[0].tasks.map(fmtTask),
        },
        goals: (goalsRes.data || []).map((g: any) => {
          const ms = (g.milestones || []) as any[];
          const start = Date.parse(g.startDate);
          const end = Date.parse(g.endDate);
          const elapsed = end > start ? Math.max(0, Math.min(100, Math.round(((nowMs - start) / (end - start)) * 100))) : null;
          return {
            goalId: g.id,
            title: g.title || String(g.name).slice(0, 60),
            type: g.goalType,
            bucket: g.bucket ?? "MISSING",
            period: `${g.startDate} to ${g.endDate}`,
            timeElapsedPercent: elapsed,
            milestones: ms.length ? `${ms.filter((m) => m.completed).length}/${ms.length} complete` : "none",
            hasPlan: Array.isArray(g.plans) && g.plans.length > 0,
          };
        }),
        habitCount: (habitsRes.data || []).length,
        missedLibraryCount: (missedRes.data || []).length,
        nextWeekNotesCount: (nextweekRes.data || []).length,
        tip: "Use get_goals, get_habits, get_week_plan, get_missed_tasks or get_vault_notes for the details.",
      }, null, 2);
    }

    case "update_profile": {
      const map: Record<string, string> = {
        sleepStart: "sleep_start", planningStart: "plan_start_time", planningEnd: "plan_end_time", planningDay: "plan_day",
        weekStartsOn: "week_start", energyPeak: "energy_peak_time", focusAbility: "focus_ability", taskSwitching: "task_shifting_ability",
        primaryLifeFocus: "primary_life_focus", biggestChallenge: "biggest_challenge",
      };
      const patch: Record<string, any> = {};
      for (const key of ["sleepStart", "planningStart", "planningEnd"]) {
        if (args[key] !== undefined) { timeToSlot(args[key]); patch[map[key]] = args[key]; }
      }
      for (const key of ["planningDay", "weekStartsOn", "energyPeak", "focusAbility", "taskSwitching", "primaryLifeFocus", "biggestChallenge"]) {
        if (args[key] !== undefined) patch[map[key]] = String(args[key]).trim();
      }
      if (args.sleepHours !== undefined) {
        const h = Number(args.sleepHours);
        if (!Number.isFinite(h) || h < 3 || h > 14) throw new Error("sleepHours must be between 3 and 14.");
        patch.sleep_duration = String(h);
      }
      if (args.dailyFreeHours !== undefined) {
        const h = Number(args.dailyFreeHours);
        if (!Number.isFinite(h) || h < 0.5 || h > 16) throw new Error("dailyFreeHours must be between 0.5 and 16.");
        patch.daily_free_hours = String(h);
      }
      if (args.situation !== undefined) {
        const list = Array.isArray(args.situation) ? [...new Set(args.situation as string[])] : [];
        if (list.length === 0 || list.some((x) => !SITUATION_LABELS[x])) throw new Error(`situation must list at least one of: ${Object.keys(SITUATION_LABELS).join(", ")}.`);
        const { data: cur } = await admin.from("user_profiles").select("execution_profile").eq("user_id", userId).maybeSingle();
        const ep = (cur?.execution_profile || {}) as any;
        patch.execution_profile = { ...ep, version: ep.version ?? 1, situation: { ...(ep.situation || {}), statuses: list, status: undefined } };
        // Other features read the text form, so keep it in step with the list
        patch.current_profession = list.map((x) => SITUATION_LABELS[x]).join(", ");
      }
      if (Object.keys(patch).length === 0) throw new Error("Nothing to change: pass at least one field.");
      patch.updated_at = new Date().toISOString();
      const { data, error } = await admin.from("user_profiles").update(patch).eq("user_id", userId).select("user_id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("This user has no profile yet. They need to finish setup in the app first.");
      return `Updated the profile: ${Object.keys(patch).filter((k) => k !== "updated_at").join(", ")}.`;
    }

    case "update_vault_note": {
      const patch: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (args.title !== undefined) patch.title = String(args.title).trim();
      if (args.content !== undefined) {
        const content = String(args.content).trim();
        if (!content) throw new Error("content cannot be empty.");
        patch.content = content;
        patch.tags = [...new Set((content.match(/#[\w-]+/g) ?? []).map((t: string) => t.slice(1).toLowerCase()))];
      }
      if (args.category !== undefined) {
        if (!VAULT_CATEGORY_LIST.includes(args.category)) throw new Error(`category must be one of: ${VAULT_CATEGORY_LIST.join(", ")}.`);
        patch.category = args.category;
      }
      if (args.pinned !== undefined) patch.is_pinned = !!args.pinned;
      if (Object.keys(patch).length === 1) throw new Error("Nothing to change: pass at least one field.");
      const { data, error } = await admin.from("vault_notes").update(patch).eq("id", args.noteId).eq("user_id", userId).select("id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No Vault note with id ${args.noteId}.`);
      return "Updated the note.";
    }

    case "delete_vault_note": {
      const { data, error } = await admin.from("vault_notes").delete().eq("id", args.noteId).eq("user_id", userId).select("id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No Vault note with id ${args.noteId}.`);
      return "Deleted the note and its reminders.";
    }

    case "get_vault_reminders": {
      const { tzOffset } = await loadProfile(admin, userId);
      const [{ data: rems, error }, { data: notes }] = await Promise.all([
        admin.from("vault_reminders").select("*").eq("user_id", userId).order("next_fire", { ascending: true }),
        admin.from("vault_notes").select("id, title").eq("user_id", userId),
      ]);
      if (error) throw new Error(error.message);
      const titleOf = new Map<string, string>((notes || []).map((n: any) => [n.id, n.title]));
      return JSON.stringify({
        reminders: (rems || []).map((r: any) => ({
          reminderId: r.id,
          noteId: r.note_id,
          noteTitle: titleOf.get(r.note_id) || undefined,
          title: r.title,
          body: r.body || undefined,
          repeat: r.repeat_type,
          time: r.remind_at || undefined,
          nextFireLocal: new Date(new Date(r.next_fire).getTime() - tzOffset * 60000).toISOString().slice(0, 16).replace("T", " "),
          active: !!r.is_active,
          snoozed: r.snooze_count || 0,
        })),
      }, null, 2);
    }

    case "delete_vault_reminder": {
      const { data, error } = await admin.from("vault_reminders").delete().eq("id", args.reminderId).eq("user_id", userId).select("title");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No reminder with id ${args.reminderId}.`);
      return `Removed the reminder "${data[0].title}".`;
    }

    case "update_custom_task": {
      const patch: Record<string, any> = {};
      if (args.name !== undefined) {
        if (!String(args.name).trim()) throw new Error("name cannot be empty.");
        patch.name = String(args.name).trim();
      }
      if (args.description !== undefined) patch.description = String(args.description).trim() || null;
      if (args.startTime !== undefined) { timeToSlot(args.startTime); patch.startTime = args.startTime; }
      if (args.endTime !== undefined) { timeToEndSlot(args.endTime); patch.endTime = args.endTime; }
      if (args.days !== undefined) patch.daysOfWeek = (args.days as string[]).filter((x) => DAY_NAMES.includes(x));
      if (args.bucket !== undefined) patch.bucket = parseBucket(args.bucket, "task");
      if (Object.keys(patch).length === 0) throw new Error("Nothing to change: pass at least one field.");
      const { data, error } = await admin.from("custom_tasks").update(patch).eq("id", args.id).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No Task Library item with id ${args.id}.`);
      return `Updated "${data[0].name}" in the Task Library.`;
    }

    case "delete_custom_task": {
      const { data, error } = await admin.from("custom_tasks").delete().eq("id", args.id).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No Task Library item with id ${args.id}.`);
      return `Removed "${data[0].name}" from the Task Library.`;
    }

    case "add_reminder": {
      const date = parseDate(args.date);
      const weekStr = dateToWeekStr(date);
      const dayIdx = dateToDayIdx(date);
      timeToSlot(args.time);
      if (!args.name?.trim()) throw new Error("name is required");
      const bucket = parseBucket(args.bucket, "reminder");
      const id = `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      await mutateWeekState(admin, userId, weekStr, (state) => {
        state.reminders = [
          ...((state.reminders as any[]) || []),
          { id, name: args.name.trim(), ...(args.description ? { description: String(args.description).trim() } : {}), time: args.time, dayIdx, color: "#f43f5e", isReminder: true, bucket },
        ];
      });
      return `Reminder "${args.name.trim()}" set for ${args.date} at ${args.time} (id ${id}).`;
    }

    case "remove_reminder": {
      if (!args.name && !args.id) throw new Error("Pass the reminder's name or id.");
      const date = parseDate(args.date);
      const weekStr = dateToWeekStr(date);
      const dayIdx = dateToDayIdx(date);
      const removed = await mutateWeekState(admin, userId, weekStr, (state) => {
        const list = ((state.reminders as any[]) || []).filter((r) => r?.dayIdx === dayIdx);
        const wanted = String(args.name || "").trim().toLowerCase();
        const hits = list.filter((r) => (args.id ? r.id === args.id : String(r.name).trim().toLowerCase() === wanted));
        if (hits.length === 0) throw new Error(`No matching reminder on ${args.date}. That day has: ${list.map((r) => `"${r.name}" ${r.time}`).join(", ") || "none"}.`);
        if (hits.length > 1) throw new Error(`More than one reminder matches: ${hits.map((r) => `"${r.name}" ${r.time} (id ${r.id})`).join(", ")}. Pass the id.`);
        state.reminders = ((state.reminders as any[]) || []).filter((r) => r !== hits[0] && r.id !== hits[0].id);
        return hits[0];
      });
      return `Removed the reminder "${removed.name}" (${removed.time}) on ${args.date}.`;
    }

    case "copy_week": {
      const from = parseDate(args.fromDate);
      const to = parseDate(args.toDate);
      const fromWeek = dateToWeekStr(from);
      const toWeek = dateToWeekStr(to);
      if (fromWeek === toWeek) throw new Error("Pick two different weeks.");

      const [states, { data: habitRows }, profile] = await Promise.all([
        loadWeekStates(admin, userId, [fromWeek]),
        admin.from("habits").select("*").eq("user_id", userId),
        loadProfile(admin, userId),
      ]);
      const source = states.get(fromWeek) || {};
      const targetDates = getDaysForWeek(toWeek).map(dateStr);
      const sleeping = sleepBusySlots(profile.sleepStart, profile.sleepDuration);

      // Source blocks, whole (a block is copied entirely or not at all)
      const blocks: { dayIdx: number; start: number; end: number; cell: PlanSlot }[] = [];
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        let run: { start: number; cell: PlanSlot } | null = null;
        const flush = (end: number) => { if (run) blocks.push({ dayIdx, start: run.start, end, cell: run.cell }); run = null; };
        for (let s = 0; s < 48; s++) {
          const cell = source[`${dayIdx}-${s}`] as PlanSlot | undefined;
          const copyable = cell && cell.name && (cell.type === "goal" || cell.type === "custom");
          if (copyable && run && run.cell.name === cell.name && run.cell.type === cell.type) continue;
          flush(s);
          if (copyable) run = { start: s, cell };
        }
        flush(48);
      }

      const habitsFor = (dayIdx: number) => habitsOnDay(habitRows || [], dayIdx, targetDates[dayIdx]);
      const skipped: string[] = [];
      let copied = 0;
      let remindersCopied = 0;

      await mutateWeekState(admin, userId, toWeek, (state) => {
        copied = 0;
        skipped.length = 0;
        for (const b of blocks) {
          const label = `"${b.cell.name}" ${targetDates[b.dayIdx]} ${slotToTime(b.start)}`;
          let reason = "";
          for (let s = b.start; s < b.end && !reason; s++) {
            const existing = state[`${b.dayIdx}-${s}`] as PlanSlot | undefined;
            if (existing && existing.name && existing.type !== "cleared") reason = `taken by "${existing.name}"`;
            else if (sleeping.has(s)) reason = "falls in sleep hours";
          }
          if (!reason) {
            const clash = habitsFor(b.dayIdx).find((h: any) => {
              try { return timeToSlot(h.startTime) < b.end && timeToEndSlot(h.endTime) > b.start; } catch { return false; }
            });
            if (clash) reason = `overlaps the habit "${clash.name}"`;
          }
          if (reason) { skipped.push(`${label}: ${reason}`); continue; }
          for (let s = b.start; s < b.end; s++) state[`${b.dayIdx}-${s}`] = { ...b.cell };
          copied++;
        }
        if (args.includeReminders) {
          const mine = ((source.reminders as any[]) || []);
          state.reminders = [
            ...((state.reminders as any[]) || []),
            ...mine.map((r) => ({ ...r, id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` })),
          ];
          remindersCopied = mine.length;
        }
      });

      return `Copied ${copied} of ${blocks.length} block(s) from ${formatWeekDisplay(fromWeek)} into ${formatWeekDisplay(toWeek)}${remindersCopied ? ` and ${remindersCopied} reminder(s)` : ""}.` +
        (skipped.length ? `\nSkipped (nothing was overwritten):\n- ${skipped.join("\n- ")}` : "");
    }

    case "clear_day": {
      const date = parseDate(args.date);
      const weekStr = dateToWeekStr(date);
      const dayIdx = dateToDayIdx(date);
      const iso = args.date;
      const keep = args.keepInMissedLibrary !== false;

      const state = (await loadWeekStates(admin, userId, [weekStr])).get(weekStr) || {};
      const blocks = deriveDay(state, [], dayIdx, iso).filter((t) => t.type === "goal" || t.type === "custom");
      if (blocks.length === 0) return `Nothing to clear on ${iso}: no goal or task blocks (habits are never cleared).`;

      if (keep) {
        const ids = [...new Set(blocks.map((b) => b.goalId).filter(Boolean))] as string[];
        const { data: goalRows } = ids.length ? await admin.from("goals").select("id, title, name").in("id", ids).eq("user_id", userId) : { data: [] };
        const titleOf = new Map<string, string>((goalRows || []).map((g: any) => [g.id, g.title || String(g.name).slice(0, 60)]));
        const { error } = await admin.from("missed_tasks").insert(blocks.map((b) => ({
          user_id: userId,
          name: b.name,
          description: [b.description, b.goalId && titleOf.get(b.goalId) ? `Goal: ${titleOf.get(b.goalId)}` : "", `Was planned for ${iso}`].filter(Boolean).join(" · "),
          startTime: slotToTime(b.startSlot),
          endTime: slotToTime(Math.min(47, b.endSlot)),
          daysOfWeek: [],
        })));
        if (error) throw new Error(`Nothing was cleared, because the Missed Library could not be written: ${error.message}`);
      }

      await mutateWeekState(admin, userId, weekStr, (st) => {
        for (const b of blocks) {
          for (let s = b.startSlot; s < b.endSlot; s++) {
            const cell = st[`${dayIdx}-${s}`] as PlanSlot | undefined;
            if (cell && cell.name === b.name && (cell.type === "goal" || cell.type === "custom")) delete st[`${dayIdx}-${s}`];
          }
        }
      });
      return `Cleared ${blocks.length} block(s) on ${iso}: ${blocks.map((b) => `"${b.name}"`).join(", ")}.${keep ? " Each one is saved in the Missed Library." : ""}`;
    }

    case "update_goal_plan_item": {
      const { data: goal, error } = await admin.from("goals").select("id, name, title, goalType, plans").eq("id", args.goalId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!goal) throw new Error(`No goal found with id ${args.goalId}.`);
      if (!Array.isArray(goal.plans) || goal.plans.length === 0) throw new Error("This goal has no plan yet: call set_goal_plan first.");
      if (!args.title && !args.date) throw new Error("Say which phase: pass its title and/or a date inside it.");

      const patchTitle = args.newTitle !== undefined ? String(args.newTitle).trim() : undefined;
      if (patchTitle === "") throw new Error("newTitle cannot be empty.");
      if (patchTitle === undefined && args.description === undefined && args.estimatedHours === undefined) throw new Error("Nothing to change: pass newTitle, description or estimatedHours.");

      const plans = JSON.parse(JSON.stringify(goal.plans)) as any[];
      const found: { slot: any; label: string }[] = [];
      const walk = (list: any[], trail: string[]) => list.forEach((p) => {
        const here = [...trail, p.dayTask];
        found.push({ slot: p, label: here.join(" > ") });
        if (Array.isArray(p.subPlans)) walk(p.subPlans, here);
      });
      walk(plans, []);

      let hits = found;
      if (args.title) {
        const wanted = String(args.title).trim().toLowerCase();
        const exact = hits.filter((h) => String(h.slot.dayTask).trim().toLowerCase() === wanted);
        hits = exact.length ? exact : hits.filter((h) => String(h.slot.dayTask).toLowerCase().includes(wanted));
      }
      if (args.date) {
        const inside = hits.filter((h) => h.slot.periodStart && h.slot.periodEnd && h.slot.periodStart <= args.date && args.date <= h.slot.periodEnd);
        const span = (h: { slot: any }) => Date.parse(h.slot.periodEnd) - Date.parse(h.slot.periodStart);
        const shortest = inside.length ? Math.min(...inside.map(span)) : 0;
        hits = inside.filter((h) => span(h) === shortest);
      }
      if (hits.length === 0) throw new Error("No phase matches. Call get_goals to see the plan outline.");
      if (hits.length > 1) throw new Error(`${hits.length} phases match: ${hits.slice(0, 8).map((h) => `"${h.label}"`).join("; ")}. Add a date, or use more of the title.`);

      const slot = hits[0].slot;
      if (patchTitle !== undefined) slot.dayTask = patchTitle;
      if (args.description !== undefined) slot.description = String(args.description).trim();
      if (args.estimatedHours !== undefined) slot.estimatedHours = Number(args.estimatedHours);

      const { error: saveErr } = await admin.from("goals").update({ plans, updatedAt: new Date().toISOString() }).eq("id", goal.id).eq("user_id", userId);
      if (saveErr) throw new Error(saveErr.message);
      return `Updated "${hits[0].label}" in "${goal.title || String(goal.name).slice(0, 60)}".`;
    }

    case "get_day": {
      const { tzOffset } = await loadProfile(admin, userId);
      const d = anchorDate(args?.date, tzOffset);
      const [day] = await loadDays(admin, userId, d, d, tzOffset);
      const real = day.tasks.filter((t) => t.type !== "reminder");
      const count = (s: TaskStatus) => real.filter((t) => t.status === s).length;
      return JSON.stringify({
        date: day.iso,
        weekday: day.weekday,
        userToday: localTodayISO(tzOffset),
        summary: { done: count("done"), missed: count("missed"), pending: count("pending"), upcoming: count("upcoming") },
        tasks: day.tasks.map(fmtTask),
      }, null, 2);
    }

    case "get_completions": {
      const { tzOffset } = await loadProfile(admin, userId);
      const from = parseDate(args.from);
      const to = anchorDate(args.to, tzOffset);
      const span = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
      if (span < 1) throw new Error("to must not be before from.");
      if (span > 42) throw new Error("Ask for at most 42 days at a time.");

      const [days, { data: goalRows }] = await Promise.all([
        loadDays(admin, userId, from, to, tzOffset),
        admin.from("goals").select("id, name, title").eq("user_id", userId),
      ]);
      const goalName = new Map<string, string>((goalRows || []).map((g: any) => [g.id, g.title || g.name]));

      const byGoal = new Map<string, { goal: string; plannedHours: number; doneHours: number; done: number; missed: number }>();
      const byHabit = new Map<string, { habit: string; done: number; missed: number }>();
      let done = 0;
      let missed = 0;

      const perDay = days.map((day) => {
        const real = day.tasks.filter((t) => t.type !== "reminder");
        const dDone = real.filter((t) => t.status === "done");
        const dMissed = real.filter((t) => t.status === "missed");
        done += dDone.length;
        missed += dMissed.length;
        for (const t of [...dDone, ...dMissed]) {
          if (t.type === "goal" && t.goalId) {
            const row = byGoal.get(t.goalId) || { goal: goalName.get(t.goalId) || t.name, plannedHours: 0, doneHours: 0, done: 0, missed: 0 };
            row.plannedHours += hoursOf(t);
            if (t.status === "done") { row.doneHours += hoursOf(t); row.done++; } else row.missed++;
            byGoal.set(t.goalId, row);
          } else if (t.type === "habit") {
            const row = byHabit.get(t.name) || { habit: t.name, done: 0, missed: 0 };
            if (t.status === "done") row.done++; else row.missed++;
            byHabit.set(t.name, row);
          }
        }
        return {
          date: day.iso,
          weekday: day.weekday,
          done: dDone.length,
          missed: dMissed.length,
          ahead: real.length - dDone.length - dMissed.length,
          missedBlocks: dMissed.map(fmtTask),
        };
      });

      const rate = (d: number, m: number) => (d + m > 0 ? Math.round((d / (d + m)) * 100) : null);
      return JSON.stringify({
        from: dateStr(from),
        to: dateStr(to),
        userToday: localTodayISO(tzOffset),
        overall: { done, missed, executionRatePercent: rate(done, missed) },
        goals: [...byGoal.entries()].map(([goalId, g]) => ({ goalId, ...g, executionRatePercent: rate(g.done, g.missed) })),
        habits: [...byHabit.values()].map((h) => ({ ...h, consistencyPercent: rate(h.done, h.missed) })),
        days: perDay,
      }, null, 2);
    }

    case "complete_task":
    case "uncomplete_task": {
      const markDone = name === "complete_task";
      if (args.time === undefined && !args.name) throw new Error("Pass the block's time or its name.");
      const { tzOffset } = await loadProfile(admin, userId);
      const d = parseDate(args.date);
      const [day] = await loadDays(admin, userId, d, d, tzOffset);

      let matches = day.tasks;
      if (args.name) {
        const wanted = String(args.name).trim().toLowerCase();
        const exact = matches.filter((t) => t.name.trim().toLowerCase() === wanted);
        matches = exact.length ? exact : matches.filter((t) => t.name.toLowerCase().includes(wanted));
      }
      if (args.time !== undefined) {
        const slot = timeToSlot(args.time);
        matches = matches.filter((t) => (t.type === "reminder" ? t.startSlot === slot : slot >= t.startSlot && slot < t.endSlot));
      }
      if (matches.length === 0) {
        const have = day.tasks.map((t) => `"${t.name}" ${slotToTime(t.startSlot)}`).join(", ") || "nothing scheduled";
        throw new Error(`No matching block on ${args.date}. That day has: ${have}.`);
      }
      if (matches.length > 1) {
        throw new Error(`More than one block matches on ${args.date}: ${matches.map((t) => `"${t.name}" ${slotToTime(t.startSlot)}`).join(", ")}. Add the time to pick one.`);
      }

      const task = matches[0];
      const existing = (await loadCompleted(admin, userId, [day.dayStr])).get(day.dayStr) || [];
      const next = markDone ? [...new Set([...existing, task.id])] : existing.filter((id) => id !== task.id);
      const { error } = await admin.from("completed_tasks")
        .upsert({ user_id: userId, dayStr: day.dayStr, taskIds: next }, { onConflict: 'user_id,"dayStr"' });
      if (error) throw new Error(error.message);
      return `${markDone ? "Marked done" : "Marked not done"}: "${task.name}" on ${args.date} (${slotToTime(task.startSlot)}).`;
    }

    case "get_missed_tasks": {
      const { data, error } = await admin.from("missed_tasks").select("*").eq("user_id", userId).order("createdAt", { ascending: true });
      if (error) throw new Error(error.message);
      return JSON.stringify({
        missedTasks: (data || []).map((m: any) => ({
          id: m.id, name: m.name, description: m.description || undefined, startTime: m.startTime, endTime: m.endTime, addedOn: String(m.createdAt || "").slice(0, 10),
        })),
      }, null, 2);
    }

    case "add_missed_task": {
      if (!args.name?.trim()) throw new Error("name is required");
      timeToSlot(args.startTime);
      timeToEndSlot(args.endTime);
      const { data, error } = await admin.from("missed_tasks").insert({
        user_id: userId,
        name: args.name.trim(),
        description: args.description?.trim() || null,
        startTime: args.startTime,
        endTime: args.endTime,
        daysOfWeek: [],
      }).select("id").single();
      if (error) throw new Error(error.message);
      return `Added "${args.name.trim()}" to the Missed Library (id ${data.id}).`;
    }

    case "restore_missed_task": {
      const { data: row, error } = await admin.from("missed_tasks").select("*").eq("id", args.id).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error(`No Missed Library item with id ${args.id}.`);
      const placed = await runTool(admin, userId, "place_task", {
        date: args.date,
        startTime: args.startTime || row.startTime,
        endTime: args.endTime || row.endTime,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        ...(args.goalId ? { goalId: args.goalId } : {}),
        ...(args.bucket ? { bucket: args.bucket } : {}),
      });
      const { error: delErr } = await admin.from("missed_tasks").delete().eq("id", args.id).eq("user_id", userId);
      if (delErr) throw new Error(`${placed} But it could not be removed from the Missed Library: ${delErr.message}`);
      return `${placed} Removed from the Missed Library.`;
    }

    case "delete_missed_task": {
      const { data, error } = await admin.from("missed_tasks").delete().eq("id", args.id).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No Missed Library item with id ${args.id}.`);
      return `Removed "${data[0].name}" from the Missed Library.`;
    }

    case "get_custom_tasks": {
      const { data, error } = await admin.from("custom_tasks").select("*").eq("user_id", userId).order("createdAt", { ascending: true });
      if (error) throw new Error(error.message);
      return JSON.stringify({
        customTasks: (data || []).map((t: any) => ({
          id: t.id, name: t.name, description: t.description || undefined, startTime: t.startTime, endTime: t.endTime,
          days: (t.daysOfWeek || []).length ? t.daysOfWeek : undefined, bucket: t.bucket ?? "MISSING",
        })),
      }, null, 2);
    }

    case "create_custom_task": {
      const bucket = parseBucket(args.bucket, "task");
      if (!args.name?.trim()) throw new Error("name is required");
      timeToSlot(args.startTime);
      timeToEndSlot(args.endTime);
      const days: string[] = (args.days || []).filter((x: string) => DAY_NAMES.includes(x));
      const { data, error } = await admin.from("custom_tasks").insert({
        user_id: userId,
        name: args.name.trim(),
        description: args.description?.trim() || null,
        startTime: args.startTime,
        endTime: args.endTime,
        daysOfWeek: days,
        bucket,
      }).select("id").single();
      if (error) throw new Error(error.message);
      return `Added "${args.name.trim()}" (${bucket}) to the Task Library (id ${data.id}).`;
    }

    case "get_vault_notes": {
      if (args.category !== undefined && !VAULT_CATEGORY_LIST.includes(args.category)) throw new Error(`category must be one of: ${VAULT_CATEGORY_LIST.join(", ")}.`);
      let q = admin.from("vault_notes").select("*").eq("user_id", userId);
      if (args.category) q = q.eq("category", args.category);
      const { data, error } = await q.order("is_pinned", { ascending: false }).order("createdAt", { ascending: false });
      if (error) throw new Error(error.message);
      const needle = String(args.query || "").trim().toLowerCase();
      const notes = (data || [])
        .filter((n: any) => !needle || `${n.title} ${n.content} ${JSON.stringify(n.tags || [])}`.toLowerCase().includes(needle))
        .slice(0, Math.min(Number(args.limit) || 30, 100))
        .map((n: any) => ({
          id: n.id, title: n.title || undefined, content: n.content, category: n.category, tags: n.tags || [], pinned: !!n.is_pinned,
          created: String(n.createdAt || "").slice(0, 10),
        }));
      return JSON.stringify({ notes }, null, 2);
    }

    case "add_vault_note": {
      const content = typeof args.content === "string" ? args.content.trim() : "";
      if (!content) throw new Error("content is required");
      const category = args.category ?? "ideas";
      if (!VAULT_CATEGORY_LIST.includes(category)) throw new Error(`category must be one of: ${VAULT_CATEGORY_LIST.join(", ")}.`);
      const tags = [...new Set((content.match(/#[\w-]+/g) ?? []).map((t: string) => t.slice(1).toLowerCase()))];
      const { data, error } = await admin.from("vault_notes").insert({
        user_id: userId,
        title: (args.title || "").trim(),
        content,
        category,
        tags,
        is_pinned: !!args.pinned,
        source_page: "assistant",
      }).select("id").single();
      if (error) throw new Error(error.message);
      return `Saved to the Vault under ${category} (id ${data.id})${tags.length ? `, tags: ${tags.join(", ")}` : ""}.`;
    }

    case "set_vault_reminder": {
      if (!REPEAT_TYPES.includes(args.repeat)) throw new Error(`repeat must be one of: ${REPEAT_TYPES.join(", ")}.`);
      const { data: note, error } = await admin.from("vault_notes").select("id, title, content").eq("id", args.noteId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!note) throw new Error(`No Vault note with id ${args.noteId}.`);
      const { tzOffset } = await loadProfile(admin, userId);
      const fire = nextFireFor(args.repeat, args.time, args.date, tzOffset);
      const title = (args.title || note.title || String(note.content).slice(0, 60)).trim();
      const { error: insErr } = await admin.from("vault_reminders").insert({
        user_id: userId,
        note_id: note.id,
        title,
        body: args.body?.trim() || null,
        repeat_type: args.repeat,
        remind_at: args.repeat === "random" ? null : args.time,
        next_fire: fire.toISOString(),
        is_active: true,
        snooze_count: 0,
      });
      if (insErr) throw new Error(insErr.message);
      const local = new Date(fire.getTime() - tzOffset * 60000).toISOString().slice(0, 16).replace("T", " ");
      return `Reminder "${title}" (${args.repeat}) set. First notification: ${local} local time.`;
    }

    case "get_profile": {
      const { data, error } = await admin.from("user_profiles").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return JSON.stringify({ profile: null, note: "The user has not set up a profile yet; plan with a 3 hour daily budget." });
      const ep = (data.execution_profile || {}) as any;
      const stated = parseFloat(data.daily_free_hours ?? "");
      const FREE: Record<string, number> = { lt1: 1, "1to2": 2, "2to4": 4, "4plus": 5 };
      const weekdayBand = ep?.situation?.weekdayFree;
      const target = stated > 0 ? stated : weekdayBand ? FREE[weekdayBand] ?? 3 : 3;
      const weekendBand = ep?.situation?.weekendFree;
      return JSON.stringify({
        name: data.full_name || undefined,
        sleep: { start: data.sleep_start, hours: data.sleep_duration },
        weekStartsOn: data.week_start,
        planningSession: { day: data.plan_day, from: data.plan_start_time, to: data.plan_end_time },
        situation: situationOf(ep).map((x) => SITUATION_LABELS[x] ?? x),
        primaryLifeFocus: data.primary_life_focus || undefined,
        biggestChallenge: data.biggest_challenge || undefined,
        energyPeak: data.energy_peak_time,
        focusAbility: data.focus_ability,
        taskSwitching: data.task_shifting_ability,
        executionProfile: ep && Object.keys(ep).length ? ep : undefined,
        dailyHourBudget: {
          weekdayTargetHours: target,
          weekdayMaxHours: Math.max(target, Math.ceil(target * 1.5)),
          weekendTargetHours: weekendBand ? FREE[weekendBand] ?? target : target,
          note: "Goal work per day. Keep a week's goal blocks at or under the weekday target x 5 plus the weekend target x 2.",
        },
        timezoneOffsetMinutes: Number(data.notification_prefs?.timezoneOffset ?? 0),
      }, null, 2);
    }

    case "get_stats": {
      const { tzOffset } = await loadProfile(admin, userId);
      const span = Math.min(Math.max(Math.round(Number(args?.days) || 28), 7), 90);
      const today = parseDate(localTodayISO(tzOffset));
      const from = addDays(today, -(span - 1));
      const [days, { data: goalRows }] = await Promise.all([
        loadDays(admin, userId, from, today, tzOffset),
        admin.from("goals").select("id, name, title, endDate, milestones, plans").eq("user_id", userId),
      ]);
      const todayIso = dateStr(today);
      const rate = (d: number, m: number) => (d + m > 0 ? Math.round((d / (d + m)) * 100) : null);

      const weeks = new Map<string, { done: number; missed: number }>();
      const habits = new Map<string, { done: number; missed: number }>();
      const goals = new Map<string, { plannedHours: number; doneHours: number; done: number; missed: number }>();
      let streak = 0;
      let streakOpen = true;

      for (const day of [...days].reverse()) {
        const real = day.tasks.filter((t) => t.type !== "reminder");
        const decided = real.filter((t) => t.status === "done" || t.status === "missed");
        const anyDone = real.some((t) => t.status === "done");
        if (streakOpen) {
          if (anyDone) streak++;
          else if (day.iso !== todayIso) streakOpen = false;
        }
        const wk = weeks.get(dateToWeekStr(parseDate(day.iso))) || { done: 0, missed: 0 };
        for (const t of decided) {
          const isDone = t.status === "done";
          if (isDone) wk.done++; else wk.missed++;
          if (t.type === "habit") {
            const h = habits.get(t.name) || { done: 0, missed: 0 };
            if (isDone) h.done++; else h.missed++;
            habits.set(t.name, h);
          } else if (t.type === "goal" && t.goalId) {
            const g = goals.get(t.goalId) || { plannedHours: 0, doneHours: 0, done: 0, missed: 0 };
            g.plannedHours += hoursOf(t);
            if (isDone) { g.doneHours += hoursOf(t); g.done++; } else g.missed++;
            goals.set(t.goalId, g);
          }
        }
        weeks.set(dateToWeekStr(parseDate(day.iso)), wk);
      }

      return JSON.stringify({
        from: dateStr(from),
        to: todayIso,
        activeStreakDays: streak,
        weeks: [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, w]) => ({ week, ...w, executionRatePercent: rate(w.done, w.missed) })),
        habits: [...habits.entries()].map(([habit, h]) => ({ habit, ...h, consistencyPercent: rate(h.done, h.missed) })).sort((a, b) => (a.consistencyPercent ?? 0) - (b.consistencyPercent ?? 0)),
        goals: (goalRows || []).map((g: any) => {
          const s = goals.get(g.id) || { plannedHours: 0, doneHours: 0, done: 0, missed: 0 };
          const overdue = ((g.milestones || []) as any[]).filter((m) => !m.completed && m.targetDate && m.targetDate < todayIso);
          return {
            goalId: g.id,
            goal: g.title || g.name,
            hasPlan: Array.isArray(g.plans) && g.plans.length > 0,
            overdueMilestones: overdue.map((m) => `${m.title} (due ${m.targetDate})`),
            plannedHours: s.plannedHours,
            doneHours: s.doneHours,
            executionRatePercent: rate(s.done, s.missed),
            attention: !(Array.isArray(g.plans) && g.plans.length > 0) ? "No plan yet: call set_goal_plan."
              : overdue.length ? "A milestone is overdue: re-baseline it with update_milestone or catch up."
              : s.plannedHours === 0 ? "No work scheduled for this goal in this period."
              : undefined,
          };
        }),
      }, null, 2);
    }

    case "update_habit": {
      const patch: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (args.name !== undefined) {
        if (!String(args.name).trim()) throw new Error("name cannot be empty.");
        patch.name = String(args.name).trim();
      }
      if (args.purpose !== undefined) patch.purpose = String(args.purpose).trim();
      if (args.startTime !== undefined) { timeToSlot(args.startTime); patch.startTime = args.startTime; }
      if (args.endTime !== undefined) { timeToEndSlot(args.endTime); patch.endTime = args.endTime; }
      if (args.days !== undefined) patch.daysOfWeek = (args.days as string[]).filter((x) => DAY_NAMES.includes(x));
      if (args.endDate !== undefined) {
        if (!parseISODate(args.endDate)) throw new Error("endDate must be a valid YYYY-MM-DD date.");
        patch.endDate = args.endDate;
      }
      if (args.bucket !== undefined) patch.bucket = parseBucket(args.bucket, "habit");
      if (Object.keys(patch).length === 1) throw new Error("Nothing to change: pass at least one field.");

      const { data, error } = await admin.from("habits").update(patch).eq("id", args.habitId).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No habit found with id ${args.habitId}.`);
      return `Updated habit "${data[0].name}".`;
    }

    case "delete_habit": {
      const { data, error } = await admin.from("habits").delete().eq("id", args.habitId).eq("user_id", userId).select("name");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No habit found with id ${args.habitId}.`);
      return `Deleted habit "${data[0].name}".`;
    }

    case "delete_goal": {
      const { data, error } = await admin.from("goals").delete().eq("id", args.goalId).eq("user_id", userId).select("name, title");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(`No goal found with id ${args.goalId}.`);
      return `Deleted goal "${data[0].title || String(data[0].name).slice(0, 60)}".`;
    }

    case "place_tasks": {
      if (!Array.isArray(args.tasks) || args.tasks.length === 0) throw new Error("Provide at least one task.");
      if (args.tasks.length > 40) throw new Error("At most 40 tasks per call.");
      const lines: string[] = [];
      let ok = 0;
      for (let i = 0; i < args.tasks.length; i++) {
        try {
          lines.push(`${i + 1}. ${await runTool(admin, userId, "place_task", args.tasks[i])}`);
          ok++;
        } catch (err: any) {
          lines.push(`${i + 1}. FAILED "${args.tasks[i]?.name ?? ""}": ${err?.message || err}`);
        }
      }
      return `Placed ${ok} of ${args.tasks.length}.\n${lines.join("\n")}`;
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

// Claude's custom-connector form only offers a fixed list of header names, and reserves Authorization for OAuth, so the
// secret can arrive in any of these. A "Bearer " prefix is tolerated everywhere.
const TOKEN_HEADERS = ["x-connector-token", "x-api-key", "x-api-token", "api-key", "api-token", "x-auth-token", "x-access-token", "authorization"];

function tokenFromHeaders(headers: Headers): string {
  for (const name of TOKEN_HEADERS) {
    const value = (headers.get(name) || "").replace(/^Bearer\s+/i, "").trim();
    if (value) return value;
  }
  return "";
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
    const headerToken = tokenFromHeaders(req.headers);
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
