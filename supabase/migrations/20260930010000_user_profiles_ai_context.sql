-- Extra context the AI planner uses to size and pace goals.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS biggest_challenge text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS daily_free_hours text;
