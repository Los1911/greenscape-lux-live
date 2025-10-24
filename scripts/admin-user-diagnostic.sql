-- ADMIN USER DIAGNOSTIC AND CREATION SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix admin.1@greenscapelux.com

-- Step 1: Check if user exists in auth.users (Supabase Auth)
SELECT 
  'AUTH TABLE CHECK' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at,
  user_metadata
FROM auth.users 
WHERE email = 'admin.1@greenscapelux.com';

-- Step 2: Check if user exists in public.users table
SELECT 
  'PUBLIC USERS TABLE CHECK' as check_type,
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  email_verified,
  created_at
FROM public.users 
WHERE email = 'admin.1@greenscapelux.com';

-- Step 3: Check if user exists in profiles table (fallback)
SELECT 
  'PROFILES TABLE CHECK' as check_type,
  id,
  email,
  role,
  first_name,
  last_name,
  created_at
FROM public.profiles 
WHERE email = 'admin.1@greenscapelux.com';

-- Step 4: Create admin user in public.users if missing
-- This will only insert if the user doesn't already exist
INSERT INTO public.users (
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'admin' as role,
  'Admin' as first_name,
  'User' as last_name,
  true as is_active,
  (au.email_confirmed_at IS NOT NULL) as email_verified,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email = 'admin.1@greenscapelux.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.email = 'admin.1@greenscapelux.com'
  );

-- Step 5: Verify the admin user was created successfully
SELECT 
  'VERIFICATION CHECK' as check_type,
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  email_verified,
  created_at
FROM public.users 
WHERE email = 'admin.1@greenscapelux.com';

-- Step 6: Update user metadata in auth.users to include admin role
UPDATE auth.users 
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin.1@greenscapelux.com';

-- Step 7: Final verification - show all admin user data
SELECT 
  'FINAL VERIFICATION' as check_type,
  au.id as auth_id,
  au.email as auth_email,
  au.user_metadata as auth_metadata,
  pu.id as public_id,
  pu.email as public_email,
  pu.role as public_role,
  pu.is_active as is_active
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admin.1@greenscapelux.com';