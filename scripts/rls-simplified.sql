-- Simplified RLS Policies using Supabase Built-in Patterns
-- This creates clean, non-conflicting policies based on standard auth patterns

-- ============================================
-- STEP 2: CREATE SIMPLIFIED POLICIES
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND (raw_user_meta_data->>'role' = 'admin' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is landscaper
CREATE OR REPLACE FUNCTION public.is_landscaper(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND (raw_user_meta_data->>'role' = 'landscaper' OR role = 'landscaper')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE POLICY "clients_own_data" ON clients
  FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "clients_admin_access" ON clients
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================
-- LANDSCAPERS TABLE
-- ============================================
CREATE POLICY "landscapers_own_data" ON landscapers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "landscapers_admin_access" ON landscapers
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE POLICY "jobs_client_access" ON jobs
  FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "jobs_landscaper_access" ON jobs
  FOR ALL USING (auth.uid() = landscaper_id);

CREATE POLICY "jobs_admin_access" ON jobs
  FOR ALL USING (is_admin(auth.uid()));

-- Allow anonymous job creation for quote forms
CREATE POLICY "jobs_anon_insert" ON jobs
  FOR INSERT TO anon
  WITH CHECK (true);

-- ============================================
-- JOB PHOTOS TABLE
-- ============================================
CREATE POLICY "job_photos_access" ON job_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_photos.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

CREATE POLICY "job_photos_admin_access" ON job_photos
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================
-- QUOTES TABLE
-- ============================================
CREATE POLICY "quotes_own_data" ON quotes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "quotes_admin_access" ON quotes
  FOR ALL USING (is_admin(auth.uid()));

-- Service role can insert quotes
CREATE POLICY "quotes_service_insert" ON quotes
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================
-- COMMUNICATIONS TABLE
-- ============================================
CREATE POLICY "communications_job_access" ON communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE POLICY "notifications_own_data" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- LANDSCAPER DOCUMENTS TABLE
-- ============================================
CREATE POLICY "landscaper_documents_own_data" ON landscaper_documents
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ADMIN TABLES (Admin only access)
-- ============================================
CREATE POLICY "admin_sessions_own_data" ON admin_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_audit_logs_service_only" ON admin_audit_logs
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "email_logs_service_only" ON email_logs
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- SECURITY TABLES (Restricted access)
-- ============================================
CREATE POLICY "login_attempts_own_data" ON login_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_own_data" ON password_reset_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_own_data" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE landscapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE landscaper_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;