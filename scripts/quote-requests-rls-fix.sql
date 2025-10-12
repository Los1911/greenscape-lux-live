-- Fix Row Level Security for quote_requests table
-- This allows anonymous users to submit quote requests

-- ============================================
-- QUOTE_REQUESTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on quote_requests table
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert quote requests (for public quote forms)
CREATE POLICY "quote_requests_anon_insert" ON quote_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert quote requests
CREATE POLICY "quote_requests_auth_insert" ON quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow service role full access (for edge functions)
CREATE POLICY "quote_requests_service_access" ON quote_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow admins to view all quote requests
CREATE POLICY "quote_requests_admin_access" ON quote_requests
  FOR ALL USING (is_admin(auth.uid()));

-- Optional: Allow authenticated users to view their own quote requests by email
-- (Uncomment if you want users to see their own submissions)
-- CREATE POLICY "quote_requests_own_email" ON quote_requests
--   FOR SELECT TO authenticated
--   USING (email = auth.email());