-- Lets a user later agree to show their own review on the landing page.
-- A narrow function instead of an UPDATE policy: the user can only switch on consent for their
-- latest positive review, and cannot touch status or show_on_landing (the admin curates those).
CREATE OR REPLACE FUNCTION public.grant_feedback_consent(
  p_name text,
  p_position text,
  p_avatar_url text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.feedbacks
  SET consent_to_show = true,
      author_name = NULLIF(trim(p_name), ''),
      author_position = NULLIF(trim(p_position), ''),
      avatar_url = NULLIF(trim(p_avatar_url), '')
  WHERE id = (
    SELECT id FROM public.feedbacks
    WHERE user_id = auth.uid() AND COALESCE(rating, 5) >= 4
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_feedback_consent(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_feedback_consent(text, text, text) TO authenticated;
