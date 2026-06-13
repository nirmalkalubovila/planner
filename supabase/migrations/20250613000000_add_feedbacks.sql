-- Feedback/Issues table for user-submitted feedback
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'General Feedback',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedbacks;
CREATE POLICY "Users can insert own feedback"
  ON feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
DROP POLICY IF EXISTS "Users can read own feedback" ON feedbacks;
CREATE POLICY "Users can read own feedback"
  ON feedbacks FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read ALL feedbacks
DROP POLICY IF EXISTS "Admin can read all feedbacks" ON feedbacks;
CREATE POLICY "Admin can read all feedbacks"
  ON feedbacks FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com'
  );

-- Admin can update feedback status
DROP POLICY IF EXISTS "Admin can update feedbacks" ON feedbacks;
CREATE POLICY "Admin can update feedbacks"
  ON feedbacks FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com'
  );

-- Admin can read ALL user profiles (for user list in admin panel)
DROP POLICY IF EXISTS "Admin can read all profiles" ON user_profiles;
CREATE POLICY "Admin can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com'
  );

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
