-- Fix infinite recursion in RLS policies
-- Drop problematic policies and recreate without circular dependencies

-- Drop existing users policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Recreate users policies without recursion
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Allow service role to bypass RLS for user creation
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Fix admin check in landscapers policy to avoid recursion
DROP POLICY IF EXISTS "Admins can view all landscaper profiles" ON public.landscapers;

CREATE POLICY "Admins can view all landscaper profiles" ON public.landscapers
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );
