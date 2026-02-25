# Landscaper Login Misroute Diagnostic Report

## Issue Summary
Landscapers logging into GreenScape Lux are being redirected to `/client-dashboard` instead of `/landscaper-dashboard` after successful authentication.

## Root Cause Analysis

### Database Schema vs. ProfileSync Query Mismatch

**Database Schema (from 001_core_tables.sql):**
```sql
-- users table HAS email column
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'landscaper', 'admin')),
  ...
);

-- clients table DOES NOT have email column
CREATE TABLE public.clients (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  company_name TEXT,
  ...
  -- NO email field
);

-- landscapers table DOES NOT have email column
CREATE TABLE public.landscapers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  business_name TEXT,
  ...
  -- NO email field
);
```

**ProfileSync Code (src/utils/profileSync.ts):**
```typescript
// ❌ PROBLEM: Querying for 'email' field that doesn't exist
const { data: clientByEmail } = await supabase
  .from('clients')
  .select('id, user_id, email')  // ❌ email column doesn't exist!
  .eq('email', email)
  .maybeSingle();

const { data: landscaperByEmail } = await supabase
  .from('landscapers')
  .select('id, user_id, email')  // ❌ email column doesn't exist!
  .eq('email', email)
  .maybeSingle();
```

### What Happens During Landscaper Login

1. **Authentication succeeds** → Supabase auth.user created
2. **profileSync runs** with authUserId and email
3. **Query clients by user_id** → Not found (correct)
4. **Query clients by email** → FAILS silently (column doesn't exist) → returns null
5. **Query landscapers by user_id** → Not found (if user_id is null)
6. **Query landscapers by email** → FAILS silently (column doesn't exist) → returns null
7. **Fallback to 'client' role** (line 115 in profileSync.ts)
8. **AuthContext redirects** to /client-dashboard based on role='client'

### Console Log Pattern

```
[PROFILE_SYNC] Starting profile sync
[PROFILE_SYNC] Checking clients table by user_id...
[PROFILE_SYNC] Not found by user_id, checking clients by email...
[PROFILE_SYNC] Checking landscapers table by user_id...
[PROFILE_SYNC] Not found by user_id, checking landscapers by email...
[PROFILE_SYNC] ⚠️ No profile found in any table
[PROFILE_SYNC] Decision: role=client (fallback), table=null, linked=false
[AUTH] Setting role in state: client
[REDIRECT] Destination: /client-dashboard
```

## Solution

### Option 1: Query users table first (RECOMMENDED)
Query the `users` table (which has both email and role) to determine the user's role, then check the appropriate profile table.

### Option 2: Add email columns to profile tables
Add email columns to clients and landscapers tables, but this creates data duplication.

### Option 3: Join queries
Use Supabase joins to query users table along with profile tables.

## Implementation (Option 1)

Update `src/utils/profileSync.ts` to:
1. Query users table by auth.user.id to get role
2. Based on role, query the appropriate profile table
3. Link user_id if needed
4. Return correct role

This ensures landscapers are properly identified and routed to the correct dashboard.
