-- Fix RLS policies on public.users to allow email-based role lookups during authentication
-- This resolves the login loop issue where AuthContext queries by email but RLS blocks it

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create new policy that allows users to view their own profile by ID
CREATE POLICY "Users can view their own profile by ID" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Add policy that allows email-based role lookup during authentication
-- This is needed because AuthContext queries by email before the user ID is established
CREATE POLICY "Allow email-based role lookup during auth" ON public.users
  FOR SELECT USING (
    -- Allow if user is authenticated and email matches
    auth.uid() IS NOT NULL AND 
    email = auth.email()
  );

-- Alternative: Allow service role to query users table for role resolution
-- This is safer than allowing all authenticated users to query by email
CREATE POLICY "Service role can query users for auth" ON public.users
  FOR SELECT USING (
    -- Allow service role (used by edge functions) to query users
    auth.role() = 'service_role'
  );

-- Update admin policy to use the correct reference
DROP POLICY IF EXISTS "Admins have full access to all tables" ON public.users;

CREATE POLICY "Admins have full access to users table" ON public.users
  FOR ALL USING (
    -- Check if current user has admin role
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for user creation during signup
CREATE POLICY "Allow user creation during signup" ON public.users
  FOR INSERT WITH CHECK (
    -- Allow if the user being created matches the authenticated user
    auth.uid() = id
  );

-- Add comment explaining the fix
COMMENT ON POLICY "Allow email-based role lookup during auth" ON public.users IS 
  'Allows AuthContext to query user role by email during authentication process to prevent login loops';

COMMENT ON POLICY "Service role can query users for auth" ON public.users IS 
  'Allows edge functions with service role to query users table for role resolution';