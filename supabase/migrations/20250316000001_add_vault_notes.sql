-- The Vault - lightning-fast notes table
CREATE TABLE IF NOT EXISTS vault_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  is_pinned boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone
);

ALTER TABLE vault_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vault_notes" ON vault_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
