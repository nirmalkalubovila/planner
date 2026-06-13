-- Create goals table
-- NOTE FOR USER: If this table already exists, you need to run these commands in the Supabase SQL Editor:
-- ALTER TABLE goals DROP COLUMN IF EXISTS title, DROP COLUMN IF EXISTS "totalWeeks", DROP COLUMN IF EXISTS "startWeek", DROP COLUMN IF EXISTS weeks, DROP COLUMN IF EXISTS description;
-- ALTER TABLE goals ADD COLUMN IF EXISTS name text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS purpose text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS "endDate" text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS "goalType" text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS plans jsonb;
-- ALTER TABLE goals ADD COLUMN IF EXISTS "durationValue" numeric;
-- ALTER TABLE goals ADD COLUMN IF EXISTS milestones jsonb;
CREATE TABLE goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone,
  code text,
  name text NOT NULL,
  purpose text NOT NULL,
  "startDate" text NOT NULL,
  "endDate" text NOT NULL,
  "goalType" text NOT NULL,
  "durationValue" numeric,
  plans jsonb,
  milestones jsonb
);

-- Create habits table
CREATE TABLE habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone,
  code text,
  description text,
  name text NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  purpose text,
  "startDate" text,
  "endDate" text,
  "daysOfWeek" jsonb
);

-- Create week_plans table
CREATE TABLE week_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  week text NOT NULL,
  state jsonb NOT NULL,
  UNIQUE(user_id, week)
);

-- Create custom_tasks table (Task Library)
CREATE TABLE custom_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  description text,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "daysOfWeek" jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Create user_profiles table (planner preferences - persists across OAuth sign-in)
CREATE TABLE user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  full_name text,
  dob text,
  sleep_start text DEFAULT '22:00',
  sleep_duration text DEFAULT '8',
  week_start text DEFAULT 'Monday',
  plan_day text DEFAULT 'Sunday',
  plan_start_time text DEFAULT '21:00',
  plan_end_time text DEFAULT '22:00',
  primary_life_focus text,
  current_profession text,
  energy_peak_time text DEFAULT 'Morning',
  focus_ability text DEFAULT 'normal',
  task_shifting_ability text DEFAULT 'normal',
  is_personalized boolean DEFAULT false,
  avatar_url text,
  notification_prefs jsonb DEFAULT '{}'::jsonb,
  notifications jsonb DEFAULT '[]'::jsonb
);

-- Create vault_notes table (The Vault - lightning-fast notes)
CREATE TABLE vault_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  is_pinned boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone
);

-- Create completed_tasks table
CREATE TABLE completed_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "dayStr" text NOT NULL,
  "taskIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(user_id, "dayStr")
);

-- Add explicit Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vault_notes" ON vault_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own user_profiles" ON user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goals" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habits" ON habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own week_plans" ON week_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own custom_tasks" ON custom_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own completed_tasks" ON completed_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Push notification subscriptions (Web Push API)
CREATE TABLE push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own push_subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification sent log (server-side deduplication)
CREATE TABLE notification_sent_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_tag text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, notification_tag)
);

ALTER TABLE notification_sent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct user access" ON notification_sent_log FOR ALL USING (false);

-- Cleanup function for old notification logs
CREATE OR REPLACE FUNCTION clean_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_sent_log WHERE sent_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feedback/Issues table
CREATE TABLE feedbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'General Feedback',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON feedbacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can read all feedbacks" ON feedbacks FOR SELECT USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
CREATE POLICY "Admin can update feedbacks" ON feedbacks FOR UPDATE USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
CREATE POLICY "Admin can read all profiles" ON user_profiles FOR SELECT USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');
