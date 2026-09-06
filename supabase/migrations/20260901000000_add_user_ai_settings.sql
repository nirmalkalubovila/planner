-- Per-user "bring your own AI" settings: each user connects their own
-- Claude / ChatGPT / Gemini account so the AI planning features run on
-- their key, at their cost -- never a shared key the app pays for.
--
-- Mirrors the encryption pattern already established for
-- global_smtp_settings (pgp_sym_encrypt/pgp_sym_decrypt + a
-- SECURITY DEFINER decrypt RPC restricted to service_role), just scoped
-- per-user via auth.uid() instead of a single admin-only row.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_ai_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
  model text,
  api_key_encrypted bytea,
  chat_assistant_enabled boolean NOT NULL DEFAULT false,
  auto_weekly_planning boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

-- The stored value is always encrypted (never the plaintext key), so a
-- user reading their own encrypted blob back isn't a real exposure --
-- unlike the global SMTP row, there's no separate admin/owner split here.
DROP POLICY IF EXISTS "Users manage their own AI settings" ON user_ai_settings;
CREATE POLICY "Users manage their own AI settings" ON user_ai_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC to save/update settings. Called from the `save-ai-settings` Edge
-- Function, never directly from the browser -- the encryption key
-- (p_encryption_key) is a server-side secret and must never reach a
-- client bundle. auth.uid() resolves correctly because the Edge Function
-- calls this using the user's own JWT, just like get_decrypted_smtp_password
-- relies on auth.jwt() further down.
CREATE OR REPLACE FUNCTION save_user_ai_settings(
  p_provider text,
  p_model text,
  p_api_key text, -- NULL or '' keeps the currently stored key untouched
  p_chat_assistant_enabled boolean,
  p_auto_weekly_planning boolean,
  p_encryption_key text
) RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_enc_key bytea;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_api_key IS NULL OR p_api_key = '' THEN
    UPDATE user_ai_settings
    SET provider = p_provider,
        model = p_model,
        chat_assistant_enabled = p_chat_assistant_enabled,
        auto_weekly_planning = p_auto_weekly_planning,
        updated_at = now()
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No AI connection to update yet -- provide an API key first';
    END IF;
  ELSE
    v_enc_key := pgp_sym_encrypt(p_api_key, p_encryption_key);

    INSERT INTO user_ai_settings (user_id, provider, model, api_key_encrypted, chat_assistant_enabled, auto_weekly_planning)
    VALUES (v_user_id, p_provider, p_model, v_enc_key, p_chat_assistant_enabled, p_auto_weekly_planning)
    ON CONFLICT (user_id) DO UPDATE
    SET provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        api_key_encrypted = EXCLUDED.api_key_encrypted,
        chat_assistant_enabled = EXCLUDED.chat_assistant_enabled,
        auto_weekly_planning = EXCLUDED.auto_weekly_planning,
        updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe read for the client: never returns the encrypted blob, just
-- whether a key is on file (mirrors global_smtp_settings' has_password).
CREATE OR REPLACE FUNCTION get_user_ai_settings()
RETURNS TABLE (
  provider text,
  model text,
  has_api_key boolean,
  chat_assistant_enabled boolean,
  auto_weekly_planning boolean
) AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT s.provider, s.model, (s.api_key_encrypted IS NOT NULL), s.chat_assistant_enabled, s.auto_weekly_planning
  FROM user_ai_settings s
  WHERE s.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt for server-side use only. Called from Edge Functions with the
-- service-role key, which is why p_user_id is an explicit argument
-- rather than relying on auth.uid() (service role has no user context).
CREATE OR REPLACE FUNCTION get_decrypted_user_ai_api_key(p_user_id uuid, p_encryption_key text)
RETURNS text AS $$
DECLARE
  v_dec_key text;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT pgp_sym_decrypt(api_key_encrypted, p_encryption_key) INTO v_dec_key
  FROM user_ai_settings
  WHERE user_id = p_user_id;

  RETURN v_dec_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
