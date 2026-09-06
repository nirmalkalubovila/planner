// supabase/functions/send-push-notifications/index.ts
// Supabase Edge Function — Cron-triggered push & email notification sender
// Sends Web Push, Expo (iOS/Android) push, & Email notifications for: task
// reminders, overdue tasks, daily briefing, goal deadlines, and more.
//
// Native (ios/android) subscriptions skip a subset of types they schedule
// for themselves as local OS triggers — see NATIVE_LOCAL_TYPES below.

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

/**
 * Send a push notification to a single Expo push token via Expo's push
 * service. One HTTP call per subscription, mirroring sendWebPush's
 * per-subscription shape exactly (rather than Expo's supported ≤100-token
 * batching) — this file's dispatch loops are structured one subscription
 * at a time throughout, and restructuring all nine of them into a
 * collect-then-batch shape is a materially bigger, riskier change than
 * this phase's payoff justifies. Batching remains a reasonable follow-up.
 */
async function sendExpoPush(
  expoPushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; statusCode: number; gone: boolean }> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        to: expoPushToken,
        title,
        body,
        data,
        priority: "high",
      },
    ]),
  });

  const statusCode = response.status;
  let gone = false;
  let success = statusCode >= 200 && statusCode < 300;

  // A 2xx HTTP status only means Expo accepted the request — the actual
  // per-token delivery receipt is inside the JSON body and is where a
  // dead token (DeviceNotRegistered, e.g. the app was uninstalled) shows
  // up, the equivalent of sendWebPush's 404/410 "gone" signal.
  if (success) {
    try {
      const json = await response.json();
      const ticket = json?.data?.[0];
      if (ticket?.status === "error") {
        success = false;
        gone = ticket.details?.error === "DeviceNotRegistered";
      }
    } catch {
      // Malformed/empty body on an otherwise-2xx response — treat the
      // send as sent rather than fail a real delivery over a parse error.
    }
  }

  return { success, statusCode, gone };
}

/**
 * One push subscription, either shape, delivered through the right
 * transport. `sub.platform` was added by the 20260826080000 migration and
 * defaults to 'web' for every pre-existing row, so this is a pure
 * superset of the old direct sendWebPush(sub, ...) call sites.
 */
async function deliverPush(
  sub: { platform?: string; endpoint?: string | null; p256dh?: string | null; auth?: string | null; expo_push_token?: string | null },
  payload: { title: string; body: string; url?: string; tag?: string; [key: string]: unknown },
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; statusCode: number; gone: boolean }> {
  if (sub.platform === "ios" || sub.platform === "android") {
    if (!sub.expo_push_token) return { success: false, statusCode: 0, gone: true };
    return sendExpoPush(sub.expo_push_token, payload.title, payload.body, payload);
  }
  return sendWebPush(
    sub as { endpoint: string; p256dh: string; auth: string },
    payload,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject
  );
}

/**
 * Notification types that a native client schedules for itself as local,
 * OS-level triggers (see apps/mobile/src/features/notifications/hooks) —
 * clock-driven rules the device can compute without a network round trip.
 * Skipping them here for ios/android subscriptions is what prevents a
 * user with the app installed from getting the same "time to sleep" alert
 * twice, once from the phone and once from this cron job. Every type NOT
 * in this set (task_overdue, daily_briefing, day_summary, weekly_summary,
 * habit_streak_risk) has no local equivalent and stays server-delivered
 * to every platform, native included.
 */
const NATIVE_LOCAL_TYPES = new Set([
  "sleep_start",
  "weekly_planning",
  "midday_checkin",
  "task_starting",
  "goal_deadline",
  "goal_completed",
]);

function shouldSkipForNativeLocal(sub: { platform?: string }, notificationType: string): boolean {
  return sub.platform !== "web" && sub.platform !== undefined && NATIVE_LOCAL_TYPES.has(notificationType);
}

// ─── Tier policy (mirrors packages/core/src/notifications/policy.ts) ──
// Deno can't consume the npm workspace symlink, so the tier rules are
// restated here. Keep the two in sync — core is the source of truth.

/** Commitments the user scheduled themselves: uncapped, quiet-hours exempt. */
const TIER1_TYPES = new Set(["task_starting", "vault_reminder"]);

/** Tier 2 ceiling per user per day, across every type and both platforms. */
const TIER2_DAILY_CAP = 4;

/**
 * Quiet hours exemptions. Tier 1 plus the bedtime alert — quiet hours
 * begin at the exact minute that notification announces, so without the
 * exemption the server skipped the whole user before it could ever send
 * it. That is why the bedtime reminder has never fired.
 */
