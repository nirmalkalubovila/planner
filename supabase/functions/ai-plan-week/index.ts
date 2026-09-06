// supabase/functions/ai-plan-week/index.ts
// "Plan my next week" -- the centerpiece of connecting a user's own AI
// (Claude / ChatGPT / Gemini, whichever they connected in Settings) to
// this planner.
//
// This function deliberately does NOT write to week_plans itself. The
// client already has a conflict-safe, undo-able, autosaving write path
// for the grid (useSaveWeekPlan + usePlannerHistory) -- duplicating that
// logic here would create a second, riskier way to write the same table.
// Instead this function only gathers context (goals, milestones, habits,
// sleep schedule, what's already on the grid) and asks the user's own AI
// for a list of proposed blocks for the *currently free* time. The
// client then merges that into the grid through the normal save path, so
// an AI-planned week is undoable exactly like any manual edit.

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProposedBlock {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  name: string;
  type: "goal" | "custom";
  description?: string;
  goalId?: string;
}

// ─── Week math (mirrors WeekUtils.getDaysForWeek / send-push-notifications) ──

function parseWeek(weekStr: string) {
  const [year, week] = weekStr.split("-").map(Number);
  return { year, week };
}

function getDaysForWeek(weekStr: string): Date[] {
  const { year, week } = parseWeek(weekStr);
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const startDay = startOfYear.getUTCDay() || 7;
  const daysToStartOfWeek = (week - 1) * 7 - (startDay - 1);
  const startOfWeek = new Date(Date.UTC(year, 0, 1 + daysToStartOfWeek));

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000));
  }
  return dates;
}

function formatWeekDisplay(weekStr: string): string {
  const dates = getDaysForWeek(weekStr);
  const start = dates[0];
  const end = dates[6];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y1 = start.getUTCFullYear();
  const y2 = end.getUTCFullYear();
  const left = `${months[start.getUTCMonth()]} ${start.getUTCDate()}${y1 !== y2 ? `, ${y1}` : ""}`;
  const right = `${months[end.getUTCMonth()]} ${end.getUTCDate()}, ${y2}`;
  return `${left} - ${right}`;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function slotToTime(slotIdx: number): string {
  const hour = Math.floor(slotIdx / 2);
  const min = (slotIdx % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Turns a day's filled grid slots into readable "HH:mm-HH:mm Name" ranges. */
function summarizeBusySlots(state: Record<string, any> | undefined, dayIdx: number): string[] {
  const ranges: string[] = [];
  let runStart = -1;
  let runName = "";

  const flush = (endSlot: number) => {
    if (runStart >= 0) {
      ranges.push(`${slotToTime(runStart)}-${slotToTime(endSlot)} ${runName}`);
      runStart = -1;
    }
  };

  for (let slot = 0; slot < 48; slot++) {
    const cell = state?.[`${dayIdx}-${slot}`];
    const name = cell && cell.type !== "cleared" ? (cell.name || cell.type) : null;
    if (name) {
      if (runStart >= 0 && name === runName) {
        continue; // still inside the same block
      }
      flush(slot);
      runStart = slot;
      runName = name;
    } else {
      flush(slot);
    }
  }
  flush(48);
  return ranges;
}

function cleanJsonResponse(text: string): string {
  let cleaned = text
    .replace(/^```json\n?/gm, "")
    .replace(/^```\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
  const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (arrayMatch) cleaned = arrayMatch[1];
  return cleaned;
}

function validateBlocks(parsed: unknown): ProposedBlock[] {
  if (!Array.isArray(parsed)) throw new Error("AI did not return a JSON array");
  const valid = parsed.filter((b: any) =>
    b && typeof b.date === "string" && typeof b.startTime === "string" &&
    typeof b.endTime === "string" && typeof b.name === "string"
  ).map((b: any) => ({
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    name: b.name,
    type: b.type === "goal" ? "goal" : "custom",
    description: typeof b.description === "string" ? b.description : undefined,
    goalId: typeof b.goalId === "string" ? b.goalId : undefined,
  }));
  if (valid.length === 0) throw new Error("AI returned no usable schedule blocks");
  return valid;
}

// ─── Provider calls -- each takes the USER'S OWN key, never an app key ──

async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Claude API error");
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Claude returned an empty response");
  return text;
}

async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "ChatGPT API error");
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("ChatGPT returned an empty response");
  return text;
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!response.ok || !text) throw new Error(data?.error?.message || "Gemini API error");
  return text;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
};

async function callProvider(provider: string, model: string | null, apiKey: string, prompt: string): Promise<string> {
  const resolvedModel = model || DEFAULT_MODELS[provider];
  if (provider === "anthropic") return callAnthropic(prompt, apiKey, resolvedModel);
  if (provider === "openai") return callOpenAI(prompt, apiKey, resolvedModel);
  if (provider === "gemini") return callGemini(prompt, apiKey, resolvedModel);
  throw new Error(`Unsupported provider: ${provider}`);
}

