-- Fix Client Job Visibility
-- This migration adds user_id column to jobs and updates RLS policies
-- to allow clients to see their jobs based on user_id OR client_email

-- ============================================
-- STEP 1: Add user_id column to jobs table
-- ============================================
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);

-- ============================================
-- STEP 2: Backfill user_id from client_email
-- Match jobs to auth.users by email
-- ============================================
UPDATE public.jobs j
SET user_id = u.id
FROM auth.users u
WHERE j.user_id IS NULL
  AND j.client_email IS NOT NULL
  AND lower(j.client_email) = lower(u.email);

-- Also try to backfill from client_id -> clients -> user_id
UPDATE public.jobs j
SET user_id = c.user_id
FROM public.clients c
WHERE j.user_id IS NULL
  AND j.client_id IS NOT NULL
  AND j.client_id = c.id
  AND c.user_id IS NOT NULL;

-- ============================================
-- STEP 3: Drop existing conflicting policies
-- ============================================
DROP POLICY IF EXISTS "jobs_client_access" ON public.jobs;
DROP POLICY IF EXISTS "clients_manage_own_jobs" ON public.jobs;

-- ============================================
-- STEP 4: Create new comprehensive client policy
-- Clients can access jobs where:
-- 1. user_id = auth.uid() (direct ownership)
-- 2. client_email = user's email (legacy jobs)
-- 3. client_id references their clients record
-- ============================================
CREATE POLICY "jobs_client_access" ON public.jobs
  FOR ALL USING (
    -- Direct user_id match (new pattern)
    (select auth.uid()) = user_id
    OR
    -- Email match (for jobs created before user_id was added)
    (
      client_email IS NOT NULL 
      AND client_email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
    OR
    -- Legacy client_id match through clients table
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = jobs.client_id 
      AND c.user_id = (select auth.uid())
    )
  );

-- ============================================
-- STEP 5: Ensure landscaper and admin policies exist
-- ============================================
DROP POLICY IF EXISTS "jobs_landscaper_access" ON public.jobs;
CREATE POLICY "jobs_landscaper_access" ON public.jobs
  FOR ALL USING (
    (select auth.uid()) = landscaper_id
    OR
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = jobs.landscaper_id 
      AND l.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "jobs_admin_access" ON public.jobs;
CREATE POLICY "jobs_admin_access" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ============================================
-- STEP 6: Allow anonymous job creation (for quote forms)
-- ============================================
DROP POLICY IF EXISTS "jobs_anon_insert" ON public.jobs;
CREATE POLICY "jobs_anon_insert" ON public.jobs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- STEP 7: Approved landscapers can view pending/available jobs
-- ============================================
DROP POLICY IF EXISTS "approved_landscapers_view_pending_jobs" ON public.jobs;
CREATE POLICY "approved_landscapers_view_pending_jobs" ON public.jobs
  FOR SELECT USING (
    status IN ('pending', 'available') 
    AND EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.user_id = (select auth.uid()) 
      AND l.is_approved = true
    )
  );

-- ============================================
-- STEP 8: Create trigger to auto-set user_id on insert
-- ============================================
CREATE OR REPLACE FUNCTION public.set_job_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id not provided, try to set it from auth context
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- If still null and client_email provided, try to find user
  IF NEW.user_id IS NULL AND NEW.client_email IS NOT NULL THEN
    SELECT id INTO NEW.user_id 
    FROM auth.users 
    WHERE lower(email) = lower(NEW.client_email)
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_job_user_id ON public.jobs;
CREATE TRIGGER trigger_set_job_user_id
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_job_user_id();

-- ============================================
-- STEP 9: Grant necessary permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT, INSERT ON public.jobs TO anon;
