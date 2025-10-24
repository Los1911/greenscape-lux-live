-- Fix RLS policies to use proper Supabase auth functions
-- This resolves login loop issues caused by invalid auth.email() usage

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Allow email-based role lookup during auth" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view own quotes" ON public.quote_requests;

-- Fix users table policies for proper email-based role lookups
-- Option 1: Use auth.jwt() to get email from JWT token
CREATE POLICY "Allow email-based role lookup via JWT" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    email = (auth.jwt() ->> 'email')
  );

-- Option 2: Alternative using join with auth.users table (more reliable)
CREATE POLICY "Allow email-based role lookup via auth join" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.email = public.users.email
    )
  );

-- Fix quote_requests table policy
CREATE POLICY "Allow users to view own quotes via auth join" ON public.quote_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.email = quote_requests.email
    )
  );

-- Add policy for authenticated users to insert their own user records
CREATE POLICY "Allow authenticated user record creation" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = id AND
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.email = public.users.email
    )
  );

-- Ensure service role can still access users table for edge functions
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Add comments explaining the fixes
COMMENT ON POLICY "Allow email-based role lookup via JWT" ON public.users IS 
  'Uses auth.jwt() ->> email to allow email-based role lookups during authentication';

COMMENT ON POLICY "Allow email-based role lookup via auth join" ON public.users IS 
  'Uses join with auth.users table for reliable email-based role lookups';

COMMENT ON POLICY "Allow users to view own quotes via auth join" ON public.quote_requests IS 
  'Fixed policy using proper auth.users join instead of invalid auth.email()';