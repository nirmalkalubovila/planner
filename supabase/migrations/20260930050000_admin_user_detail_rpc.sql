-- Admin-only drill-down for one user. Most user tables have no admin RLS policy, so this SECURITY DEFINER
-- function returns a bundle. Private content is excluded on purpose: vault notes are only counted, and
-- push endpoints / connector token hashes are never returned.
CREATE OR REPLACE FUNCTION public.get_admin_user_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.jwt() ->> 'email' IS DISTINCT FROM 'legacylifebuilder.konik@email.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN jsonb_build_object(
    'profile', (SELECT to_jsonb(up) - 'notification_prefs' - 'notifications' FROM user_profiles up WHERE up.user_id = p_user_id),
    'account', (
      SELECT jsonb_build_object(
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'provider', u.raw_app_meta_data ->> 'provider'
      ) FROM auth.users u WHERE u.id = p_user_id
    ),
    'goals', COALESCE((SELECT jsonb_agg(to_jsonb(g) - 'user_id' ORDER BY g."createdAt" DESC) FROM goals g WHERE g.user_id = p_user_id), '[]'::jsonb),
    'habits', COALESCE((SELECT jsonb_agg(to_jsonb(h) - 'user_id' ORDER BY h."createdAt" DESC) FROM habits h WHERE h.user_id = p_user_id), '[]'::jsonb),
    'week_plans', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'week', wp.week,
        'created_at', wp."createdAt",
        'slots', CASE WHEN jsonb_typeof(wp.state) = 'object' THEN (SELECT count(*) FROM jsonb_object_keys(wp.state) k WHERE k ~ '^[0-9]+-[0-9]+$') ELSE 0 END,
        'bucket_actions', wp.bucket_actions
      ) ORDER BY wp."createdAt" DESC)
      FROM (SELECT * FROM week_plans w WHERE w.user_id = p_user_id ORDER BY w."createdAt" DESC LIMIT 26) wp
    ), '[]'::jsonb),
    'completed_days', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', ct."dayStr", 'count', jsonb_array_length(ct."taskIds")) ORDER BY ct."createdAt" DESC)
      FROM (SELECT * FROM completed_tasks c WHERE c.user_id = p_user_id ORDER BY c."createdAt" DESC LIMIT 90) ct
    ), '[]'::jsonb),
    'custom_tasks', COALESCE((SELECT jsonb_agg(to_jsonb(t) - 'user_id') FROM custom_tasks t WHERE t.user_id = p_user_id), '[]'::jsonb),
    'missed_tasks', COALESCE((SELECT jsonb_agg(to_jsonb(m) - 'user_id') FROM missed_tasks m WHERE m.user_id = p_user_id), '[]'::jsonb),
    'feedbacks', COALESCE((SELECT jsonb_agg(to_jsonb(f) - 'user_id' ORDER BY f.created_at DESC) FROM feedbacks f WHERE f.user_id = p_user_id), '[]'::jsonb),
    'counts', jsonb_build_object(
      'vault_notes', (SELECT count(*) FROM vault_notes v WHERE v.user_id = p_user_id),
      'push_devices', (SELECT count(*) FROM push_subscriptions p WHERE p.user_id = p_user_id),
      'completed_days_total', (SELECT count(*) FROM completed_tasks c WHERE c.user_id = p_user_id),
      'week_plans_total', (SELECT count(*) FROM week_plans w WHERE w.user_id = p_user_id)
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_detail(uuid) TO authenticated;
