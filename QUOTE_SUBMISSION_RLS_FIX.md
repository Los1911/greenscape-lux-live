# Quote Submission RLS Policy Fix

## Issue Identified

The `quote_requests` table has Row Level Security (RLS) enabled but is **missing an INSERT policy for authenticated users**. This causes quote submissions to fail with:

```
new row violates row-level security policy for table "quote_requests"
```

## Root Cause

The original migration (`9999_create_quote_requests_table.sql`) only created:
1. `Allow anonymous insert quote_requests` - FOR INSERT TO **anon**
2. `Allow authenticated select quote_requests` - FOR SELECT TO authenticated (NOT INSERT!)
3. `Allow service role all quote_requests` - FOR ALL TO service_role

**The authenticated role can SELECT but NOT INSERT!**

## Immediate Fix (Run in Supabase SQL Editor)

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Fix RLS policy for quote_requests table to allow authenticated users to INSERT

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Allow authenticated insert quote_requests" ON public.quote_requests;

-- Create the INSERT policy for authenticated users
CREATE POLICY "Allow authenticated insert quote_requests"
  ON public.quote_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify the policy was created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'quote_requests' AND schemaname = 'public';
```

## Migration File Created

A migration file has been created at:
`supabase/migrations/9999_fix_quote_requests_auth_insert.sql`

This will be applied automatically on the next deployment if using Supabase migrations.

## Verification

After applying the fix, verify by running:

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'quote_requests' AND schemaname = 'public';
```

You should see a policy like:
- `Allow authenticated insert quote_requests` with cmd = `INSERT` and roles = `{authenticated}`

## Expected Policies After Fix

| Policy Name | Command | Roles |
|------------|---------|-------|
| Allow anonymous insert quote_requests | INSERT | {anon} |
| Allow authenticated insert quote_requests | INSERT | {authenticated} |
| Allow authenticated select quote_requests | SELECT | {authenticated} |
| Allow service role all quote_requests | ALL | {service_role} |

## Testing

1. Log in as a client user
2. Navigate to the quote form
3. Fill out the form and submit
4. The quote should be saved successfully without RLS errors
