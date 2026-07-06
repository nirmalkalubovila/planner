-- Create missed_tasks table (Missed Library)
CREATE TABLE IF NOT EXISTS missed_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  description text,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "daysOfWeek" jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE missed_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own missed tasks
CREATE POLICY "Users can manage their own missed_tasks" 
ON missed_tasks 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
