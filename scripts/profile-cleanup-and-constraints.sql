-- Database Cleanup Script: Profiles Table Integrity
-- This script identifies orphaned records, creates missing profiles, and adds constraints

-- Step 1: Create missing profiles for auth users without profiles
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'client'::text as role,
  u.created_at,
  u.created_at as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email_confirmed_at IS NOT NULL;

-- Step 2: Update profiles with missing email from auth.users
UPDATE public.profiles 
SET email = u.email
FROM auth.users u
WHERE profiles.id = u.id 
  AND (profiles.email IS NULL OR profiles.email = '');

-- Step 3: Remove any truly orphaned profiles (no matching auth user)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 4: Add unique constraint on id (should already exist as primary key)
-- This is redundant but ensures no duplicates on id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'profiles_id_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);
  END IF;
END $$;

-- Step 5: Add unique constraint on email (prevent duplicate emails)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'profiles_email_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- Step 6: Create function to auto-create profiles on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    'client',
    new.created_at,
    new.created_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);