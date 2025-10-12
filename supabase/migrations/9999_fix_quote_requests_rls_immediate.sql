-- EMERGENCY FIX: Drop all existing RLS policies on quote_requests and recreate
-- Run this in your Supabase SQL Editor immediately

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous quote submissions" ON quote_requests;
DROP POLICY IF EXISTS "Allow authenticated quote submissions" ON quote_requests;
DROP POLICY IF EXISTS "Service role full access" ON quote_requests;
DROP POLICY IF EXISTS "Admin can view all quotes" ON quote_requests;
DROP POLICY IF EXISTS "Users can insert quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Users can view own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can view all quote requests" ON quote_requests;

-- Enable RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (anonymous or authenticated) to insert quotes
CREATE POLICY "allow_all_inserts" ON quote_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to view their own quotes (by email)
CREATE POLICY "allow_own_select" ON quote_requests
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Allow admins to view all quotes
CREATE POLICY "allow_admin_all" ON quote_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
