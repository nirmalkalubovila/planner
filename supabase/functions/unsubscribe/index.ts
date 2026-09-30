// Public one-click unsubscribe for marketing emails. Deploy with --no-verify-jwt (links are opened from an inbox).
// GET  ?u=<user id>&t=<hmac>  -> confirmation page (also unsubscribes, so plain links work)
// POST ?u=<user id>&t=<hmac>  -> RFC 8058 one-click unsubscribe from mail clients
// The HMAC is signed with UNSUBSCRIBE_SECRET, so links cannot be forged for other users.

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const page = (title: string, message: string, status = 200) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
      `<body style="margin:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">` +
      `<div style="max-width:420px;text-align:center"><h1 style="font-size:20px;margin:0 0 8px">${title}</h1><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0">${message}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const secret = Deno.env.get("UNSUBSCRIBE_SECRET");

  if (!secret) return page("Unavailable", "Unsubscribe is not configured. Please contact support.", 500);
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !token) return page("Invalid link", "This unsubscribe link is not valid.", 400);

  const expected = await hmacHex(secret, userId);
  if (!timingSafeEqual(expected, token)) return page("Invalid link", "This unsubscribe link is not valid.", 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("user_profiles").update({ marketing_opt_in: false }).eq("user_id", userId);
  if (error) return page("Something went wrong", "We could not update your preference. Please try again later.", 500);

  if (req.method === "POST") return new Response("ok", { status: 200 });
  return page("You are unsubscribed", "You will no longer receive marketing emails from Legacy Life Builder. You can turn them back on any time from your profile settings.");
});
