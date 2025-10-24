-- Add address column to profiles table
-- This migration safely adds the missing 'address' column that the frontend expects

-- Add address column to profiles table (safe to run multiple times)
alter table public.profiles
  add column if not exists address text;

-- Add comment for documentation
comment on column public.profiles.address is 'Service address for client profiles';

-- Optional: Add index for address-based queries if needed in the future
-- create index if not exists idx_profiles_address on public.profiles(address);