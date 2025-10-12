# Profile Address Column Fix

## Problem
The frontend is trying to update/select an `address` field in the `profiles` table, but this column doesn't exist in Supabase, causing the error:
```
"Could not find the 'address' column of 'profiles' in the schema cache"
```

## Solution
Add the missing `address` column to the `profiles` table using the provided migration.

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/9999_add_address_to_profiles.sql`
4. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
supabase db push
```

## Migration Details
- **File**: `supabase/migrations/9999_add_address_to_profiles.sql`
- **Action**: Adds `address text` column to `public.profiles` table
- **Safety**: Uses `add column if not exists` - safe to run multiple times
- **Impact**: Zero downtime, no existing data affected

## What This Fixes
- ✅ Profile editing will work without errors
- ✅ Address field will save and load properly
- ✅ Profile completion tracking will include address
- ✅ No frontend code changes needed

## Backup Recommendation
Before running the migration:
1. **Export your project** via Supabase Dashboard > Settings > General > Export
2. Or create a database backup if you have CLI access

## Post-Migration Verification
After running the migration, test:
1. Edit a client profile and add an address
2. Verify the address saves successfully
3. Check that the address appears when reloading the profile

## Future Schema Management
- Keep database schema and frontend in sync
- Add new migrations for any schema changes
- Use `if not exists` clauses for safety
- Document all schema changes in migration files