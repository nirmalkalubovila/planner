-- Version the app_updates table (previously created outside migrations). Idempotent.
CREATE TABLE IF NOT EXISTS public.app_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  release_date timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app_updates" ON public.app_updates;
CREATE POLICY "Anyone can read app_updates" ON public.app_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage app_updates" ON public.app_updates;
CREATE POLICY "Admin can manage app_updates" ON public.app_updates FOR ALL
  USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
