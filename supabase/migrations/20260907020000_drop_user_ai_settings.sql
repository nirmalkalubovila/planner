-- Removes the "bring your own API key" feature.
--
-- It was superseded by the MCP connector (see 20260907010000), which runs on
-- the user's existing Claude subscription instead of a metered API key, so
-- storing per-user provider keys no longer serves any purpose. Dropping the
-- table also means there is one less place a secret could sit at rest.
--
-- The two migrations that created this (20260901000000, 20260907000000) are
-- deliberately left in place rather than deleted: they have already been
-- applied to production, and removing applied migration files would desync
-- the local history from supabase_migrations.schema_migrations.

DROP FUNCTION IF EXISTS get_decrypted_user_ai_api_key(uuid, text);
DROP FUNCTION IF EXISTS get_user_ai_settings();
DROP FUNCTION IF EXISTS save_user_ai_settings(text, text, text, boolean, boolean, text);

-- Policies and column grants go with the table.
DROP TABLE IF EXISTS user_ai_settings;
