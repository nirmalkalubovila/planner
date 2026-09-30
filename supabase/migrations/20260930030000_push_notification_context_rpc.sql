-- One round trip for everything the send-push-notifications cron needs per tick.
--
-- The cron runs every minute and used to issue ~12 separate PostgREST calls
-- (week_plans, completed_tasks, goals, habits, custom_tasks, sent log, ...),
-- each producing its own API Gateway + PostgREST log line — the bulk of the
-- project's log ingestion. This function returns the same rows in one call.
--
-- Rows are serialized with to_jsonb(row), the same shape PostgREST returns
-- for `select *`, so the Edge Function's existing mapping code is unchanged.
-- The function also falls back to the old per-table queries if this RPC is
-- missing, so deploying the function before the migration is safe.

CREATE OR REPLACE FUNCTION public.get_push_notification_context(
  p_user_ids uuid[],
  p_week_keys text[],
  p_day_strs text[],
  p_since timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'week_plans', COALESCE((
      SELECT jsonb_agg(to_jsonb(w)) FROM week_plans w
      WHERE w.user_id = ANY(p_user_ids) AND w.week = ANY(p_week_keys)
    ), '[]'::jsonb),
    'completed_tasks', COALESCE((
      SELECT jsonb_agg(to_jsonb(c)) FROM completed_tasks c
      WHERE c.user_id = ANY(p_user_ids) AND c."dayStr" = ANY(p_day_strs)
    ), '[]'::jsonb),
    'goals', COALESCE((
      SELECT jsonb_agg(to_jsonb(g)) FROM goals g
      WHERE g.user_id = ANY(p_user_ids)
    ), '[]'::jsonb),
    'habits', COALESCE((
      SELECT jsonb_agg(to_jsonb(h)) FROM habits h
      WHERE h.user_id = ANY(p_user_ids)
    ), '[]'::jsonb),
    'custom_tasks', COALESCE((
      SELECT jsonb_agg(to_jsonb(ct)) FROM custom_tasks ct
      WHERE ct.user_id = ANY(p_user_ids)
    ), '[]'::jsonb),
    'sent_log', COALESCE((
      SELECT jsonb_agg(to_jsonb(l)) FROM notification_sent_log l
      WHERE l.user_id = ANY(p_user_ids) AND l.sent_at >= p_since
    ), '[]'::jsonb)
  );
$$;

-- Reads every user's data, so only the service role (the Edge Function) may call it.
REVOKE EXECUTE ON FUNCTION public.get_push_notification_context(uuid[], text[], text[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_push_notification_context(uuid[], text[], text[], timestamptz) TO service_role;
