-- Testimonial presentation fields + admin delete, so the admin can curate landing-page testimonials directly from feedbacks.
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS tag text;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admin can delete feedbacks" ON public.feedbacks;
CREATE POLICY "Admin can delete feedbacks"
  ON public.feedbacks FOR DELETE
  USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
