-- Fix RLS policy for quote_requests table to allow authenticated users to INSERT
-- This migration adds the missing INSERT policy for authenticated users
-- 
-- ISSUE: The original migration only created:
--   1. "Allow anonymous insert quote_requests" - FOR INSERT TO anon
--   2. "Allow authenticated select quote_requests" - FOR SELECT TO authenticated (NOT INSERT!)
--   3. "Allow service role all quote_requests" - FOR ALL TO service_role
--
-- SOLUTION: Add INSERT policy for authenticated users

-- Drop the policy if it already exists (idempotent)
DROP POLICY IF EXISTS "quote_requests_auth_insert" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow authenticated insert quote_requests" ON public.quote_requests;

-- Create the INSERT policy for authenticated users
CREATE POLICY "Allow authenticated insert quote_requests"
  ON public.quote_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure authenticated users can view their own quote requests by email
DROP POLICY IF EXISTS "Allow authenticated select own quote_requests" ON public.quote_requests;

CREATE POLICY "Allow authenticated select own quote_requests"
  ON public.quote_requests
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Verify policies are in place
DO $$
BEGIN
  RAISE NOTICE 'Quote requests RLS policies updated successfully';
  RAISE NOTICE 'Authenticated users can now INSERT quote requests';
END $$;
