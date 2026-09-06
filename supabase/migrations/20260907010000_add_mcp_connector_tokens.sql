-- Per-user secret link for connecting this planner to Claude (or any other
-- MCP-capable AI app) as a custom connector.
--
-- The raw token is generated in the browser and NEVER sent to the server --
-- only its SHA-256 hash is stored. So a full database leak yields hashes,
-- not working connector links. Two further locks: no direct client writes
-- (SECURITY DEFINER RPCs only), and the hash column is not readable by the
-- authenticated role at all.

CREATE TABLE IF NOT EXISTS mcp_connector_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE mcp_connector_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own connector token" ON mcp_connector_tokens;
CREATE POLICY "Users read their own connector token" ON mcp_connector_tokens
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy: all writes go through the RPCs below.

REVOKE SELECT ON mcp_connector_tokens FROM authenticated;
GRANT SELECT (user_id, created_at, last_used_at) ON mcp_connector_tokens TO authenticated;
-- token_hash deliberately excluded.

-- Store (or replace) the caller's connector token hash.
CREATE OR REPLACE FUNCTION save_mcp_connector_token(p_token_hash text)
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_token_hash IS NULL OR length(p_token_hash) < 32 THEN
    RAISE EXCEPTION 'Invalid token hash';
  END IF;

  INSERT INTO mcp_connector_tokens (user_id, token_hash, created_at, last_used_at)
  VALUES (v_user_id, p_token_hash, now(), NULL)
  ON CONFLICT (user_id) DO UPDATE
  SET token_hash = EXCLUDED.token_hash,
      created_at = now(),
      last_used_at = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instantly kills any connector link already pasted into an AI app.
CREATE OR REPLACE FUNCTION revoke_mcp_connector_token()
RETURNS void AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM mcp_connector_tokens WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe status read for the settings UI (never exposes the hash).
CREATE OR REPLACE FUNCTION get_mcp_connector_status()
RETURNS TABLE (
  has_token boolean,
  created_at timestamptz,
  last_used_at timestamptz
) AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT true, t.created_at, t.last_used_at
  FROM mcp_connector_tokens t
  WHERE t.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Server-side only: turns a presented token hash into the owning user and
-- records the touch. service_role is the only caller permitted, so a leaked
-- anon key can't be used to probe tokens.
CREATE OR REPLACE FUNCTION resolve_mcp_connector_token(p_token_hash text)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO v_user_id
  FROM mcp_connector_tokens
  WHERE token_hash = p_token_hash;

  IF v_user_id IS NOT NULL THEN
    UPDATE mcp_connector_tokens SET last_used_at = now() WHERE user_id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
