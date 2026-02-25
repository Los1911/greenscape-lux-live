# Admin Dashboard Jobs Loading Fix

## Issue
Admin Dashboard was failing to load jobs with a Supabase 400 error:
```
GET /rest/v1/quotes?
select=*
&assigned_landscaper_id=is.null
&status=eq.pending
&order=created_at.desc
→ 400 Bad Request
```

The UI showed "Failed to load jobs" in the Job Matching section.

## Root Cause
The `JobMatchingDashboard.tsx` component was querying the `quotes` table with filters that don't match the actual schema:
- `assigned_landscaper_id` column does not exist in `quotes` table
- The platform now uses `jobs` as the source of truth, not `quotes`

## Files Updated

### 1. src/components/admin/JobMatchingDashboard.tsx
**Before:**
```typescript
const { data, error } = await supabase
  .from('quotes')
  .select('*')
  .is('assigned_landscaper_id', null)
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

**After:**
```typescript
const { data, error: queryError } = await supabase
  .from('jobs')
  .select(`
    id,
    service_type,
    service_name,
    service_address,
    property_address,
    property_city,
    property_state,
    status,
    landscaper_id,
    client_email,
    customer_name,
    preferred_date,
    created_at,
    price
  `)
  .is('landscaper_id', null)
  .in('status', ['pending', 'available', 'priced'])
  .order('created_at', { ascending: false });
```

**Changes:**
- Query `jobs` table instead of `quotes`
- Use `landscaper_id` instead of non-existent `assigned_landscaper_id`
- Filter by job statuses that need assignment: `pending`, `available`, `priced`
- Explicit column selection (no `SELECT *`)
- Added error handling and error state UI
- Added job details summary in the UI

### 2. src/utils/jobMatchingEngine.ts
**Before:**
```typescript
export async function autoAssignJob(quoteId: string, landscaperId: string): Promise<boolean> {
  const { error } = await supabase.from('job_assignments').insert({
    quote_id: quoteId,
    landscaper_id: landscaperId,
    assigned_at: new Date().toISOString(),
    assigned_by: 'system',
    status: 'pending'
  });
  // ...
}
```

**After:**
```typescript
export async function autoAssignJob(jobId: string, landscaperId: string): Promise<boolean> {
  // Update the job directly
  const { error: jobError } = await supabase
    .from('jobs')
    .update({
      landscaper_id: landscaperId,
      status: 'assigned',
      is_available: false,
      accepted_at: new Date().toISOString()
    })
    .eq('id', jobId);

  // Also create job_assignments record (non-blocking)
  // Also update related quote if exists (non-blocking)
  // ...
}
```

**Changes:**
- Primary action now updates `jobs` table directly
- Sets `landscaper_id`, `status`, `is_available`, and `accepted_at`
- Secondary actions (job_assignments, quotes) are non-blocking
- Better error handling with warnings instead of failures for secondary updates

## Job Lifecycle Statuses
The admin dashboard now correctly handles all job statuses:
- `pending` - New job, needs pricing
- `available` - Priced and available for landscapers
- `priced` - Has been priced by admin
- `assigned` - Assigned to a landscaper
- `scheduled` - Has a scheduled date
- `in_progress` - Work has started
- `completed_pending_review` - Work done, awaiting admin review
- `completed` - Fully completed and approved
- `flagged_review` - Flagged for admin attention
- `cancelled` - Job was cancelled

## Verification
After this fix:
1. Admin Dashboard loads without 400 errors
2. Job Matching panel shows unassigned jobs
3. Jobs Overview panel displays all jobs
4. Photo Review panel shows jobs with photos
5. Job Pricing panel allows pricing and assignment
6. Auto-assign updates the job correctly

## Related Components (Already Fixed)
These components were already querying `jobs` correctly:
- `AdminJobsPanel.tsx` - ✅ Queries `jobs` table
- `AdminJobPricingPanel.tsx` - ✅ Queries `jobs` table (updates quotes secondarily)
- `AdminJobPhotoReview.tsx` - ✅ Queries `job_photos` then `jobs`
