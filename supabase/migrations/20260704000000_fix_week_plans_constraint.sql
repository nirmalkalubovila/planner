-- Fix unique constraint on week_plans table to be composite (user_id, week) instead of week alone.
ALTER TABLE week_plans DROP CONSTRAINT IF EXISTS week_plans_week_key;
ALTER TABLE week_plans DROP CONSTRAINT IF EXISTS unique_user_week;
ALTER TABLE week_plans ADD CONSTRAINT unique_user_week UNIQUE (user_id, week);
