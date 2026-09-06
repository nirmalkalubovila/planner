-- Billing/refund contact-form submissions (features/(public)/refund-page.tsx).
-- The page is public and prefills email only when a session exists, so
-- submissions may come from anonymous visitors (user_id null) or signed-in
-- users (user_id set). This table was referenced by the client with no
-- migration ever created, so every submission was silently failing.
CREATE TABLE IF NOT EXISTS billing_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  inquiry_type text NOT NULL DEFAULT 'Other',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE billing_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit an inquiry, but a
-- signed-in user can only attach their own user_id to it.
DROP POLICY IF EXISTS "Anyone can submit a billing inquiry" ON billing_inquiries;
CREATE POLICY "Anyone can submit a billing inquiry"
  ON billing_inquiries FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Signed-in users can read their own submissions.
DROP POLICY IF EXISTS "Users can read own billing inquiries" ON billing_inquiries;
CREATE POLICY "Users can read own billing inquiries"
  ON billing_inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read and triage all inquiries.
DROP POLICY IF EXISTS "Admin can read all billing inquiries" ON billing_inquiries;
CREATE POLICY "Admin can read all billing inquiries"
  ON billing_inquiries FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com'
  );

DROP POLICY IF EXISTS "Admin can update billing inquiries" ON billing_inquiries;
CREATE POLICY "Admin can update billing inquiries"
  ON billing_inquiries FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com'
  );

CREATE INDEX IF NOT EXISTS idx_billing_inquiries_user_id ON billing_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_inquiries_status ON billing_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_billing_inquiries_created_at ON billing_inquiries(created_at DESC);
