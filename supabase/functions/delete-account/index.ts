// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Tables scoped by `user_id` that predate this repo's migration tracking
// (no CREATE TABLE anywhere under supabase/migrations, so their FK cascade
// behavior against auth.users can't be confirmed by reading the codebase).
// Deleted explicitly, in leaf-first order, rather than trusting an unverified
// cascade. Everything else (subscriptions, vault_notes, push_subscriptions,
// notification_sent_log, feedbacks, missed_tasks, user_stats_cache) already
// has a confirmed `ON DELETE CASCADE` migration and needs no explicit delete.
const USER_ID_SCOPED_TABLES = [
  "completed_tasks",
  "custom_tasks",
  "week_plans",
  "goals",
  "habits",
] as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await callerClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Unauthorized access" }, 401);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    for (const table of USER_ID_SCOPED_TABLES) {
      const { error: deleteError } = await adminClient.from(table).delete().eq("user_id", user.id);
      if (deleteError) {
        return jsonResponse({ error: `Failed clearing ${table}: ${deleteError.message}` }, 500);
      }
    }

    // user_profiles is keyed by user_id but is not confirmed ON DELETE
    // CASCADE either — clear it explicitly for the same reason as above.
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .delete()
      .eq("user_id", user.id);
    if (profileError) {
      return jsonResponse({ error: `Failed clearing user_profiles: ${profileError.message}` }, 500);
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      return jsonResponse({ error: `Failed deleting auth user: ${deleteUserError.message}` }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
