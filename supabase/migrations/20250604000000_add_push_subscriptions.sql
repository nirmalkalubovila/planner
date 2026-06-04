-- Push notification subscriptions (Web Push API)
-- Each row represents a device/browser subscribed to push notifications for a user
CREATE TABLE IF NOT EXISTS push_subscriptions (
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

CREATE POLICY "Users can manage their own push_subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification sent log — prevents duplicate push sends and enforces server-side rate limits
CREATE TABLE IF NOT EXISTS notification_sent_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_tag text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, notification_tag)
);

ALTER TABLE notification_sent_log ENABLE ROW LEVEL SECURITY;

-- Edge Function uses service_role key, not user auth. Block direct user access.
CREATE POLICY "No direct user access" ON notification_sent_log FOR ALL USING (false);

-- Clean up old sent log entries daily (older than 24 hours)
-- This prevents the table from growing indefinitely and allows re-sending daily notifications
CREATE OR REPLACE FUNCTION clean_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_sent_log WHERE sent_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
