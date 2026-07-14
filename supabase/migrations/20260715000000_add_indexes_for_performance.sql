-- Migration: Add missing indexes on user_id columns to optimize performance and resolve connection pool timeouts.
-- Also create user_stats_cache table to support lightweight analytics and prevent relation errors.

-- 1. Create indexes for foreign keys referencing auth.users(id)
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_tasks_user_id ON custom_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_missed_tasks_user_id ON missed_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_notes_user_id ON vault_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_reminders_user_id ON vault_reminders(user_id);

-- 2. Create the user_stats_cache table
CREATE TABLE IF NOT EXISTS user_stats_cache (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consistency_grade text DEFAULT 'F' NOT NULL,
  habit_heatmap jsonb DEFAULT '[]'::jsonb NOT NULL,
  top_goal jsonb DEFAULT '{"name": "No active goals", "progress": 0, "projected_completion": "-"}'::jsonb NOT NULL,
  bio_sync jsonb DEFAULT '{"sleep_duration": 7, "completion_volume": 0, "correlationText": ""}'::jsonb NOT NULL,
  predictive_burnout_warning text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS and add policies
ALTER TABLE user_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own user_stats_cache" ON user_stats_cache;
CREATE POLICY "Users can manage their own user_stats_cache" 
  ON user_stats_cache FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
