-- =====================================================
-- AUTH.USERS TO PUBLIC.USERS SYNC SYSTEM
-- =====================================================
-- This migration creates a comprehensive sync system to ensure
-- all auth.users have corresponding public.users records with
-- correct roles assigned from clients/landscapers/admins tables.

-- Step 1: Backfill missing users from auth.users to public.users
-- =====================================================
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    (SELECT 'admin' FROM public.admin_sessions WHERE user_id = au.id LIMIT 1),
    (SELECT 'landscaper' FROM public.landscapers WHERE email = au.email LIMIT 1),
    (SELECT 'client' FROM public.clients WHERE email = au.email LIMIT 1),
    'client' -- Default fallback
  ) as role,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update user_id in clients table where missing
-- =====================================================
UPDATE public.clients c
SET user_id = au.id, updated_at = NOW()
FROM auth.users au
WHERE c.email = au.email 
  AND c.user_id IS NULL;

-- Step 3: Update user_id in landscapers table where missing
-- =====================================================
UPDATE public.landscapers l
SET user_id = au.id, updated_at = NOW()
FROM auth.users au
WHERE l.email = au.email 
  AND l.user_id IS NULL;

-- Step 4: Create function to sync auth.users to public.users on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'client';
BEGIN
  -- Determine role based on existing records
  IF EXISTS (SELECT 1 FROM public.admin_sessions WHERE user_id = NEW.id) THEN
    user_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.landscapers WHERE email = NEW.email) THEN
    user_role := 'landscaper';
  ELSIF EXISTS (SELECT 1 FROM public.clients WHERE email = NEW.email) THEN
    user_role := 'client';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_role, NEW.created_at, NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, 
      role = EXCLUDED.role,
      updated_at = NOW();

  -- Link to clients table if exists
  UPDATE public.clients 
  SET user_id = NEW.id, updated_at = NOW()
  WHERE email = NEW.email AND user_id IS NULL;

  -- Link to landscapers table if exists
  UPDATE public.landscapers 
  SET user_id = NEW.id, updated_at = NOW()
  WHERE email = NEW.email AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create audit log table for sync tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sync_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_sync_audit_created 
  ON public.user_sync_audit(created_at DESC);

COMMENT ON TABLE public.user_sync_audit IS 
  'Audit log for auth.users to public.users sync operations';
