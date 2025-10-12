-- Admin Security System Migration
-- Creates admin role constraints, login logging, and security features

-- 1. Create admin login logs table
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create admin sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add admin-specific columns to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'is_super_admin') THEN
    ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'admin_permissions') THEN
    ALTER TABLE users ADD COLUMN admin_permissions JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 4. Create function to verify admin role
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for admin tables
ALTER TABLE admin_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin login logs - only admins can view
CREATE POLICY "Admins can view login logs"
  ON admin_login_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin login logs - system can insert
CREATE POLICY "System can insert login logs"
  ON admin_login_logs FOR INSERT
  WITH CHECK (true);

-- Admin sessions - admins can view their own sessions
CREATE POLICY "Admins can view own sessions"
  ON admin_sessions FOR SELECT
  USING (admin_id = auth.uid() AND is_admin(auth.uid()));

-- Admin sessions - system can manage sessions
CREATE POLICY "System can manage sessions"
  ON admin_sessions FOR ALL
  USING (true);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_admin_id ON admin_login_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_created_at ON admin_login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- 7. Add constraint to ensure admin role exists in users table
ALTER TABLE users ADD CONSTRAINT check_valid_role 
  CHECK (role IN ('client', 'landscaper', 'admin'));

-- 8. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type TEXT,
  action_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_login_logs (admin_id, email, ip_address, user_agent, success)
  SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    action_details->>'ip_address',
    action_details->>'user_agent',
    true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE admin_login_logs IS 'Tracks all admin login attempts for security auditing';
COMMENT ON TABLE admin_sessions IS 'Manages active admin sessions with expiration';
COMMENT ON FUNCTION is_admin IS 'Verifies if a user has admin role';
COMMENT ON FUNCTION log_admin_action IS 'Logs admin actions for audit trail';
