# Job Completion UI Fix - State Hydration Issue

## Issue
After clicking "Mark as Complete", the job update succeeded in the database (verified via SQL), but the UI did not transition out of `in_progress` state. Console showed 400/406 errors on post-completion SELECT queries for `jobs` and `pricing_history` tables.

## Root Cause
1. **Blocking refetches**: After job completion, the code awaited `loadJobs()` which could fail or be slow
2. **Strict `.single()` queries**: Code assumed `quote_id` and `pricing_history` always exist, causing 406 errors when they don't
3. **No optimistic updates**: UI waited for refetch to complete before showing the new status

## Fixes Applied

### 1. BidSuggestionCard.tsx
- **Changed**: `.single()` → `.maybeSingle()` for pricing_history queries
- **Added**: Graceful handling when no pricing data exists
- **Added**: Non-blocking win rate calculation with try/catch

### 2. JobsPanel.tsx (Landscaper Dashboard)
- **Added**: Optimistic UI updates - `setJobs()` updates local state immediately after successful DB update
- **Changed**: `loadJobs()` calls are now non-blocking (no await, wrapped in `.catch()`)
- **Changed**: `loadLandscaperProfile()` uses `.maybeSingle()` instead of `.single()`

### 3. UpcomingJobs.tsx
- **Added**: `onOptimisticUpdate` prop for parent-controlled optimistic updates
- **Added**: Local state fallback for optimistic updates when parent doesn't provide handler
- **Changed**: Parent refresh calls are non-blocking

### 4. JobDrawer.tsx
- **Added**: `onOptimisticUpdate` prop for immediate UI updates
- **Changed**: Parent `onUpdate()` calls wrapped in try/catch

### 5. GeofenceTracker.tsx
- **Changed**: `loadJobDetails()` uses `.maybeSingle()` instead of `.single()`
- **Added**: Proper error handling with try/catch

## Key Patterns Applied

### Optimistic UI Update Pattern
```typescript
// 1. Perform the database update
const { error } = await supabase
  .from('jobs')
  .update({ status: 'completed', completed_at: completedAt })
  .eq('id', jobId);

if (error) throw error;

// 2. IMMEDIATELY update local state (optimistic update)
setJobs(prev => prev.map(job => 
  job.id === jobId 
    ? { ...job, status: 'completed', completed_at: completedAt }
    : job
));

// 3. Show success toast
toast({ title: "Job Completed!" });

// 4. Non-blocking background refresh (don't await)
loadJobs().catch(err => console.warn('Background refresh failed:', err));
```

### Safe Query Pattern
```typescript
// BEFORE (causes 406 errors when no rows match)
const { data } = await supabase
  .from('pricing_history')
  .select('*')
  .eq('quote_id', jobId)
  .single();

// AFTER (returns null instead of error when no rows match)
const { data } = await supabase
  .from('pricing_history')
  .select('*')
  .eq('quote_id', jobId)
  .maybeSingle();
```

## Expected Behavior After Fix
1. Click "Mark as Complete" button
2. Database update succeeds
3. UI immediately shows "Completed" status (optimistic update)
4. Success toast appears
5. Background refresh syncs any other changes (non-blocking)
6. No 400/406 errors in console

## Testing Checklist
- [ ] Start job from assigned state → UI updates immediately
- [ ] Complete job from in_progress state → UI updates immediately
- [ ] Complete job when GPS is unavailable → Works correctly
- [ ] Complete job when no pricing_history exists → No errors
- [ ] Complete job when quote_request_id is null → No errors
- [ ] Refresh page after completion → Status persists correctly

## Files Modified
- `src/components/landscaper/BidSuggestionCard.tsx`
- `src/pages/landscaper-dashboard/JobsPanel.tsx`
- `src/components/landscaper/UpcomingJobs.tsx`
- `src/components/JobDrawer.tsx`
- `src/components/landscaper/GeofenceTracker.tsx`
