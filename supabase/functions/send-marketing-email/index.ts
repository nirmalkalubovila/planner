// Admin-only marketing / announcement email sender.
//
// Actions (POST JSON):
//   { action: "test",     subject, body }                 -> sends one message to the admin's own address
//   { action: "start",    subject, body, audience }       -> creates a campaign, queues opted-in recipients, sends the first batch
//   { action: "continue", campaignId }                    -> sends the next batch of a running campaign
//
// Each call sends at most BATCH_SIZE messages (throttled) so it stays within edge-function time limits;
// the admin UI keeps calling "continue" until `remaining` is 0.
//
// Secrets: SMTP_ENCRYPTION_KEY (the key the admin panel encrypts the SMTP password with) and
// UNSUBSCRIBE_SECRET (HMAC key for unsubscribe links). Optional: ADMIN_EMAIL, MARKETING_SEND_DELAY_MS.

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.13";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 25;
const AUDIENCES = ["all", "new_7d", "no_goals", "dormant_30d"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Plain-text template -> safe HTML. {name} is substituted after escaping; blank lines become paragraph breaks. */
function renderHtml(body: string, name: string, unsubscribeUrl: string | null): string {
  const escaped = escapeHtml(body).replaceAll("{name}", escapeHtml(name));
  const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#38bdf8">$1</a>');
  const html = linked.replace(/\n/g, "<br/>");
  const footer = unsubscribeUrl
    ? `<p style="margin:24px 0 0;font-size:12px;color:#71717a">You are receiving this because you opted in to updates from Legacy Life Builder. <a href="${unsubscribeUrl}" style="color:#71717a">Unsubscribe</a></p>`
    : `<p style="margin:24px 0 0;font-size:12px;color:#71717a">Test message from Legacy Life Builder.</p>`;
  return `<div style="background:#09090b;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif"><div style="max-width:560px;margin:0 auto;background:#111113;border:1px solid #27272a;border-radius:16px;padding:28px;color:#e4e4e7;font-size:15px;line-height:1.6">${html}${footer}</div></div>`;
}

const renderText = (body: string, name: string, unsubscribeUrl: string | null) =>
  `${body.replaceAll("{name}", name)}${unsubscribeUrl ? `\n\n--\nUnsubscribe: ${unsubscribeUrl}` : ""}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "legacylifebuilder.konik@email.com";
    if (user.email !== adminEmail) return json({ error: "Forbidden" }, 403);

    const db = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!unsubscribeSecret) return json({ error: "UNSUBSCRIBE_SECRET is not configured" }, 500);

    // SMTP config saved from the admin panel
    const { data: smtp, error: smtpError } = await db.from("global_smtp_settings").select("*").eq("id", 1).maybeSingle();
    if (smtpError || !smtp) return json({ error: "SMTP is not configured" }, 400);
    if (!smtp.enabled) return json({ error: "SMTP is disabled in settings" }, 400);
    const { data: password, error: pwError } = await db.rpc("get_decrypted_smtp_password", {
      p_encryption_key: Deno.env.get("SMTP_ENCRYPTION_KEY") ?? "llb_smtp_encryption_key_2026",
    });
    if (pwError || !password) return json({ error: "Could not read the SMTP password" }, 500);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.username, pass: password },
    });
    const from = `"${smtp.sender_name}" <${smtp.sender_email}>`;
    const delayMs = Number(Deno.env.get("MARKETING_SEND_DELAY_MS") ?? "800");

    const unsubscribeUrlFor = async (userId: string) => {
      const t = await hmacHex(unsubscribeSecret, userId);
      return `${supabaseUrl}/functions/v1/unsubscribe?u=${userId}&t=${t}`;
    };

    const sendOne = async (to: string, name: string, subject: string, body: string, userId: string | null) => {
      const url = userId ? await unsubscribeUrlFor(userId) : null;
      await transporter.sendMail({
        from,
        to,
        subject,
        text: renderText(body, name, url),
        html: renderHtml(body, name, url),
        ...(url ? { headers: { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      });
    };

    const payload = await req.json();

    // ── test send ───────────────────────────────────────────────────
    if (payload.action === "test") {
      const subject = String(payload.subject ?? "").trim();
      const body = String(payload.body ?? "").trim();
      if (!subject || !body) return json({ error: "Subject and body are required" }, 400);
      await sendOne(user.email!, "there", subject, body, null);
      return json({ ok: true, sentTo: user.email });
    }

    // ── start a campaign ────────────────────────────────────────────
    let campaignId: string;
    if (payload.action === "start") {
      const subject = String(payload.subject ?? "").trim();
      const body = String(payload.body ?? "").trim();
      const audience = String(payload.audience ?? "all");
      if (!subject || !body) return json({ error: "Subject and body are required" }, 400);
      if (!AUDIENCES.includes(audience)) return json({ error: "Unknown audience" }, 400);

      const { data: recipients, error: recError } = await db.rpc("get_marketing_recipients", { p_audience: audience });
      if (recError) return json({ error: recError.message }, 500);
      if (!recipients?.length) return json({ error: "No opted-in recipients in this audience" }, 400);

      const { data: campaign, error: campError } = await db
        .from("email_campaigns")
        .insert({ subject, body, audience, status: "sending", total: recipients.length, created_by: user.id, started_at: new Date().toISOString() })
        .select("id")
        .single();
      if (campError || !campaign) return json({ error: campError?.message ?? "Could not create campaign" }, 500);
      campaignId = campaign.id;

      const rows = recipients.map((r: { user_id: string; email: string }) => ({ campaign_id: campaignId, user_id: r.user_id, email: r.email }));
      for (let i = 0; i < rows.length; i += 500) {
        const { error: insError } = await db.from("email_sends").upsert(rows.slice(i, i + 500), { onConflict: "campaign_id,user_id", ignoreDuplicates: true });
        if (insError) return json({ error: insError.message }, 500);
      }
    } else if (payload.action === "continue") {
      campaignId = String(payload.campaignId ?? "");
      if (!campaignId) return json({ error: "campaignId is required" }, 400);
    } else {
      return json({ error: "Unknown action" }, 400);
    }

    // ── send one batch ──────────────────────────────────────────────
    const { data: campaign } = await db.from("email_campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (!campaign) return json({ error: "Campaign not found" }, 404);

    if (campaign.status === "sending") {
      const { data: pending } = await db
        .from("email_sends")
        .select("id, user_id, email")
        .eq("campaign_id", campaignId)
        .eq("status", "pending")
        .limit(BATCH_SIZE);

      for (const row of pending ?? []) {
        // Re-check consent at send time so an unsubscribe during a long campaign is honoured
        const { data: profile } = await db.from("user_profiles").select("full_name, marketing_opt_in").eq("user_id", row.user_id).maybeSingle();
        if (!profile?.marketing_opt_in) {
          await db.from("email_sends").update({ status: "failed", error: "Not opted in" }).eq("id", row.id);
          continue;
        }
        const name = (profile.full_name || "").trim().split(" ")[0] || "there";
        try {
          await sendOne(row.email, name, campaign.subject, campaign.body, row.user_id);
          await db.from("email_sends").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
        } catch (err) {
          await db.from("email_sends").update({ status: "failed", error: String((err as Error).message).slice(0, 300) }).eq("id", row.id);
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    // ── progress ────────────────────────────────────────────────────
    const count = async (status: string) => {
      const { count: c } = await db.from("email_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", status);
      return c ?? 0;
    };
    const [sent, failed, remaining] = await Promise.all([count("sent"), count("failed"), count("pending")]);
    const done = remaining === 0;
    await db
      .from("email_campaigns")
      .update({ sent, failed, ...(done ? { status: "sent", finished_at: new Date().toISOString() } : {}) })
      .eq("id", campaignId);

    return json({ campaignId, total: campaign.total, sent, failed, remaining, done });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