const QUIET_HOURS_EXEMPT = new Set(["task_starting", "vault_reminder", "sleep_start"]);

function isTier1(notificationType: string): boolean {
  return TIER1_TYPES.has(notificationType);
}

function isQuietHoursExempt(notificationType: string): boolean {
  return QUIET_HOURS_EXEMPT.has(notificationType);
}

/**
 * One place that decides whether a given notification may be delivered to
 * a given user right now. Replaces the old pattern of each block
 * independently checking `sentInLastHour >= MAX_NOTIFICATIONS_PER_HOUR`,
 * which spent the budget in block order — a long task list could exhaust
 * it before a goal deadline was even considered.
 */
function canSend(
  notificationType: string,
  userId: string,
  prefs: UserProfile["notification_prefs"],
  userCurrentMinutes: number,
  tier2SpentToday: Map<string, number>
): boolean {
  if (!isQuietHoursExempt(notificationType) && isQuietHours(prefs, userCurrentMinutes)) return false;
  if (isTier1(notificationType)) return true;
  return (tier2SpentToday.get(userId) || 0) < TIER2_DAILY_CAP;
}

function recordSend(notificationType: string, userId: string, tier2SpentToday: Map<string, number>): void {
  if (isTier1(notificationType)) return;
  tier2SpentToday.set(userId, (tier2SpentToday.get(userId) || 0) + 1);
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

/** @deprecated Superseded by TIER2_DAILY_CAP — kept only so any stray
 *  reference still compiles. The hourly window was replaced by a daily
 *  ceiling that Tier 1 commitments are exempt from. */
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
  /**
   * What the user actually perceives: this name, at this time, on this
   * day. Mirrors scheduledItemKey() in packages/core.
   *
   * A reminder saved to the task library AND placed on the planner grid
   * reaches this function twice with two different `id`s, so it deduped
   * against nothing and notified twice. Identity collapses those back to
   * one entry regardless of which source produced it.
   */
  identity: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  isReminder?: boolean;
}

