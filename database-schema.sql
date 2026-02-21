-- Create goals table
CREATE TABLE goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone,
  code text,
  description text,
  title text NOT NULL,
  "totalWeeks" integer NOT NULL,
  "startWeek" text NOT NULL,
  weeks jsonb NOT NULL,
  "startDate" text NOT NULL
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
  packs integer NOT NULL,
  "startDay" text NOT NULL
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
