// supabase/functions/send-push-notifications/index.ts
// Supabase Edge Function — Cron-triggered push & email notification sender
// Sends Web Push & Email notifications for: task reminders, overdue tasks, daily briefing, goal deadlines

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
// @ts-ignore
import nodemailer from "https://esm.sh/nodemailer@6.9.13";

// Ambient declaration for Deno in editor environments
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};


// ─── Web Push Helpers (VAPID + Encryption) ─────────────────────

/**
 * Convert a base64url-encoded string to a Uint8Array.
 */
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Convert a Uint8Array to a base64url-encoded string.
 */
function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Import a raw ECDSA P-256 private key for signing.
 */
async function importVapidPrivateKey(
  rawPrivateKeyB64url: string,
  rawPublicKeyB64url: string
): Promise<CryptoKey> {
  const privateKeyBytes = base64urlToUint8Array(rawPrivateKeyB64url);
  const publicKeyBytes = base64urlToUint8Array(rawPublicKeyB64url);

  // Build JWK from raw keys
  const x = uint8ArrayToBase64url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64url(privateKeyBytes);

  const jwk = { kty: "EC", crv: "P-256", x, y, d };

  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
  ]);
}

/**
 * Create a VAPID Authorization header (JWT signed with ECDSA P-256).
 */
