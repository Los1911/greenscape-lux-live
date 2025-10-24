-- Script to create admin user in Supabase
-- Run this in Supabase SQL Editor after creating the user in Authentication

-- Step 1: First create the user in Supabase Dashboard > Authentication > Users
-- Click "Add User" and create with:
-- Email: admin@greenscapelux.com
-- Password: [Your secure password]
-- Auto Confirm User: Yes

-- Step 2: Get the user ID from auth.users table
-- SELECT id, email FROM auth.users WHERE email = 'admin@greenscapelux.com';

-- Step 3: Run this script, replacing YOUR_USER_ID with the actual UUID
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the admin user ID (replace with your actual admin email)
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@greenscapelux.com';

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please create user in Authentication first.';
  END IF;

  -- Insert or update user in public.users table with admin role
  INSERT INTO public.users (id, email, role, first_name, last_name, is_super_admin)
  VALUES (
    admin_user_id,
    'admin@greenscapelux.com',
    'admin',
    'System',
    'Administrator',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_super_admin = true,
    updated_at = NOW();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE id = admin_user_id;

  RAISE NOTICE 'Admin user created successfully with ID: %', admin_user_id;
END $$;

-- Verify the admin user was created correctly
SELECT 
  u.id,
  u.email,
  u.role,
  u.is_super_admin,
  au.raw_user_meta_data->>'role' as metadata_role
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@greenscapelux.com';
