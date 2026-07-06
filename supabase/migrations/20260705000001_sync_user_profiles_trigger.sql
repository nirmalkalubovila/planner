-- Migration to create trigger for automatic user_profile creation and backfill missing profiles.

-- 1. Backfill any existing users in auth.users who do not have a public.user_profiles record
INSERT INTO public.user_profiles (user_id, full_name, is_personalized)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
  false
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Function to automatically create a profile when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, is_personalized)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger to execute the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
