-- Add avatar_url to user_profiles so it persists across OAuth sign-ins
-- (user_metadata.avatar_url gets overwritten by Google/OAuth on each login)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
