// supabase/functions/save-ai-settings/index.ts
// Saves a user's own "bring your own AI" connection (provider + API key).
//
// This exists as a thin Edge Function -- rather than letting the client
// call save_user_ai_settings() directly via supabase.rpc() -- for one
// reason: that RPC takes an encryption key, and an encryption key must
// never ship inside a browser bundle. This function reads it from a
// server-only secret and forwards the request using the CALLER's own JWT
// (not the service role), so auth.uid() inside the RPC still resolves to
// the right user and RLS keeps working normally.

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

const VALID_PROVIDERS = new Set(["anthropic", "openai", "gemini"]);

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const encryptionKey = Deno.env.get("AI_SETTINGS_ENCRYPTION_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration env vars on server.");
    }
    if (!encryptionKey) {
      throw new Error("Missing AI_SETTINGS_ENCRYPTION_KEY secret on server.");
    }

    // Client scoped to the calling user's own JWT -- NOT the service role
    // -- so save_user_ai_settings()'s auth.uid() resolves to this user and
    // RLS still applies. Same pattern generate-ai-plan uses for auth.
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

    const body = await req.json();
    const provider = String(body.provider || "");
    const model: string | null = body.model ? String(body.model) : null;
    const apiKey: string | null = body.apiKey ? String(body.apiKey) : null;
    const chatAssistantEnabled = !!body.chatAssistantEnabled;
    const autoWeeklyPlanning = !!body.autoWeeklyPlanning;

    if (!VALID_PROVIDERS.has(provider)) {
      return new Response(JSON.stringify({ error: "provider must be one of anthropic, openai, gemini" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseUser.rpc("save_user_ai_settings", {
      p_provider: provider,
      p_model: model,
      p_api_key: apiKey,
      p_chat_assistant_enabled: chatAssistantEnabled,
      p_auto_weekly_planning: autoWeeklyPlanning,
      p_encryption_key: encryptionKey,
    });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("save-ai-settings error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
