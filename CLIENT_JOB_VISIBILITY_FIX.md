# Client Job Visibility Fix

## Problem
Clients were unable to see their jobs on the dashboard while landscapers could see jobs correctly.

## Root Cause Analysis

### 1. RLS Policy Issue
The RLS policy in `9999_fix_rls_auth_functions.sql` had a bug:
```sql
CREATE POLICY "jobs_client_access" ON jobs
  FOR ALL USING ((select auth.uid()) = client_id);
```

This checked if `auth.uid() = client_id`, but `client_id` is a **foreign key to the `clients` table**, NOT the auth user ID. This policy would never match for clients.

### 2. Multiple Job Identification Methods
Jobs can be associated with clients via:
1. `user_id` - Direct reference to `auth.users.id` (new pattern)
2. `client_email` - Email address of the client (legacy pattern)
3. `client_id` - Foreign key to `clients` table (original schema)

The frontend was only querying by `user_id`, missing jobs created with `client_email` or `client_id`.

## Solution

### 1. New RLS Policy (Migration: `9999_fix_client_job_visibility_v2.sql`)

Created a comprehensive RLS policy that checks ALL three conditions:

```sql
CREATE POLICY "jobs_client_access" ON public.jobs
  FOR ALL USING (
    -- Condition 1: Direct user_id match
    user_id = (select auth.uid())
    OR
    -- Condition 2: Email match
    (
      client_email IS NOT NULL 
      AND lower(client_email) = lower((SELECT email FROM auth.users WHERE id = (select auth.uid())))
    )
    OR
    -- Condition 3: Legacy client_id match through clients table
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = jobs.client_id 
      AND c.user_id = (select auth.uid())
    )
  );
```

### 2. Trigger for Auto-Setting user_id

Added triggers to automatically set `user_id` on INSERT and UPDATE:
- On INSERT: Sets `user_id` from `auth.uid()` or looks up from `client_email`
- On UPDATE: Backfills `user_id` if still null

### 3. Frontend Query Updates

Updated all client job components to use OR queries:

**Components Updated:**
- `src/hooks/useDashboardData.ts`
- `src/components/client/MyJobsSection.tsx`
- `src/components/client/JobsOverviewSection.tsx`
- `src/components/client/LiveJobTrackingCard.tsx`
- `src/components/client/RecentJobsCard.tsx`

**Query Pattern:**
```typescript
const orConditions: string[] = [`user_id.eq.${user.id}`];
if (userEmail) {
  orConditions.push(`client_email.eq.${userEmail}`);
}

const { data } = await supabase
  .from('jobs')
  .select('*')
  .or(orConditions.join(','));
```

### 4. Realtime Subscriptions

Updated realtime subscriptions to listen to ALL job changes (not just filtered by user_id):
- The RLS policy handles filtering
- Components refetch on any job table change
- Ensures status updates are reflected immediately

## Files Changed

### Database
- `supabase/migrations/9999_fix_client_job_visibility_v2.sql` - New RLS policy and triggers

### Frontend
- `src/hooks/useDashboardData.ts` - OR query for client jobs
- `src/components/client/MyJobsSection.tsx` - OR query + realtime
- `src/components/client/JobsOverviewSection.tsx` - OR query + realtime
- `src/components/client/LiveJobTrackingCard.tsx` - OR query + realtime
- `src/components/client/RecentJobsCard.tsx` - OR query + realtime

## Deployment Steps

1. **Apply the migration:**
   ```bash
   supabase db push
   ```
   Or run the SQL in `9999_fix_client_job_visibility_v2.sql` directly in Supabase SQL Editor.

2. **Deploy frontend changes:**
   The frontend changes will be deployed with the next build.

## Verification

After deployment, verify:
1. Client can see jobs created with their email
2. Client can see jobs created while logged in (user_id set)
3. Job status changes are reflected in real-time
4. Landscaper job visibility is unaffected

## Console Logging

Each component logs its queries for debugging:
- `[useDashboardData]` - Dashboard stats
- `[MyJobsSection]` - Full job list
- `[JobsOverviewSection]` - Job statistics
- `[LiveJobTrackingCard]` - Active jobs
- `[RecentJobsCard]` - Recent jobs

Check browser console for these logs to verify queries are working.
