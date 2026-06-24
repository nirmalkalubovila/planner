-- Enable pgcrypto extension for encryption/decryption functions if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create global SMTP settings table (enforcing single row with id = 1)
CREATE TABLE IF NOT EXISTS global_smtp_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean DEFAULT false NOT NULL,
  sender_email text NOT NULL DEFAULT '',
  sender_name text NOT NULL DEFAULT '',
  host text NOT NULL DEFAULT '',
  port integer DEFAULT 587,
  min_interval integer DEFAULT 60,
  username text NOT NULL DEFAULT '',
  password_encrypted bytea,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE global_smtp_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write access ONLY to the admin user
DROP POLICY IF EXISTS "Admin can manage global_smtp_settings" ON global_smtp_settings;
CREATE POLICY "Admin can manage global_smtp_settings" ON global_smtp_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');

-- Create global email templates table
CREATE TABLE IF NOT EXISTS global_email_templates (
  type text PRIMARY KEY, -- 'daily-briefing', 'task-reminder', 'goal-deadline'
  enabled boolean DEFAULT true NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE global_email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates (insert/update/delete/select)
DROP POLICY IF EXISTS "Admin can manage global_email_templates" ON global_email_templates;
CREATE POLICY "Admin can manage global_email_templates" ON global_email_templates
  FOR ALL USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');

-- Authenticated users can read templates
DROP POLICY IF EXISTS "Authenticated users can read templates" ON global_email_templates;
CREATE POLICY "Authenticated users can read templates" ON global_email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Initialize default global templates
INSERT INTO global_email_templates (type, enabled, subject, body) VALUES
('daily-briefing', true, '☀️ Your Daily Briefing for {date}', 'Good morning {name},

You have {task_count} tasks scheduled for today. Here is your briefing:

{tasks_list}

Let''s build your legacy today!

Best,
{sender_name}'),
('task-reminder', true, '📋 Reminder: {task_name} starts soon', 'Hi {name},

This is a quick reminder that your task "{task_name}" starts at {start_time} and ends at {end_time}.

Best,
{sender_name}'),
('goal-deadline', true, '🎯 Goal Deadline: {goal_name} is approaching', 'Hi {name},

Your goal "{goal_name}" is approaching its deadline in {days_remaining} days.

You have completed {completed_milestones} of your {total_milestones} milestones ({progress}%).

Keep pushing forward!

Best,
{sender_name}')
ON CONFLICT (type) DO NOTHING;

-- RPC to save global SMTP settings with password encryption
CREATE OR REPLACE FUNCTION save_global_smtp_settings(
  p_enabled boolean,
  p_sender_email text,
  p_sender_name text,
  p_host text,
  p_port integer,
  p_min_interval integer,
  p_username text,
  p_password text, -- Pass NULL or '••••••••' to keep current password
  p_encryption_key text
) RETURNS void AS $$
DECLARE
  v_enc_pass bytea;
BEGIN
  -- Perform admin authorization check inside function
  IF auth.jwt() ->> 'email' != 'legacylifebuilder.konik@email.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_password IS NULL OR p_password = '' OR p_password = '••••••••' THEN
    -- Update fields without touching the password
    UPDATE global_smtp_settings
    SET enabled = p_enabled,
        sender_email = p_sender_email,
        sender_name = p_sender_name,
        host = p_host,
        port = p_port,
        min_interval = p_min_interval,
        username = p_username,
        updated_at = now()
    WHERE id = 1;
  ELSE
    -- Encrypt the new password
    v_enc_pass := pgp_sym_encrypt(p_password, p_encryption_key);
    
    INSERT INTO global_smtp_settings (id, enabled, sender_email, sender_name, host, port, min_interval, username, password_encrypted)
    VALUES (1, p_enabled, p_sender_email, p_sender_name, p_host, p_port, p_min_interval, p_username, v_enc_pass)
    ON CONFLICT (id) DO UPDATE
    SET enabled = EXCLUDED.enabled,
        sender_email = EXCLUDED.sender_email,
        sender_name = EXCLUDED.sender_name,
        host = EXCLUDED.host,
        port = EXCLUDED.port,
        min_interval = EXCLUDED.min_interval,
        username = EXCLUDED.username,
        password_encrypted = EXCLUDED.password_encrypted,
        updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to fetch settings safely (masking password)
CREATE OR REPLACE FUNCTION get_global_smtp_settings()
RETURNS TABLE (
  enabled boolean,
  sender_email text,
  sender_name text,
  host text,
  port integer,
  min_interval integer,
  username text,
  has_password boolean
) AS $$
BEGIN
  -- Perform admin authorization check
  IF auth.jwt() ->> 'email' != 'legacylifebuilder.konik@email.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    s.enabled,
    s.sender_email,
    s.sender_name,
    s.host,
    s.port,
    s.min_interval,
    s.username,
    (s.password_encrypted IS NOT NULL) AS has_password
  FROM global_smtp_settings s
  WHERE s.id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to decrypt password securely for edge function use
CREATE OR REPLACE FUNCTION get_decrypted_smtp_password(p_encryption_key text)
RETURNS text AS $$
DECLARE
  v_dec_pass text;
BEGIN
  -- Restrict to service_role or admin user
  IF auth.role() != 'service_role' AND (auth.jwt() ->> 'email' IS NULL OR auth.jwt() ->> 'email' != 'legacylifebuilder.konik@email.com') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT pgp_sym_decrypt(password_encrypted, p_encryption_key) INTO v_dec_pass
  FROM global_smtp_settings
  WHERE id = 1;

  RETURN v_dec_pass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
