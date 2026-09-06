-- Hardens user_ai_settings beyond row-level security:
--
-- 1. Column-level lockdown: even the ROW owner can no longer pull back
--    their own api_key_encrypted blob through a direct table query
--    (supabase.from('user_ai_settings').select('*')). It's ciphertext,
--    so this wasn't exploitable before -- this closes it anyway, so the
--    encrypted key never leaves the database at all, under any code path,
--    for any reason. Only the SECURITY DEFINER RPCs (which run as the
--    table owner, not the calling role) can touch that column.
--
-- 2. Write lockdown: the previous "FOR ALL" policy let a client write to
--    this table directly via the Supabase SDK, bypassing
--    save_user_ai_settings() entirely -- meaning bypassing encryption.
--    Replacing it with a SELECT-only policy means the ONLY way to write
--    a row is through that RPC, which is the only place encryption happens.

DROP POLICY IF EXISTS "Users manage their own AI settings" ON user_ai_settings;
CREATE POLICY "Users read their own AI settings" ON user_ai_settings
  FOR SELECT USING (auth.uid() = user_id);
-- Deliberately no INSERT/UPDATE/DELETE policy for authenticated users --
-- all writes must go through save_user_ai_settings() (SECURITY DEFINER).

REVOKE SELECT ON user_ai_settings FROM authenticated;
GRANT SELECT (user_id, provider, model, chat_assistant_enabled, auto_weekly_planning, created_at, updated_at)
  ON user_ai_settings TO authenticated;
-- api_key_encrypted is intentionally excluded from this grant.
