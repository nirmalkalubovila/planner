-- Progressive profiling for the AI planner.
-- execution_profile: how the user works (focus, switching, energy, risks). Owned by the
--   Execution Profile assessment; kept separate from notification_prefs, which is overwritten wholesale.
-- "goalContext": per-goal context (why, success measure, resources, prior attempts).
--   Quoted camelCase to match the rest of the goals table.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS execution_profile jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS "goalContext" jsonb;
