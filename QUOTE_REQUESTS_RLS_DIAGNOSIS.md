# Quote Requests RLS Diagnosis & Fix

## Problem Identified ❌
The `quote_requests` table has Row Level Security (RLS) enabled but **NO POLICIES** defined for INSERT operations. This causes all insert attempts to fail with "Returned response is null" because Supabase blocks the operation.

## Root Cause Analysis
1. **RLS Enabled**: The table has RLS turned on (security feature)
2. **Missing Policies**: No policies exist to allow INSERT operations
3. **Anonymous Access Needed**: Quote forms are filled by non-logged-in users
4. **Database Rejection**: All insert attempts are silently rejected

## Solution Applied ✅

### 1. Created RLS Fix Script
File: `scripts/quote-requests-rls-fix.sql`

### 2. Policies Added
- **Anonymous Insert**: Allows public quote form submissions
- **Authenticated Insert**: Allows logged-in users to submit quotes
- **Service Role Access**: Allows edge functions full access
- **Admin Access**: Allows admins to view all quote requests

### 3. Next Steps
1. **Run the SQL script** in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of scripts/quote-requests-rls-fix.sql
   ```

2. **Test quote submission** after applying the fix

3. **Verify in Supabase Dashboard**:
   - Go to Authentication → Policies
   - Check quote_requests table has new policies

## Expected Result After Fix
- Quote forms will successfully insert to database
- No more "Returned response is null" errors
- Proper email notifications via unified-email function
- Full audit trail in database

## Verification Commands
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quote_requests';

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'quote_requests';
```