function taskIdentity(name: string, startTime: string, dayIdx: number): string {
  return `${dayIdx}|${startTime}|${(name || "").trim().toLowerCase()}`;
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

  // Stamp identity on every entry, then keep only the first occurrence of
  // each — this is where a library reminder that is also on the grid stops
  // being two notifications.
  const merged = [...result, ...reminderTasks, ...customTaskItems].map((t) => ({
    ...t,
    identity: taskIdentity(t.name, t.startTime, dayIdx),
  }));

  const seen = new Set<string>();
  const deduped = merged.filter((t) => {
    if (seen.has(t.identity)) return false;
    seen.add(t.identity);
    return true;
  });

  return deduped.sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
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

    let totalPushSent = 0;
    let totalEmailsSent = 0;
    let totalSkipped = 0;
    const staleSubscriptions: string[] = [];

    // How much of today's Tier 2 ceiling each user has already spent,
    // reconstructed from the sent log so the cap survives across cron
    // ticks rather than resetting every invocation.
    const tier2SpentToday = new Map<string, number>();
    for (const log of sentLogRes.data || []) {
      const tag: string = log.notification_tag || "";
      // Tier 1 tags never count against the ceiling.
      if (tag.startsWith("task-start-") || tag.startsWith("vault-reminder-")) continue;
      const sentAt = new Date(log.sent_at);
      if (sentAt.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)) continue;
      tier2SpentToday.set(log.user_id, (tier2SpentToday.get(log.user_id) || 0) + 1);
    }

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

      // Quiet hours is NO LONGER a blanket skip of the whole user. It is
      // applied per notification type inside canSend(), because some
      // types are legitimately exempt — most importantly the bedtime
      // reminder, which fires at the exact minute quiet hours begin and
      // was therefore unreachable under the old blanket check.

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

      // Tier 1 — the 15-minute warning before every habit, goal task and
      // custom block. Uncapped and quiet-hours exempt by policy: these are
      // commitments the user made to themselves, and suppressing one for
      // budget would be a bug rather than politeness.
      //
      // Per-task OVERDUE alerts used to live in this same loop, firing as
      // each task's end time passed. They are gone — folded into the
      // evening digest (block D), which reports the day once instead of
      // interrupting through it.
      for (const task of allTasks) {
        const [startH, startM] = task.startTime.split(":").map(Number);
        const taskStartMinutes = startH * 60 + startM;
        const diffMinutes = taskStartMinutes - userCurrentMinutes;

        logDebug(`[DEBUG] Task ${task.id} (${task.name}) starting check: diffMinutes=${diffMinutes}, threshold=${TASK_REMINDER_MINUTES}`);
        if (diffMinutes > 0 && diffMinutes <= TASK_REMINDER_MINUTES) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          // `task.identity` collapses the same reminder arriving from both
          // the planner grid and the saved task library, which previously
          // produced two different ids and so notified twice.
          const tag = `task-start-${task.identity}-${datePart}`;

          if (
            (prefs.upcomingTasks ?? prefs.taskReminders) !== false &&
            !userSentTags.has(tag) &&
            canSend("task_starting", userId, prefs, userCurrentMinutes, tier2SpentToday)
          ) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: `${task.name} starts in ${diffMinutes} min`,
              body: `Scheduled for ${task.startTime} - ${task.endTime}`,
              url: "/today",
              tag,
            };

            let pushSent = false;
            for (const sub of subs) {
              if (shouldSkipForNativeLocal(sub, "task_starting")) continue;
              const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              recordSend("task_starting", userId, tier2SpentToday);
            }
          }
        }
      }

      // Counted once here so the evening digest can report the day.
      const overdueCount = allTasks.filter((t) => {
        const [endH, endM] = t.endTime.split(":").map(Number);
        return userCurrentMinutes > endH * 60 + endM && !completedIds.includes(t.id);
      }).length;

      // ── B. Morning Digest (at wake-up time) ──
      // This ONE notification replaces what used to be two that fired on
      // the identical condition: the daily briefing here, and a separate
      // "Good Morning! Wake up time!" in block F. Both greeted the user in
      // the same minute, and the mobile app added a third locally. The
      // greeting and the agenda were always the same message, so they are
      // now written as one.
      const sleepStart = profile.sleep_start || "22:00";
      const sleepDuration = profile.sleep_duration || "8";
      const wakeUpMinutes = getWakeUpMinutes(sleepStart, sleepDuration);

      const wakeUpDiff = userCurrentMinutes - wakeUpMinutes;
      if (wakeUpDiff >= 0 && wakeUpDiff < 5) {
        const datePart = userLocalTime.toISOString().slice(0, 10);
        const tag = `daily_briefing:${datePart}`;
        const wantsDigest = prefs.dailyBriefing !== false || prefs.sleepNotifications !== false;

        if (wantsDigest && !userSentTags.has(tag) && canSend("daily_briefing", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
          const subs = userSubs.get(userId) || [];
          const taskCount = allTasks.length;
          const first = allTasks[0];

          const pushPayload = {
            title: "Good morning",
            body: taskCount > 0
              ? `${taskCount} task${taskCount !== 1 ? "s" : ""} today${first ? ` — first up, ${first.name} at ${first.startTime}` : ""}.`
              : "Nothing scheduled today. Open the planner to lay out your day.",
            url: "/today",
            tag,
          };

          let pushSent = false;
          for (const sub of subs) {
            const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
            if (res.gone) staleSubscriptions.push(sub.id);
            else if (res.success) pushSent = true;
          }

          if (pushSent) {
            await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
            totalPushSent++;
            recordSend("daily_briefing", userId, tier2SpentToday);
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

              if (!canSend("goal_deadline", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
                logDebug(`[DEBUG] User ${userId} out of Tier 2 budget. Skipping goal deadline.`);
              } else {
                let pushSent = false;
                for (const sub of subs) {
                  if (shouldSkipForNativeLocal(sub, "goal_deadline")) continue;
                  const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  recordSend("goal_deadline", userId, tier2SpentToday);
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

            if (!canSend("goal_completed", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
              logDebug(`[DEBUG] User ${userId} out of Tier 2 budget. Skipping goal completion.`);
            } else {
              let pushSent = false;
              for (const sub of subs) {
                if (shouldSkipForNativeLocal(sub, "goal_completed")) continue;
                const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }

              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                recordSend("goal_completed", userId, tier2SpentToday);
              }
            }
          }
        }
      }

      // ── D. Evening Digest (at bedtime) ──
      // Now also reports the day's uncompleted work, which used to arrive
      // as a separate interruption per task as each one's end time passed.
      const sleepStartParts = (profile.sleep_start || "22:00").split(":").map(Number);
      const sleepStartMinutes = sleepStartParts[0] * 60 + sleepStartParts[1];
      const sleepDiff = userCurrentMinutes - sleepStartMinutes;
      const wantsEveningDigest =
        prefs.daySummary !== false || (prefs.overdueTasks ?? prefs.taskReminders) !== false;
      if (sleepDiff >= 0 && sleepDiff < 5 && wantsEveningDigest) {
        const datePart = userLocalTime.toISOString().slice(0, 10);
        const tag = `day_summary:${datePart}`;

        if (!userSentTags.has(tag) && canSend("day_summary", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
          const totalTaskCount = allTasks.length;
          const completedCount = completedIds.length;

          let title = "Reflect & Recharge";
          let body = "";

          if (totalTaskCount === 0) {
            title = "Peaceful Evening";
            body = "Nothing was scheduled today. Rest is part of the work — sleep well.";
          } else if (completedCount === totalTaskCount) {
            title = "A Masterclass Day";
            body = `All ${completedCount}/${totalTaskCount} tasks done. Your discipline is compounding. Rest deeply.`;
          } else if (completedCount >= totalTaskCount / 2) {
            title = "Proud of Your Progress";
            body = `${completedCount}/${totalTaskCount} done, ${overdueCount} left unfinished. Brick by brick. Sleep well and recharge.`;
          } else {
            title = "Tomorrow is a New Canvas";
            body = `${completedCount}/${totalTaskCount} done, ${overdueCount} went uncompleted. Productivity has seasons — forgive the list and sleep peacefully.`;
          }

          const subs = userSubs.get(userId) || [];
          const pushPayload = { title, body, url: "/statistics", tag };

          {
            let pushSent = false;
            for (const sub of subs) {
              const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }

            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              recordSend("day_summary", userId, tier2SpentToday);
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

            if (!canSend("weekly_summary", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
              logDebug(`[DEBUG] User ${userId} out of Tier 2 budget. Skipping weekly summary.`);
            } else {
              let pushSent = false;
              for (const sub of subs) {
                const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }

              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                recordSend("weekly_summary", userId, tier2SpentToday);
              }
            }
          }
        }
      }

      // ── F. Bedtime Reminder ──
      // The wake-up half of this block is gone; it duplicated the morning
      // digest exactly (same firing condition, same greeting). What remains
      // is bedtime — which, note, could NEVER fire before this rewrite:
      // quiet hours begin at precisely this minute, and the old code
      // skipped the entire user on quiet hours before reaching here. The
      // per-type exemption in canSend() is what brings it back to life.
      if (prefs.sleepNotifications !== false) {
        if (sleepDiff >= 0 && sleepDiff < 5) {
          const datePart = userLocalTime.toISOString().slice(0, 10);
          const tag = `sleep_start:${datePart}`;
          if (!userSentTags.has(tag) && canSend("sleep_start", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
            const subs = userSubs.get(userId) || [];
            const pushPayload = {
              title: "Bedtime Reminder",
              body: "It's time to sleep. Wind down and get some rest!",
              url: "/today",
              tag,
            };
            let pushSent = false;
            for (const sub of subs) {
              if (shouldSkipForNativeLocal(sub, "sleep_start")) continue;
              const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (res.gone) staleSubscriptions.push(sub.id);
              else if (res.success) pushSent = true;
            }
            if (pushSent) {
              await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
              totalPushSent++;
              recordSend("sleep_start", userId, tier2SpentToday);
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
                if (shouldSkipForNativeLocal(sub, "weekly_planning")) continue;
                const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                if (res.gone) staleSubscriptions.push(sub.id);
                else if (res.success) pushSent = true;
              }
              if (pushSent) {
                await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                totalPushSent++;
                recordSend("weekly_planning", userId, tier2SpentToday);
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
              if (canSend("midday_checkin", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
                const subs = userSubs.get(userId) || [];
                const pushPayload = {
                  title: `Midday Check-In`,
                  body: `You've completed ${completedCount}/${totalTaskCount} tasks so far. ${remaining} remaining -- keep the momentum going!`,
                  url: "/today",
                  tag,
                };

                let pushSent = false;
                for (const sub of subs) {
                  if (shouldSkipForNativeLocal(sub, "midday_checkin")) continue;
                  const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  recordSend("midday_checkin", userId, tier2SpentToday);
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
              if (canSend("habit_streak_risk", userId, prefs, userCurrentMinutes, tier2SpentToday)) {
                const subs = userSubs.get(userId) || [];
                const pushPayload = {
                  title: `Habit Streak at Risk`,
                  body: `Your streak might break today -- you still have ${userHabitCount} habit${userHabitCount !== 1 ? 's' : ''} to complete.`,
                  url: "/today",
                  tag,
                };

                let pushSent = false;
                for (const sub of subs) {
                  const res = await deliverPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey, vapidSubject);
                  if (res.gone) staleSubscriptions.push(sub.id);
                  else if (res.success) pushSent = true;
                }

                if (pushSent) {
                  await supabase.from("notification_sent_log").upsert({ user_id: userId, notification_tag: tag, sent_at: now.toISOString() }, { onConflict: "user_id,notification_tag" });
                  totalPushSent++;
                  recordSend("habit_streak_risk", userId, tier2SpentToday);
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
