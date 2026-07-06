-- Migration to create the get_admin_user_activity function for administrative monitoring.
CREATE OR REPLACE FUNCTION get_admin_user_activity()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  is_personalized boolean,
  goals_count bigint,
  habits_count bigint,
  week_plans_count bigint,
  completed_days_count bigint,
  last_active_at timestamptz,
  recent_goals jsonb
) AS $$
BEGIN
  -- Perform admin authorization check
  IF auth.jwt() ->> 'email' != 'legacylifebuilder.konik@email.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH user_activity AS (
    SELECT 
      up.user_id,
      u.email::text as user_email,
      up.full_name,
      up.created_at,
      up.is_personalized,
      
      -- Count goals
      (SELECT COUNT(*) FROM goals g WHERE g.user_id = up.user_id) as g_count,
      
      -- Count habits
      (SELECT COUNT(*) FROM habits h WHERE h.user_id = up.user_id) as h_count,
      
      -- Count week plans
      (SELECT COUNT(*) FROM week_plans wp WHERE wp.user_id = up.user_id) as wp_count,
      
      -- Count completed task days
      (SELECT COUNT(*) FROM completed_tasks ct WHERE ct.user_id = up.user_id) as ct_count,
      
      -- Estimate last active time safely using COALESCE
      (
        SELECT GREATEST(
          up.created_at,
          COALESCE(up.updated_at, up.created_at),
          COALESCE((SELECT MAX(g."updatedAt") FROM goals g WHERE g.user_id = up.user_id), up.created_at),
          COALESCE((SELECT MAX(g."createdAt") FROM goals g WHERE g.user_id = up.user_id), up.created_at),
          COALESCE((SELECT MAX(h."updatedAt") FROM habits h WHERE h.user_id = up.user_id), up.created_at),
          COALESCE((SELECT MAX(h."createdAt") FROM habits h WHERE h.user_id = up.user_id), up.created_at),
          COALESCE((SELECT MAX(wp."createdAt") FROM week_plans wp WHERE wp.user_id = up.user_id), up.created_at),
          COALESCE((SELECT MAX(ct."createdAt") FROM completed_tasks ct WHERE ct.user_id = up.user_id), up.created_at)
        )
      ) as estimated_last_active,

      -- Get recent goals (latest 3 goals as jsonb array containing name and startDate)
      (
        SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
        FROM (
          SELECT g.name, g."startDate" as start_date, g."createdAt" as created_at
          FROM goals g 
          WHERE g.user_id = up.user_id
          ORDER BY g."createdAt" DESC
          LIMIT 3
        ) t
      ) as r_goals

    FROM user_profiles up
    JOIN auth.users u ON u.id = up.user_id
  )
  SELECT 
    ua.user_id,
    ua.user_email,
    ua.full_name,
    ua.created_at,
    ua.is_personalized,
    ua.g_count,
    ua.h_count,
    ua.wp_count,
    ua.ct_count,
    ua.estimated_last_active,
    ua.r_goals
  FROM user_activity ua
  ORDER BY COALESCE(ua.estimated_last_active, ua.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
