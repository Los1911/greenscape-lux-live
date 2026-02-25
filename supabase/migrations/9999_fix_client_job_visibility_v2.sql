-- Fix Client Job Visibility V2
-- This migration fixes the RLS policies for client job visibility
-- The previous migration had a bug where jobs_client_access checked auth.uid() = client_id
-- but client_id is a FK to the clients table, not auth.users

-- ============================================
-- STEP 1: Drop conflicting policies
-- ============================================
DROP POLICY IF EXISTS "jobs_client_access" ON public.jobs;
DROP POLICY IF EXISTS "clients_manage_own_jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can manage their own jobs" ON public.jobs;

-- ============================================
-- STEP 2: Ensure user_id column exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
  END IF;
END $$;

-- ============================================
-- STEP 3: Ensure client_email column exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'client_email'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN client_email TEXT;
    CREATE INDEX IF NOT EXISTS idx_jobs_client_email ON public.jobs(client_email);
  END IF;
END $$;

-- ============================================
-- STEP 4: Backfill user_id from client_email
-- ============================================
UPDATE public.jobs j
SET user_id = u.id
FROM auth.users u
WHERE j.user_id IS NULL
  AND j.client_email IS NOT NULL
  AND lower(j.client_email) = lower(u.email);

-- Also backfill from client_id -> clients -> user_id
UPDATE public.jobs j
SET user_id = c.user_id
FROM public.clients c
WHERE j.user_id IS NULL
  AND j.client_id IS NOT NULL
  AND j.client_id = c.id
  AND c.user_id IS NOT NULL;

-- ============================================
-- STEP 5: Create comprehensive client access policy
-- Clients can access jobs where ANY of these conditions are true:
-- 1. user_id = auth.uid() (direct ownership via user_id column)
-- 2. client_email matches the user's email
-- 3. client_id references their record in the clients table
-- ============================================
CREATE POLICY "jobs_client_access" ON public.jobs
  FOR ALL USING (
    -- Condition 1: Direct user_id match (new pattern)
    user_id = (select auth.uid())
    OR
    -- Condition 2: Email match (for jobs created before user_id was added)
    (
      client_email IS NOT NULL 
      AND lower(client_email) = lower((SELECT email FROM auth.users WHERE id = (select auth.uid())))
    )
    OR
    -- Condition 3: Legacy client_id match through clients table
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = jobs.client_id 
      AND c.user_id = (select auth.uid())
    )
  );

-- ============================================
-- STEP 6: Create/update trigger to auto-set user_id on insert
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
-- STEP 7: Also update on UPDATE to catch backfills
-- ============================================
CREATE OR REPLACE FUNCTION public.update_job_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is null and client_email is set, try to find user
  IF NEW.user_id IS NULL AND NEW.client_email IS NOT NULL THEN
    SELECT id INTO NEW.user_id 
    FROM auth.users 
    WHERE lower(email) = lower(NEW.client_email)
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_job_user_id ON public.jobs;
CREATE TRIGGER trigger_update_job_user_id
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (OLD.user_id IS NULL AND NEW.user_id IS NULL)
  EXECUTE FUNCTION public.update_job_user_id();

-- ============================================
-- STEP 8: Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT, INSERT ON public.jobs TO anon;

-- ============================================
-- STEP 9: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