// ─── Main handler ──────────────────────────────────────────────

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("AI_SETTINGS_ENCRYPTION_KEY");
    if (!encryptionKey) throw new Error("Missing AI_SETTINGS_ENCRYPTION_KEY secret on server.");

    // Scoped to the caller's own JWT -- every read below is naturally
    // limited to this user's own rows via RLS, same as the app's own hooks.
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { week } = await req.json();
    if (!week || typeof week !== "string") {
      return new Response(JSON.stringify({ error: "Missing week (e.g. '2026-10')" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. This user's AI connection.
    const { data: aiSettings, error: aiSettingsError } = await supabaseUser
      .rpc("get_user_ai_settings")
      .maybeSingle();
    if (aiSettingsError) throw new Error(aiSettingsError.message);
    if (!aiSettings || !aiSettings.has_api_key) {
      return new Response(JSON.stringify({
        error: "No AI connected yet. Go to Profile > AI Assistant to connect Claude, ChatGPT, or Gemini.",
        code: "NO_AI_CONNECTED",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypting requires the service-role client -- the RPC itself
    // refuses any caller that isn't service_role.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: apiKey, error: keyError } = await supabaseAdmin.rpc("get_decrypted_user_ai_api_key", {
      p_user_id: user.id,
      p_encryption_key: encryptionKey,
    });
    if (keyError) throw new Error(keyError.message);
    if (!apiKey) throw new Error("Stored AI key could not be decrypted. Reconnect your AI in Settings.");

    // 2. Gather this user's plan: goals+milestones, habits, sleep, and
    //    what's already on the target week's grid.
    const dbWeekKey = formatWeekDisplay(week);
    const weekDates = getDaysForWeek(week);
    const weekStart = dateStr(weekDates[0]);
    const weekEnd = dateStr(weekDates[6]);

    const [goalsRes, habitsRes, profileRes, weekPlanRes] = await Promise.all([
      supabaseUser.from("goals").select("*").eq("user_id", user.id),
      supabaseUser.from("habits").select("*").eq("user_id", user.id),
      supabaseUser.from("user_profiles").select("sleep_start, sleep_duration").eq("user_id", user.id).maybeSingle(),
      supabaseUser.from("week_plans").select("state").eq("week", dbWeekKey).eq("user_id", user.id).maybeSingle(),
    ]);
    if (goalsRes.error) throw new Error(goalsRes.error.message);
    if (habitsRes.error) throw new Error(habitsRes.error.message);

    const activeGoals = (goalsRes.data || []).filter((g: any) =>
      (!g.startDate || g.startDate <= weekEnd) && (!g.endDate || g.endDate >= weekStart)
    );
    const activeHabits = (habitsRes.data || []).filter((h: any) =>
      (!h.startDate || h.startDate <= weekEnd) && (!h.endDate || h.endDate >= weekStart)
    );
    const sleepStart = profileRes.data?.sleep_start || "22:00";
    const sleepDuration = profileRes.data?.sleep_duration || "8";
    const gridState = (weekPlanRes.data?.state || {}) as Record<string, any>;

    if (activeGoals.length === 0) {
      return new Response(JSON.stringify({
        error: "No active goals overlap this week yet -- add a goal first so the AI has something to plan toward.",
        code: "NO_ACTIVE_GOALS",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Build one prompt describing the whole week.
    const goalsText = activeGoals.map((g: any) => {
      const milestones = (g.milestones || [])
        .filter((m: any) => !m.completed)
        .map((m: any) => `    - "${m.title}" due ${m.targetDate}`)
        .join("\n") || "    (no open milestones)";
      return `- Goal id ${g.id}: "${g.name}" (${g.purpose || "no stated purpose"}), ends ${g.endDate}\n${milestones}`;
    }).join("\n");

    const habitsText = activeHabits.map((h: any) =>
      `- "${h.name}" ${h.startTime}-${h.endTime} on ${(h.daysOfWeek || []).join(", ") || "every day"}`
    ).join("\n") || "(no recurring habits)";

    const daysText = weekDates.map((d, dayIdx) => {
      const busy = summarizeBusySlots(gridState, dayIdx);
      const habitLines = activeHabits
        .filter((h: any) => {
          const days = h.daysOfWeek || [];
          return days.length === 0 || days.includes(DAY_NAMES[dayIdx]) || days.includes(SHORT_DAY_NAMES[dayIdx]);
        })
        .map((h: any) => `${h.startTime}-${h.endTime} ${h.name} (habit)`);
      const allBusy = [...busy, ...habitLines];
      return `${DAY_NAMES[dayIdx]} ${dateStr(d)}: ${allBusy.length ? allBusy.join("; ") : "nothing scheduled yet"}`;
    }).join("\n");

    const prompt = `You are planning one week of a real person's schedule inside their personal planner app.

THEIR SLEEP SCHEDULE: goes to bed ${sleepStart}, sleeps ${sleepDuration} hours. Never schedule anything during sleep.

THEIR ACTIVE GOALS THIS WEEK:
${goalsText}

THEIR RECURRING HABITS:
${habitsText}

WHAT'S ALREADY ON THE CALENDAR THIS WEEK (never schedule over these times):
${daysText}

TASK: Propose focused work sessions that make real progress on the goals above, placed ONLY into time that is not already listed as busy and not during sleep. Prefer the person's likely productive hours (morning/evening, not overnight). Do not overload any single day -- a few solid sessions beat cramming. Tie each session to a specific goal where possible using its exact "Goal id".

Return ONLY a JSON array, no markdown, no commentary. Each item must have exactly these keys:
{
  "date": "YYYY-MM-DD" (must be one of the 7 dates listed above),
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "name": "short task title",
  "type": "goal" or "custom",
  "description": "one sentence on what to do",
  "goalId": "the exact Goal id from above, only if type is goal"
}`;

    const rawText = await callProvider(aiSettings.provider, aiSettings.model, apiKey, prompt);
    const blocks = validateBlocks(JSON.parse(cleanJsonResponse(rawText)));

    return new Response(JSON.stringify({ blocks, weekDates: weekDates.map(dateStr) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ai-plan-week error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
