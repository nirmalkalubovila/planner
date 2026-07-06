-- Set search path for security definer functions to prevent search path hijacking
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.clean_old_notification_logs() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_decrypted_smtp_password(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.save_global_smtp_settings(boolean, text, text, text, integer, integer, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_global_smtp_settings() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_admin_user_activity() SET search_path = public, pg_temp;

-- Revoke public execution privileges for sensitive functions

-- 1. Trigger functions should never be executed via RPC (API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Cron cleanup function should not be executed by general users
REVOKE EXECUTE ON FUNCTION public.clean_old_notification_logs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clean_old_notification_logs() TO service_role;

-- 3. Decrypt SMTP password should only be run by service_role
REVOKE EXECUTE ON FUNCTION public.get_decrypted_smtp_password(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_decrypted_smtp_password(text) TO service_role;

-- 4. Global SMTP settings should not be callable by anonymous users
REVOKE EXECUTE ON FUNCTION public.save_global_smtp_settings(boolean, text, text, text, integer, integer, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_global_smtp_settings() FROM PUBLIC, anon;

-- 5. Admin user activity monitoring should not be callable by anonymous users
REVOKE EXECUTE ON FUNCTION public.get_admin_user_activity() FROM PUBLIC, anon;

-- NOTE: pg_net extension is non-relocatable. Leaving pg_net in public is required for Supabase Database Webhooks.
-- CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION pg_net SET SCHEMA extensions;

-- Remove broad listing permission on the public avatars storage bucket
-- (Public buckets do not need a SELECT policy on storage.objects to serve file URLs)
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;
