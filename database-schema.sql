-- Create goals table
-- NOTE FOR USER: If this table already exists, you need to run these commands in the Supabase SQL Editor:
-- ALTER TABLE goals DROP COLUMN IF EXISTS title, DROP COLUMN IF EXISTS "totalWeeks", DROP COLUMN IF EXISTS "startWeek", DROP COLUMN IF EXISTS weeks, DROP COLUMN IF EXISTS description;
-- ALTER TABLE goals ADD COLUMN IF EXISTS name text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS purpose text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS "endDate" text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS "goalType" text;
-- ALTER TABLE goals ADD COLUMN IF EXISTS plans jsonb;
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
  plans jsonb
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
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habits" ON habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own week_plans" ON week_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own completed_tasks" ON completed_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
