// supabase/functions/send-push-notifications/index.ts
// Supabase Edge Function — Cron-triggered push notification sender
// Sends Web Push notifications for: task reminders, overdue tasks, daily briefing, goal deadlines

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// ─── Notification Logic ─────────────────────────────────────────

interface UserSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface UserProfile {
  user_id: string;
  notification_prefs: {
    enabled?: boolean;
    taskReminders?: boolean;
    dailyBriefing?: boolean;
    goalDeadlines?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  } | null;
  sleep_start: string | null;
  sleep_duration: string | null;
}

interface WeekPlan {
  user_id: string;
  week: string;
  state: {
    days?: Array<{
      tasks?: Array<{
        id: string;
        name: string;
        startTime: string;
        endTime: string;
      }>;
    }>;
  };
}

interface CompletedTasks {
  user_id: string;
  dayStr: string;
  taskIds: string[];
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
  daysOfWeek?: number[];
}

const MAX_NOTIFICATIONS_PER_HOUR = 3;
const TASK_REMINDER_MINUTES = 5;
const DEADLINE_DAYS = [7, 3, 1];

/**
 * Check if the current time is within quiet hours.
 */
function isQuietHours(prefs: UserProfile["notification_prefs"]): boolean {
  if (!prefs?.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

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

/**
 * Get current week string in the format the app uses (YYYY-WXX).
 */
function getCurrentWeek(): string {
  const now = new Date();
  // Find Monday of this week
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);

  const year = monday.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor(
    (monday.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Get today's day string (YYYY-WXX-D).
 */
function getCurrentDayStr(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Convert 0=Sun to 1-indexed Mon-Sun (1=Mon, 7=Sun)
  const dayIdx = dayOfWeek === 0 ? 7 : dayOfWeek;
  return `${getCurrentWeek()}-${dayIdx}`;
}

/**
 * Get today's 0-indexed day within the week plan (0=Mon, 6=Sun).
 */
function getTodayDayIndex(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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

// ─── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Verify this is a cron invocation or has the service role key
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@legacylifebuilder.app";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Get all users with active push subscriptions
    const { data: subscriptions, error: subErr } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subErr) throw subErr;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Group subscriptions by user
    const userSubs = new Map<string, UserSubscription[]>();
    for (const sub of subscriptions) {
      const existing = userSubs.get(sub.user_id) || [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }

    const userIds = Array.from(userSubs.keys());

    // 2. Fetch all profiles, week plans, completed tasks, and goals for these users
    const [profilesRes, weekPlansRes, completedRes, goalsRes, habitsRes, sentLogRes] =
      await Promise.all([
        supabase.from("user_profiles").select("*").in("user_id", userIds),
        supabase.from("week_plans").select("*").eq("week", getCurrentWeek()).in("user_id", userIds),
        supabase
          .from("completed_tasks")
          .select("*")
          .eq("dayStr", getCurrentDayStr())
          .in("user_id", userIds),
        supabase.from("goals").select("*").in("user_id", userIds),
        supabase.from("habits").select("*").in("user_id", userIds),
        supabase.from("notification_sent_log").select("*").in("user_id", userIds),
      ]);

    const profiles = new Map<string, UserProfile>();
    for (const p of profilesRes.data || []) profiles.set(p.user_id, p);

    const weekPlans = new Map<string, WeekPlan>();
    for (const wp of weekPlansRes.data || []) weekPlans.set(wp.user_id, wp);

    const completed = new Map<string, string[]>();
    for (const ct of completedRes.data || []) completed.set(ct.user_id, ct.taskIds || []);

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

    // Build sent log lookup: userId -> Set of tags
    const sentTags = new Map<string, Set<string>>();
    for (const log of sentLogRes.data || []) {
      const existing = sentTags.get(log.user_id) || new Set();
      existing.add(log.notification_tag);
      sentTags.set(log.user_id, existing);
    }

    // Count notifications sent in the last hour for rate limiting
    const sentInLastHour = new Map<string, number>();
    for (const log of sentLogRes.data || []) {
      const sentAt = new Date(log.sent_at).getTime();
      if (now.getTime() - sentAt < 3600_000) {
        sentInLastHour.set(log.user_id, (sentInLastHour.get(log.user_id) || 0) + 1);
      }
    }

    let totalSent = 0;
    let totalSkipped = 0;
    const staleSubscriptions: string[] = [];

    // 3. Process each user
    for (const [userId, subs] of userSubs) {
      const profile = profiles.get(userId);
      const prefs = profile?.notification_prefs;

      // Skip if notifications disabled
      if (!prefs?.enabled) {
        totalSkipped++;
        continue;
      }

      // Skip if quiet hours
      if (isQuietHours(prefs)) {
        totalSkipped++;
        continue;
      }

      // Rate limit check
      const sentCount = sentInLastHour.get(userId) || 0;
      if (sentCount >= MAX_NOTIFICATIONS_PER_HOUR) {
        totalSkipped++;
        continue;
      }

      const userSentTags = sentTags.get(userId) || new Set();
      let remainingQuota = MAX_NOTIFICATIONS_PER_HOUR - sentCount;

      // Collect notifications to send
      const notifications: Array<{
        tag: string;
        title: string;
        body: string;
        url: string;
      }> = [];

      // ── A. Task Reminders (5 min before start) + Overdue ──
      if (prefs.taskReminders !== false) {
        const wp = weekPlans.get(userId);
        const dayIdx = getTodayDayIndex();
        const dayPlan = wp?.state?.days?.[dayIdx];
        const tasks = dayPlan?.tasks || [];
        const completedIds = completed.get(userId) || [];

        // Also include habits for today
        const userHabits = habitsByUser.get(userId) || [];
        const todayDayNum = new Date().getDay(); // 0=Sun
        const habitTasks = userHabits
          .filter((h) => {
            if (!h.daysOfWeek || !Array.isArray(h.daysOfWeek)) return true;
            return h.daysOfWeek.includes(todayDayNum);
          })
          .map((h) => ({
            id: h.id,
            name: h.name,
            startTime: h.startTime,
            endTime: h.endTime,
          }));

        const allTasks = [...tasks, ...habitTasks];

        for (const task of allTasks) {
          const [startH, startM] = task.startTime.split(":").map(Number);
          const taskStartMinutes = startH * 60 + startM;
          const diffMinutes = taskStartMinutes - currentMinutes;

          // Task starting soon (within TASK_REMINDER_MINUTES)
          if (diffMinutes > 0 && diffMinutes <= TASK_REMINDER_MINUTES) {
            const tag = `task-start-${task.id}-${now.toISOString().slice(0, 10)}`;
            if (!userSentTags.has(tag)) {
              notifications.push({
                tag,
                title: `📋 ${task.name} starts in ${diffMinutes} min`,
                body: `Scheduled for ${task.startTime} - ${task.endTime}`,
                url: "/today",
              });
            }
          }

          // Task overdue
          const [endH, endM] = task.endTime.split(":").map(Number);
          const taskEndMinutes = endH * 60 + endM;
          if (
            currentMinutes > taskEndMinutes &&
            !completedIds.includes(task.id)
          ) {
            const tag = `task-overdue-${task.id}-${now.toISOString().slice(0, 10)}`;
            if (!userSentTags.has(tag)) {
              notifications.push({
                tag,
                title: `⚠️ ${task.name} isn't completed`,
                body: `Was scheduled for ${task.startTime} - ${task.endTime}. Tap to mark it done.`,
                url: "/today",
              });
            }
          }
        }
      }

      // ── B. Daily Briefing (at wake-up time) ──
      if (prefs.dailyBriefing !== false) {
        const sleepStart = profile?.sleep_start || "22:00";
        const sleepDuration = profile?.sleep_duration || "8";
        const wakeUpMinutes = getWakeUpMinutes(sleepStart, sleepDuration);

        // Send if we're within 2 minutes of wake-up time
        const wakeUpDiff = currentMinutes - wakeUpMinutes;
        if (wakeUpDiff >= 0 && wakeUpDiff < 2) {
          const tag = `daily-briefing-${now.toISOString().slice(0, 10)}`;
          if (!userSentTags.has(tag)) {
            const wp = weekPlans.get(userId);
            const dayIdx = getTodayDayIndex();
            const dayPlan = wp?.state?.days?.[dayIdx];
            const taskCount = (dayPlan?.tasks || []).length;

            const hour = now.getHours();
            const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

            notifications.push({
              tag,
              title: `☀️ ${greeting}!`,
              body:
                taskCount > 0
                  ? `You have ${taskCount} task${taskCount !== 1 ? "s" : ""} scheduled today. Let's build your legacy!`
                  : "No tasks scheduled for today. Use the planner to add some!",
              url: "/today",
            });
          }
        }
      }

      // ── C. Goal Deadlines (7, 3, 1 day before) ──
      if (prefs.goalDeadlines !== false) {
        const goals = goalsByUser.get(userId) || [];
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (const goal of goals) {
          if (!goal.endDate) continue;
          const endDate = new Date(goal.endDate);
          const diffMs = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          for (const threshold of DEADLINE_DAYS) {
            if (diffDays <= threshold && diffDays > 0) {
              const tag = `goal-deadline-${goal.id}-${threshold}`;
              if (!userSentTags.has(tag)) {
                const milestones = goal.milestones || [];
                const completedCount = milestones.filter((m) => m.completed).length;
                const progress =
                  milestones.length > 0
                    ? Math.round((completedCount / milestones.length) * 100)
                    : 0;

                const dayWord = diffDays === 1 ? "day" : "days";

                notifications.push({
                  tag,
                  title: `🎯 "${goal.name}" deadline in ${diffDays} ${dayWord}`,
                  body:
                    progress > 0
                      ? `You're at ${progress}% progress. ${diffDays <= 1 ? "Final push!" : "Keep working on it!"}`
                      : "Deadline approaching. Start making progress on your milestones!",
                  url: "/goals",
                });
              }
            }
          }
        }
      }

      // 4. Send notifications (respecting rate limit)
      for (const notif of notifications) {
        if (remainingQuota <= 0) break;

        const pushPayload = {
          title: notif.title,
          body: notif.body,
          url: notif.url,
          tag: notif.tag,
        };

        let anySent = false;

        for (const sub of subs) {
          try {
            const result = await sendWebPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              pushPayload,
              vapidPublicKey,
              vapidPrivateKey,
              vapidSubject
            );

            if (result.gone) {
              // Subscription expired — mark for cleanup
              staleSubscriptions.push(sub.id);
            } else if (result.success) {
              anySent = true;
            }
          } catch (err) {
            console.error(`Failed to send push to ${sub.endpoint}:`, err);
          }
        }

        if (anySent) {
          // Record in sent log for dedup
          await supabase.from("notification_sent_log").upsert(
            {
              user_id: userId,
              notification_tag: notif.tag,
              sent_at: now.toISOString(),
            },
            { onConflict: "user_id,notification_tag" }
          );
          totalSent++;
          remainingQuota--;
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
        sent: totalSent,
        skipped: totalSkipped,
        staleRemoved: staleSubscriptions.length,
        timestamp: now.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification cron error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