async function createVapidAuthHeader(
  endpoint: string,
  subject: string,
  publicKeyB64url: string,
  privateKeyB64url: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encHeader = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encHeader}.${encPayload}`;

  const key = await importVapidPrivateKey(privateKeyB64url, publicKeyB64url);

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sig = new Uint8Array(signatureBuffer);
  let r: Uint8Array, s: Uint8Array;

  if (sig.length === 64) {
    r = sig.slice(0, 32);
    s = sig.slice(32);
  } else {
    // DER encoded — parse it
    // DER: 0x30 <total_len> 0x02 <r_len> <r_bytes> 0x02 <s_len> <s_bytes>
    let offset = 2; // skip 0x30 and total length
    offset++; // 0x02
    const rLen = sig[offset++];
    const rBytes = sig.slice(offset, offset + rLen);
    offset += rLen;
    offset++; // 0x02
    const sLen = sig[offset++];
    const sBytes = sig.slice(offset, offset + sLen);

    // Pad or trim to exactly 32 bytes
    r = new Uint8Array(32);
    s = new Uint8Array(32);
    r.set(rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes, 32 - Math.min(rBytes.length, 32));
    s.set(sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes, 32 - Math.min(sBytes.length, 32));
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const signature = uint8ArrayToBase64url(rawSig);
  const token = `${unsignedToken}.${signature}`;

  return {
    authorization: `vapid t=${token}, k=${publicKeyB64url}`,
    cryptoKey: `p256ecdsa=${publicKeyB64url}`,
  };
}

/**
 * Encrypt push message payload using Web Push encryption (aes128gcm).
 * Implements RFC 8291 (Message Encryption for Web Push) + RFC 8188 (Encrypted Content-Encoding).
 */
async function encryptPayload(
  clientPublicKeyB64url: string,
  clientAuthB64url: string,
  payloadText: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const clientPublicKeyBytes = base64urlToUint8Array(clientPublicKeyB64url);
  const clientAuthBytes = base64urlToUint8Array(clientAuthB64url);
  const payload = new TextEncoder().encode(payloadText);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import client's public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes as any,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive the content encryption key and nonce
  // Step 1: auth_info = "WebPush: info\0" + client_public + local_public
  const authInfoHeader = new TextEncoder().encode("WebPush: info\0");
  const authInfo = new Uint8Array(authInfoHeader.length + 65 + 65);
  authInfo.set(authInfoHeader, 0);
  authInfo.set(clientPublicKeyBytes, authInfoHeader.length);
  authInfo.set(localPublicKeyRaw, authInfoHeader.length + 65);

  // Import shared secret as HKDF key
  const sharedSecretKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, [
    "deriveBits",
  ]);

  // Step 2: IKM = HKDF(auth_secret, shared_secret, auth_info, 32)
  const ikmBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: clientAuthBytes as any, info: authInfo as any },
    sharedSecretKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Import IKM as HKDF key
  const ikmKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);

  // Step 3: Content Encryption Key = HKDF(salt, IKM, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as any, info: cekInfo as any },
    ikmKey,
    128
  );
  const cek = new Uint8Array(cekBits);

  // Step 4: Nonce = HKDF(salt, IKM, "Content-Encoding: nonce\0", 12)
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as any, info: nonceInfo as any },
    ikmKey,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Pad the payload: add a delimiter byte 0x02 and then padding
  const paddedPayload = new Uint8Array(payload.length + 1);
  paddedPayload.set(payload, 0);
  paddedPayload[payload.length] = 2; // record delimiter

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek as any, "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce as any },
    aesKey,
    paddedPayload as any
  );
  const encryptedBytes = new Uint8Array(encrypted);

  // Build aes128gcm header: salt (16) + rs (4 big-endian) + idlen (1) + keyid (65)
  const rs = payload.length + 1 + 16 + 1; // record size (at least padded+tag+overhead)
  const recordSize = 4096; // standard record size
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  // Record size as 4-byte big-endian
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  // Key ID length
  header[20] = 65;
  // Key ID = local public key
  header.set(localPublicKeyRaw, 21);

  // Combine header + encrypted data
  const ciphertext = new Uint8Array(header.length + encryptedBytes.length);
  ciphertext.set(header, 0);
  ciphertext.set(encryptedBytes, header.length);

  return { ciphertext, salt, localPublicKey: localPublicKeyRaw };
}

/**
 * Send a Web Push notification to a subscription endpoint.
 */
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; statusCode: number; gone: boolean }> {
  const payloadStr = JSON.stringify(payload);

  const { ciphertext } = await encryptPayload(subscription.p256dh, subscription.auth, payloadStr);
  const { authorization } = await createVapidAuthHeader(
    subscription.endpoint,
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Urgency: "high",
    },
    body: ciphertext as any,
  });

  return {
    success: response.status >= 200 && response.status < 300,
    statusCode: response.status,
    gone: response.status === 404 || response.status === 410,
  };
}


// ─── Email Format & Sending Helpers ───────────────────────────

/**
 * Replace placeholders inside template text
 */
function formatTemplate(
  bodyTemplate: string,
  subjectTemplate: string,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = subjectTemplate;
  let body = bodyTemplate;

  for (const [key, val] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    subject = subject.replaceAll(placeholder, val);
    body = body.replaceAll(placeholder, val);
  }

  return { subject, body };
}

/**
 * Dispatch transactional email via nodemailer
 */
async function sendMailNotification(
  transporter: any,
  senderName: string,
  senderEmail: string,
  toEmail: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      text: body,
      html: body.replaceAll("\n", "<br/>"),
    });
    console.log(`Email notification dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${toEmail}:`, err);
    return false;
  }
}


// ─── Notification Logic & Types ───────────────────────────────

interface UserSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  notification_prefs: {
    enabled?: boolean;
    taskReminders?: boolean;
    dailyBriefing?: boolean;
    goalDeadlines?: boolean;
    goalCompletion?: boolean;
    daySummary?: boolean;
    weeklySummary?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    sleepNotifications?: boolean;
    weeklyPlanning?: boolean;
  } | null;
  sleep_start: string | null;
  sleep_duration: string | null;
  plan_day: string | null;
  plan_start_time: string | null;
  plan_end_time: string | null;
}

interface WeekPlan {
  user_id: string;
  week: string;
  state: Record<string, any>;
}

interface Goal {
  id: string;
  user_id: string;
  name: string;
  endDate: string;
  milestones?: Array<{ completed: boolean }>;
}

interface Habit {
  id: string;
  user_id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  daysOfWeek?: string[];
  startDate?: string;
  endDate?: string;
}

interface CustomTask {
  id: string;
  user_id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek?: string[];
  isReminder?: boolean;
}

const MAX_NOTIFICATIONS_PER_HOUR = 5;
const TASK_REMINDER_MINUTES = 15;
const DEADLINE_DAYS = [7, 3, 1];

/**
 * Check if the current time is within quiet hours.
 */
function isQuietHours(prefs: UserProfile["notification_prefs"], currentMinutes: number): boolean {
  if (!prefs?.quietHoursEnabled) return false;

  const [startH, startM] = (prefs.quietHoursStart || "22:00").split(":").map(Number);
  const [endH, endM] = (prefs.quietHoursEnd || "06:00").split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

function parseWeek(weekStr: string) {
  const [year, week] = weekStr.split("-").map(Number);
  return { year, week };
}

function getWeekFromDate(d: Date): string {
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const startDay = startOfYear.getUTCDay() || 7;
  const week = Math.ceil((days + startDay) / 7);
  return `${year}-${String(week).padStart(2, "0")}`;
}

function getDaysForWeek(weekStr: string): Date[] {
  const { year, week } = parseWeek(weekStr);
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const startDay = startOfYear.getUTCDay() || 7;
  const daysToStartOfWeek = (week - 1) * 7 - (startDay - 1);
  const startOfWeek = new Date(Date.UTC(year, 0, 1 + daysToStartOfWeek));

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d);
  }
  return dates;
}

function formatWeekDisplay(weekStr: string): string {
  const dates = getDaysForWeek(weekStr);
  const start = dates[0];
  const end = dates[6];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m1 = months[start.getUTCMonth()];
  const d1 = start.getUTCDate();
  const y1 = start.getUTCFullYear();
  const m2 = months[end.getUTCMonth()];
  const d2 = end.getUTCDate();
  const y2 = end.getUTCFullYear();

  if (y1 !== y2) {
    return `${m1} ${d1}, ${y1} - ${m2} ${d2}, ${y2}`;
  }
  return `${m1} ${d1} - ${m2} ${d2}, ${y2}`;
}

function getCurrentDayStr(d: Date): string {
  const week = getWeekFromDate(d);
  const dayOfWeek = d.getUTCDay();
  const dayIdx = dayOfWeek === 0 ? 7 : dayOfWeek;
  return `${week}-${dayIdx}`;
}

function getTodayDayIndex(d: Date): number {
  const dayOfWeek = d.getUTCDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

function slotToTime(slotIdx: number): string {
  const hour = Math.floor(slotIdx / 2);
  const min = (slotIdx % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ExtractedTask {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  isReminder?: boolean;
}

function extractTodayTasks(
  weekPlanState: Record<string, any> | undefined,
  habits: Habit[],
  customTasks: CustomTask[],
  dayIdx: number,
  userLocalDate: Date
): ExtractedTask[] {
  const result: ExtractedTask[] = [];
  let currentTask: { id: string; name: string; type: string; startTime: string; endTime: string; startSlot: number; endSlot: number; isReminder?: boolean } | null = null;
  
  const currentDayName = DAYS_OF_WEEK[dayIdx];
  const currentShortDay = SHORT_DAYS[dayIdx];
  const year = userLocalDate.getUTCFullYear();
  const month = String(userLocalDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(userLocalDate.getUTCDate()).padStart(2, "0");
  const todayDateStr = `${year}-${month}-${day}`;

  const getCellContent = (slotIdx: number) => {
    const key = `${dayIdx}-${slotIdx}`;
    const customState = weekPlanState?.[key];

    // 1. If explicit grid state exists for this slot (task, cleared, etc.), use it!
    if (customState) {
      if (customState.type === "cleared") {
        return undefined;
      }
      return customState;
    }

    // 2. Otherwise, check if an active Habit fills this empty slot
    const habit = (habits || []).find((h) => {
      if (!h.startTime || !h.endTime) return false;
      const [hStartH, hStartM] = h.startTime.split(":").map(Number);
      const [hEndH, hEndM] = h.endTime.split(":").map(Number);
      const startSlot = hStartH * 2 + (hStartM >= 30 ? 1 : 0);
      const endSlot = hEndH * 2 + (hEndM >= 30 ? 1 : 0);

      const days = h.daysOfWeek || [];
      const isDayMatched = days.length === 0 ||
        days.includes(currentDayName) ||
        days.includes(currentShortDay) ||
        days.includes(dayIdx as any) ||
        days.includes(String(dayIdx));

      const hasStarted = h.startDate ? h.startDate <= todayDateStr : true;
      const hasNotEnded = h.endDate ? h.endDate >= todayDateStr : true;

      return isDayMatched && hasStarted && hasNotEnded && slotIdx >= startSlot && slotIdx < endSlot;
    });

    if (habit) {
      return { type: "habit", name: habit.name, description: habit.description };
    }

    return undefined;
  };

  for (let i = 0; i < 48; i++) {
    const content = getCellContent(i);
    if (content && content.name) {
      if (currentTask && currentTask.name === content.name && currentTask.type === content.type) {
        currentTask.endSlot = i + 1;
        currentTask.endTime = slotToTime(i + 1);
      } else {
        if (currentTask) result.push(currentTask);
        currentTask = {
          id: `${content.type || 'task'}-${content.name}-${i}`,
          name: content.name,
          type: content.type || "task",
          startSlot: i,
          endSlot: i + 1,
          startTime: slotToTime(i),
          endTime: slotToTime(i + 1),
        };
      }
    } else {
      if (currentTask) {
        result.push(currentTask);
        currentTask = null;
      }
    }
  }
  if (currentTask) result.push(currentTask);

  // Reminders from week plan
  const reminders = (weekPlanState?.reminders || []) as Array<{ id: string; name: string; time: string; dayIdx: number }>;
  const dayReminders = reminders.filter((r) => r.dayIdx === dayIdx && r.time);
  const reminderTasks = dayReminders.map((r) => {
    return {
      id: r.id || `reminder-${r.name}-${r.time}`,
      name: r.name,
      type: "reminder",
      startTime: r.time,
      endTime: r.time,
      isReminder: true,
    };
  });

  // Custom Tasks scheduled for today -- ONLY include standalone reminders (isReminder === true or endTime === 'reminder').
  // Non-reminder custom task templates in custom_tasks are templates for the week plan grid and must NOT auto-fire notifications on their own.
  const customTaskItems = (customTasks || [])
    .filter((ct) => {
      const isStandaloneReminder = (ct as any).isReminder === true || ct.endTime === "reminder";
      if (!isStandaloneReminder) return false;
      if (!ct.daysOfWeek || !Array.isArray(ct.daysOfWeek)) return false;
      return ct.daysOfWeek.includes(currentDayName) || ct.daysOfWeek.includes(currentShortDay);
    })
    .map((ct) => {
      let endTime = ct.endTime;
      if (endTime === 'reminder' && ct.startTime) {
        const [h, m] = ct.startTime.split(':').map(Number);
        const endMin = h * 60 + m + 30;
        const eH = Math.floor(endMin / 60) % 24;
        const eM = endMin % 60;
        endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
      }
      return {
        id: ct.id || `custom-${ct.name}-${ct.startTime}`,
        name: ct.name,
        type: "custom",
        startTime: ct.startTime,
        endTime: endTime || ct.startTime,
        isReminder: true,
      };
    });

  const timeToMin = (t: string) => {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  return [...result, ...reminderTasks, ...customTaskItems].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
}

/**
 * Calculate wake-up time from sleep schedule.
 */
function getWakeUpMinutes(sleepStart: string, sleepDuration: string): number {
  const [h, m] = sleepStart.split(":").map(Number);
  const dur = parseInt(sleepDuration, 10) || 8;
  const totalMinutes = h * 60 + m + dur * 60;
  return totalMinutes % 1440;
}

/**
 * Get standard JavaScript day number from plan_day string (0=Sunday, 1=Monday, etc).
 */
function getPlanDayNumber(planDay: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[planDay.toLowerCase()] ?? 0;
}


// ─── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const debugLogs: string[] = [];
  const logDebug = (msg: string, ...args: any[]) => {
    const formatted = msg + (args.length > 0 ? " " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ") : "");
    console.log(formatted);
    debugLogs.push(formatted);
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@legacylifebuilder.app";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Fetch all user profiles
    const { data: allProfiles, error: profilesErr } = await supabase
      .from("user_profiles")
      .select("*");

    if (profilesErr) throw profilesErr;
    if (!allProfiles || allProfiles.length === 0) {
      return new Response(JSON.stringify({ message: "No user profiles found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const userIds = allProfiles.map((p: any) => p.user_id);

    // Compute timezone-aware week and dayStr for each user
    const userLocalTimes = new Map<string, Date>();
    const userWeeks = new Map<string, string>();
    const userDayStrs = new Map<string, string>();
    const userTodayDayIndexes = new Map<string, number>();

    const uniqueDayStrs = new Set<string>();
    const userFormattedWeeks = new Map<string, string>();
    const uniqueWeekKeys = new Set<string>();

    for (const profile of allProfiles) {
      const prefs = profile.notification_prefs;
      const offsetMinutes = prefs?.timezoneOffset !== undefined ? Number(prefs.timezoneOffset) : 0;
      const userLocalTime = new Date(now.getTime() - (offsetMinutes * 60 * 1000));
      
      const week = getWeekFromDate(userLocalTime);
      const dayStr = getCurrentDayStr(userLocalTime);
      const dayIdx = getTodayDayIndex(userLocalTime);
      const formattedWeek = formatWeekDisplay(week);

      userLocalTimes.set(profile.user_id, userLocalTime);
      userWeeks.set(profile.user_id, week);
      userDayStrs.set(profile.user_id, dayStr);
      userTodayDayIndexes.set(profile.user_id, dayIdx);
      userFormattedWeeks.set(profile.user_id, formattedWeek);

      uniqueDayStrs.add(dayStr);
      // Include both display format and code format to match however the DB stores the week key
      uniqueWeekKeys.add(formattedWeek);
      uniqueWeekKeys.add(week);
    }

    // 2. Fetch push subscriptions, week plans, completed tasks, goals, habits, custom tasks, logs, SMTP settings, templates & auth emails
    const [subscriptionsRes, weekPlansRes, completedRes, goalsRes, habitsRes, customTasksRes, sentLogRes, smtpSettingsRes, templatesRes, authUsersRes] =
      await Promise.all([
        supabase.from("push_subscriptions").select("*").in("user_id", userIds),
        supabase.from("week_plans").select("*").in("user_id", userIds).in("week", Array.from(uniqueWeekKeys)),
        supabase
          .from("completed_tasks")
          .select("*")
          .in("dayStr", Array.from(uniqueDayStrs))
          .in("user_id", userIds),
        supabase.from("goals").select("*").in("user_id", userIds),
        supabase.from("habits").select("*").in("user_id", userIds),
        supabase.from("custom_tasks").select("*").in("user_id", userIds),
        supabase.from("notification_sent_log").select("*").in("user_id", userIds).gte("sent_at", new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()),
        supabase.from("global_smtp_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("global_email_templates").select("*"),
        supabase.auth.admin.listUsers(),
      ]);

    if (authUsersRes.error) throw authUsersRes.error;

    // Map user IDs to auth emails
    const userEmails = new Map<string, string>();
    for (const u of authUsersRes.data.users || []) {
      userEmails.set(u.id, u.email || "");
    }

    const smtpSettings = smtpSettingsRes.data;
    const templates = templatesRes.data || [];

    const briefingTemplate = templates.find((t: any) => t.type === "daily-briefing");
    const reminderTemplate = templates.find((t: any) => t.type === "task-reminder");
    const deadlineTemplate = templates.find((t: any) => t.type === "goal-deadline");

    // Decrypt SMTP password and create transporter if enabled
    let smtpTransporter: any = null;
    let senderEmail = "";
    let senderName = "";
    let minIntervalPerUser = 60;

    if (smtpSettings && smtpSettings.enabled) {
      const encryptionKey = "llb_smtp_encryption_key_2026";
      const { data: decryptedPass, error: decErr } = await supabase
        .rpc("get_decrypted_smtp_password", { p_encryption_key: encryptionKey });

      if (decErr) {
        console.error("Failed to decrypt SMTP password:", decErr);
      } else {
        senderEmail = smtpSettings.sender_email;
        senderName = smtpSettings.sender_name;
        minIntervalPerUser = smtpSettings.min_interval || 60;

        try {
          smtpTransporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: smtpSettings.port || 587,
            secure: smtpSettings.port === 465,
            auth: {
              user: smtpSettings.username,
              pass: decryptedPass,
            },
          });
        } catch (err) {
          console.error("Failed to create nodemailer transporter:", err);
        }
      }
    }

    // Group subscriptions by user
    const userSubs = new Map<string, UserSubscription[]>();
    for (const sub of subscriptionsRes.data || []) {
      const existing = userSubs.get(sub.user_id) || [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }

    const weekPlans = new Map<string, WeekPlan>();
    for (const wp of weekPlansRes.data || []) {
      weekPlans.set(`${wp.user_id}-${wp.week}`, wp);
    }

    const completed = new Map<string, string[]>();
    for (const ct of completedRes.data || []) {
      completed.set(`${ct.user_id}-${ct.dayStr}`, ct.taskIds || []);
    }

    const goalsByUser = new Map<string, Goal[]>();
    for (const g of goalsRes.data || []) {
      const existing = goalsByUser.get(g.user_id) || [];
      existing.push(g);
      goalsByUser.set(g.user_id, existing);
    }

    const habitsByUser = new Map<string, Habit[]>();
    for (const h of habitsRes.data || []) {
      const existing = habitsByUser.get(h.user_id) || [];
      existing.push(h);
      habitsByUser.set(h.user_id, existing);
    }

    const customTasksByUser = new Map<string, CustomTask[]>();
    for (const ct of customTasksRes.data || []) {
      const existing = customTasksByUser.get(ct.user_id) || [];
      existing.push(ct);
      customTasksByUser.set(ct.user_id, existing);
    }

    // Build sent log lookup: userId -> Set of tags
    const sentTags = new Map<string, Set<string>>();
    for (const log of sentLogRes.data || []) {
      const existing = sentTags.get(log.user_id) || new Set();
      existing.add(log.notification_tag);
      sentTags.set(log.user_id, existing);
    }

    // Count push notifications sent in the last hour for rate limiting
    const sentInLastHour = new Map<string, number>();
    for (const log of sentLogRes.data || []) {
      const sentAt = new Date(log.sent_at).getTime();
      if (now.getTime() - sentAt < 3600_000) {
        sentInLastHour.set(log.user_id, (sentInLastHour.get(log.user_id) || 0) + 1);
      }
    }

    let totalPushSent = 0;
    let totalEmailsSent = 0;
    let totalSkipped = 0;
    const staleSubscriptions: string[] = [];

    // Process each user profile
    for (const profile of allProfiles) {
      const userId = profile.user_id;
      const prefs = profile.notification_prefs;

      // Skip if notifications globally disabled
      if (!prefs?.enabled) {
        totalSkipped++;
        continue;
      }

      const userLocalTime = userLocalTimes.get(userId) || now;
      const userCurrentMinutes = userLocalTime.getUTCHours() * 60 + userLocalTime.getUTCMinutes();
      const userWeek = userWeeks.get(userId) || getWeekFromDate(userLocalTime);
      const userDayStr = userDayStrs.get(userId) || getCurrentDayStr(userLocalTime);
      const userDayIdx = userTodayDayIndexes.get(userId) ?? getTodayDayIndex(userLocalTime);

      // Skip if quiet hours
      if (isQuietHours(prefs, userCurrentMinutes)) {
        totalSkipped++;
        continue;
      }

      const userSentTags = sentTags.get(userId) || new Set();
      const userEmail = userEmails.get(userId);
      const userName = profile.full_name || userEmail?.split("@")[0] || "User";

      // ── A. Task Reminders (15 min before start) + Overdue ──
      const normalizedWeek = getWeekFromDate(userLocalTime);
      const formattedWeek = userFormattedWeeks.get(userId) || formatWeekDisplay(normalizedWeek);
      const wp = weekPlans.get(`${userId}-${formattedWeek}`) || weekPlans.get(`${userId}-${normalizedWeek}`);
      
      const userHabits = habitsByUser.get(userId) || [];
      const userCustomTasks = customTasksByUser.get(userId) || [];

      const allTasks = extractTodayTasks(
        wp?.state,
        userHabits,
        userCustomTasks,
        userDayIdx,
        userLocalTime
      );

      const completedIds = completed.get(`${userId}-${userDayStr}`) || [];
      logDebug(`[DEBUG] User ${userId} (${userName}) allTasks count: ${allTasks.length} ${JSON.stringify(allTasks.map(t => ({ id: t.id, name: t.name, start: t.startTime })))}`);

      for (const task of allTasks) {
        const [startH, startM] = task.startTime.split(":").map(Number);
        const taskStartMinutes = startH * 60 + startM;
        const diffMinutes = taskStartMinutes - userCurrentMinutes;

        // --- Task Starting Soon ---
        logDebug(`[DEBUG] Task ${task.id} (${task.name}) starting check: diffMinutes=${diffMinutes}, threshold=${TASK_REMINDER_MINUTES}`);
        if (diffMinutes > 0 && diffMinutes <= TASK_REMINDER_MINUTES) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `task-start-${task.id}-${datePart}`;

          // 1. Push notification
          if ((prefs.upcomingTasks ?? prefs.taskReminders) !== false && !userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: `${task.name} starts in ${diffMinutes} min`,
              body: `Scheduled for ${task.startTime} - ${task.endTime}`,
              url: "/today",
              tag,
            };

            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }

        // --- Task Overdue ---
        const [endH, endM] = task.endTime.split(":").map(Number);
        const taskEndMinutes = endH * 60 + endM;
        const isOverdue = userCurrentMinutes > taskEndMinutes && !completedIds.includes(task.id);
        logDebug(`[DEBUG] Task ${task.id} (${task.name}) overdue check: userCurrentMinutes=${userCurrentMinutes}, taskEndMinutes=${taskEndMinutes}, isCompleted=${completedIds.includes(task.id)}, isOverdue=${isOverdue}`);
        if (isOverdue) {
          // Double check cap before sending overdue alert
          const currentCountOverdue = sentInLastHour.get(userId) || 0;
          if (currentCountOverdue >= MAX_NOTIFICATIONS_PER_HOUR) {
            logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping overdue alert.`);
            continue;
          }

          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `task-overdue-${task.id}-${datePart}`;

          // 1. Push notification
          if ((prefs.overdueTasks ?? prefs.taskReminders) !== false && !userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: `${task.name} isn't completed`,
              body: `Was scheduled for ${task.startTime} - ${task.endTime}. Tap to mark it done.`,
              url: "/today",
              tag,
            };

            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }
      }

      // ── B. Daily Briefing (at wake-up time) ──
      const sleepStart = profile.sleep_start || "22:00";
      const sleepDuration = profile.sleep_duration || "8";
      const wakeUpMinutes = getWakeUpMinutes(sleepStart, sleepDuration);

      const wakeUpDiff = userCurrentMinutes - wakeUpMinutes;
      if (wakeUpDiff >= 0 && wakeUpDiff < 5) {
        const datePart = userLocalTime.toISOString().slice(0, 10);
        const tag = `daily-briefing-${datePart}`;

        // 1. Push notification
        if (prefs.dailyBriefing !== false && !userSentTags.has(tag)) {
          const subs = userSubs.get(userId) || [];
          const taskCount = allTasks.length;
          const hour = userLocalTime.getUTCHours();
          const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

          const pushPayload = {
            title: `${greeting}!`,
            body: taskCount > 0
              ? `You have ${taskCount} task${taskCount !== 1 ? "s" : ""} scheduled today. Let's build your legacy!`
              : "No tasks scheduled for today. Use the planner to add some!",
            url: "/today",
            tag,
          };

          // Enforce push cap check
          const currentCountBriefing = sentInLastHour.get(userId) || 0;
          if (currentCountBriefing >= MAX_NOTIFICATIONS_PER_HOUR) {
            logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping daily briefing.`);
          } else {
            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }
      }

      // ── C. Goal Deadlines (7, 3, 1 day before) + Goal Completion ──
      const goals = goalsByUser.get(userId) || [];
      const today = new Date(userLocalTime.getUTCFullYear(), userLocalTime.getUTCMonth(), userLocalTime.getUTCDate());

      for (const goal of goals) {
        if (!goal.endDate) continue;
        const endDate = new Date(goal.endDate);
        const diffMs = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Goal deadline approaching
        const displayGoalName = goal.name.length > 40 ? goal.name.substring(0, 37) + "..." : goal.name;

        for (const threshold of DEADLINE_DAYS) {
          if (diffDays <= threshold && diffDays > 0) {
            const tag = `goal-deadline-${goal.id}-${threshold}`;

            if (prefs.goalDeadlines !== false && !userSentTags.has(tag)) {
              const subs = userSubs.get(userId) || [];
              const milestones = goal.milestones || [];
              const completedCount = milestones.filter((m) => m.completed).length;
              const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
              const dayWord = diffDays === 1 ? "day" : "days";

              const pushPayload = {
                title: `"${displayGoalName}" deadline in ${diffDays} ${dayWord}`,
                body: progress > 0
                  ? `You're at ${progress}% progress. ${diffDays <= 1 ? "Final push!" : "Keep working on it!"}`
                  : "Deadline approaching. Start making progress on your milestones!",
                url: "/goals",
                tag,
              };

              // Enforce push cap check
              const currentCountDeadlines = sentInLastHour.get(userId) || 0;
              if (currentCountDeadlines >= MAX_NOTIFICATIONS_PER_HOUR) {
                logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping goal deadline.`);
              } else {
                let pushSent = false;
                for (const sub of subs) {
                  const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
                }
              }
            }
          }
        }

        // Goal completion (all milestones done)
        const milestones = goal.milestones || [];
        if (milestones.length > 0 && milestones.every((m) => m.completed)) {
          const tag = `goal-completed-${goal.id}`;
          if (prefs.goalCompletion !== false && !userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: `Goal "${displayGoalName}" completed!`,
              body: `Congratulations! You've finished all ${milestones.length} milestones. Time to set a new goal!`,
              url: "/goals",
              tag,
            };

            // Enforce push cap check
            const currentCountCompletion = sentInLastHour.get(userId) || 0;
            if (currentCountCompletion >= MAX_NOTIFICATIONS_PER_HOUR) {
              logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping goal completion.`);
            } else {
              let pushSent = false;
              for (const sub of subs) {
                const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }

              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
              }
            }
          }
        }
      }

      // ── D. Day Summary (at sleep time) ──
      const sleepStartParts = (profile.sleep_start || "22:00").split(":").map(Number);
      const sleepStartMinutes = sleepStartParts[0] * 60 + sleepStartParts[1];
      const sleepDiff = userCurrentMinutes - sleepStartMinutes;
      if (sleepDiff >= 0 && sleepDiff < 5 && prefs.daySummary !== false) {
        const datePart = userLocalTime.toISOString().slice(0, 10);
        const tag = `day-summary-${datePart}`;

        if (!userSentTags.has(tag)) {
          const totalTaskCount = allTasks.length;
          const completedCount = completedIds.length;

          let title = "Reflect & Recharge";
          let body = "";

          if (totalTaskCount === 0) {
            title = "Peaceful Evening";
            body = "No tasks scheduled today. A restful day is just as essential for your long-term legacy. Sleep well!";
          } else if (completedCount === totalTaskCount) {
            title = "A Masterclass Day!";
            body = `Incredible work! You completed all ${completedCount}/${totalTaskCount} tasks today. Your discipline is inspiring. Rest deeply!`;
          } else if (completedCount >= totalTaskCount / 2) {
            title = "Proud of Your Progress";
            body = `You checked off ${completedCount}/${totalTaskCount} tasks today. Every effort adds brick by brick to your legacy. Sleep well and recharge.`;
          } else {
            title = "Tomorrow is a New Canvas";
            body = `You completed ${completedCount}/${totalTaskCount} tasks today. Remember, productivity has seasons, and resting is part of the work. Sleep peacefully.`;
          }

          const subs = userSubs.get(userId) || [];
          const pushPayload = { title, body, url: "/statistics", tag };

          // Enforce push cap check
          const currentCountSummary = sentInLastHour.get(userId) || 0;
          if (currentCountSummary >= MAX_NOTIFICATIONS_PER_HOUR) {
            logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping day summary.`);
          } else {
            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }
      }

      // ── E. Weekly Summary (Monday morning at wake-up) ──
      const dayOfWeekForSummary = userLocalTime.getUTCDay();
      if (dayOfWeekForSummary === 1) { // Monday
        const wakeUpDiffWeekly = userCurrentMinutes - wakeUpMinutes;
        if (wakeUpDiffWeekly >= 0 && wakeUpDiffWeekly < 5 && prefs.weeklySummary !== false) {
          const tag = `weekly-summary-${userWeek}`;

          if (!userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: "Weekly Performance Summary",
              body: "Start of a new week! Check your statistics to see last week's performance and set new targets.",
              url: "/statistics",
              tag,
            };

            // Enforce push cap check
            const currentCountWeekly = sentInLastHour.get(userId) || 0;
            if (currentCountWeekly >= MAX_NOTIFICATIONS_PER_HOUR) {
              logDebug(`[DEBUG] User ${userId} hit hourly notification cap (${MAX_NOTIFICATIONS_PER_HOUR}/hour). Skipping weekly summary.`);
            } else {
              let pushSent = false;
              for (const sub of subs) {
                const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }

              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
              }
            }
          }
        }
      }

      // ── F. Sleep Start & End Notifications ──
      if (prefs.sleepNotifications !== false) {
        // Sleep Start
        if (sleepDiff >= 0 && sleepDiff < 5) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `sleep-start-${datePart}`;
          if (!userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: "Bedtime Reminder",
              body: "It's time to sleep. Wind down and get some rest!",
              url: "/today",
              tag,
            };
            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }
            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }

        // Sleep End (Wake-up)
        const sleepEndDiff = userCurrentMinutes - wakeUpMinutes;
        if (sleepEndDiff >= 0 && sleepEndDiff < 5) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `sleep-end-${datePart}`;
          if (!userSentTags.has(tag)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: "Good Morning!",
              body: "Wake up time! Time to start a brand new day of building your legacy.",
              url: "/today",
              tag,
            };
            let pushSent = false;
            for (const sub of subs) {
              const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }
            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
            }
          }
        }
      }

      // ── G. Weekly Planning Session Reminder ──
      if (prefs.weeklyPlanning !== false) {
        const planDayNum = getPlanDayNumber(profile.plan_day || "Sunday");
        const userDayNum = userLocalTime.getUTCDay();
        if (userDayNum === planDayNum) {
          const planTime = profile.plan_start_time || "21:00";
          const [planH, planM] = planTime.split(":").map(Number);
          const planMinutes = planH * 60 + planM;
          const planDiff = userCurrentMinutes - planMinutes;

          if (planDiff >= 0 && planDiff < 5) {
            const datePart = userLocalTime.toISOString().slice(0, 10);
            const tag = `weekly-planning-${datePart}`;
            if (!userSentTags.has(tag)) {
              const subs = userSubs.get(userId) || [];
              const pushPayload = {
                title: "Time to Plan Your Week",
                body: `It's time for your weekly planning session (${planTime}). Set your goals and build your legacy!`,
                url: "/planner",
                tag,
              };
              let pushSent = false;
              for (const sub of subs) {
                const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }
              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
              }
            }
          }
        }
      }

      // ── H. Midday Check-In (12:00-14:00, opt-in) ──
      if (prefs.middayCheckin !== false) {
        const isMidday = userCurrentMinutes >= 720 && userCurrentMinutes < 840; // 12:00-14:00
        if (isMidday) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `midday-checkin-${datePart}`;

          if (!userSentTags.has(tag)) {
            const totalTaskCount = allTasks.length;
            const completedCount = completedIds.length;
            const remaining = totalTaskCount - completedCount;

            // Only send if there are tasks and not all completed
            if (totalTaskCount > 0 && remaining > 0) {
              const currentCountMidday = sentInLastHour.get(userId) || 0;
              if (currentCountMidday < MAX_NOTIFICATIONS_PER_HOUR) {
                const subs = userSubs.get(userId) || [];
                const pushPayload = {
                  title: `Midday Check-In`,
                  body: `You've completed ${completedCount}/${totalTaskCount} tasks so far. ${remaining} remaining -- keep the momentum going!`,
                  url: "/today",
                  tag,
                };

                let pushSent = false;
                for (const sub of subs) {
                  const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
                }
              }
            }
          }
        }
      }

      // ── I. Habit Streak Risk (at ~18:00, if habits exist but none completed) ──
      if (prefs.habitStreakRisk !== false) {
        const isEvening = userCurrentMinutes >= 1080 && userCurrentMinutes < 1085; // 18:00-18:05
        if (isEvening) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `habit-streak-risk-${datePart}`;

          if (!userSentTags.has(tag)) {
            const userHabitCount = (habitsByUser.get(userId) || []).length;
            const habitCompletedToday = completedIds.filter(id =>
              (habitsByUser.get(userId) || []).some(h => h.id === id)
            ).length;

            // Only send if user has habits but none completed today
            if (userHabitCount > 0 && habitCompletedToday === 0) {
              const currentCountStreak = sentInLastHour.get(userId) || 0;
              if (currentCountStreak < MAX_NOTIFICATIONS_PER_HOUR) {
                const subs = userSubs.get(userId) || [];
                const pushPayload = {
                  title: `Habit Streak at Risk`,
                  body: `Your streak might break today -- you still have ${userHabitCount} habit${userHabitCount !== 1 ? 's' : ''} to complete.`,
                  url: "/today",
                  tag,
                };

                let pushSent = false;
                for (const sub of subs) {
                  const res = await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  sentInLastHour.set(userId, (sentInLastHour.get(userId) || 0) + 1);
                }
              }
            }
          }
        }
      }
    }

    // 5. Cleanup stale subscriptions
    if (staleSubscriptions.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleSubscriptions);
    }

    // 6. Cleanup old sent log entries (older than 24h)
    await supabase.rpc("clean_old_notification_logs");

    return new Response(
      JSON.stringify({
        success: true,
        pushSent: totalPushSent,
        emailsSent: totalEmailsSent,
        skipped: totalSkipped,
        staleRemoved: staleSubscriptions.length,
        timestamp: now.toISOString(),
        logs: debugLogs,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron notification execution error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
