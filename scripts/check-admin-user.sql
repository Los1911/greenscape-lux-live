-- Check if admin.1@greenscapelux.com exists in public.users table
SELECT 
  id, 
  email, 
  role, 
  created_at,
  updated_at
FROM public.users 
WHERE email = 'admin.1@greenscapelux.com';

-- If the above query returns no results, run this to create the admin user:
-- First, get the user ID from Supabase Auth (auth.users table)
SELECT 
  id, 
  email, 
  created_at
FROM auth.users 
WHERE email = 'admin.1@greenscapelux.com';

-- Then insert into public.users table (replace 'USER_ID_FROM_ABOVE' with actual ID)
-- INSERT INTO public.users (id, email, role, created_at, updated_at)
-- VALUES (
--   'USER_ID_FROM_ABOVE',
--   'admin.1@greenscapelux.com',
--   'admin',
--   NOW(),
--   NOW()
-- );

-- Alternative: Create the admin user record if it doesn't exist
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin.1@greenscapelux.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.email = au.email
  );

-- Verify the admin user was created
SELECT 
  id, 
  email, 
  role, 
  created_at
FROM public.users 
WHERE email = 'admin.1@greenscapelux.com';