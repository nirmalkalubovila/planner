-- Email marketing: campaigns, per-recipient send log and an audience function.
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  total integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  UNIQUE (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_status ON public.email_sends(campaign_id, status);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

-- Admin can read; only the service role (edge function) writes.
DROP POLICY IF EXISTS "Admin can read email_campaigns" ON public.email_campaigns;
CREATE POLICY "Admin can read email_campaigns" ON public.email_campaigns FOR SELECT
  USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
DROP POLICY IF EXISTS "Admin can read email_sends" ON public.email_sends;
CREATE POLICY "Admin can read email_sends" ON public.email_sends FOR SELECT
  USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');

-- Opted-in, confirmed recipients for an audience. Callable by the service role and the admin only.
CREATE OR REPLACE FUNCTION public.get_marketing_recipients(p_audience text DEFAULT 'all')
RETURNS TABLE (user_id uuid, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND auth.jwt() ->> 'email' IS DISTINCT FROM 'legacylifebuilder.konik@email.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT up.user_id,
         u.email::text,
         COALESCE(NULLIF(up.full_name, ''), split_part(u.email, '@', 1))::text
  FROM user_profiles up
  JOIN auth.users u ON u.id = up.user_id
  WHERE up.marketing_opt_in = true
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL
    AND CASE p_audience
      WHEN 'all' THEN true
      WHEN 'new_7d' THEN up.created_at > now() - interval '7 days'
      WHEN 'no_goals' THEN NOT EXISTS (SELECT 1 FROM goals g WHERE g.user_id = up.user_id)
      WHEN 'dormant_30d' THEN COALESCE((SELECT max(ct."createdAt") FROM completed_tasks ct WHERE ct.user_id = up.user_id), up.created_at) < now() - interval '30 days'
      ELSE false
    END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_marketing_recipients(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketing_recipients(text) TO authenticated, service_role;
