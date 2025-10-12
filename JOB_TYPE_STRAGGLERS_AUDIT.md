# Job Type Stragglers Audit Report

## Executive Summary
Found **11 files** with inline Job type definitions that need to import from canonical `src/types/job.ts`.

## Canonical Job Type (src/types/job.ts)
```typescript
export interface Job {
  id: string;
  service_name: string;        // NOT NULL
  service_type: string | null;
  service_address: string | null;
  price: number | null;
  preferred_date: string | null;
  status: string;              // NOT NULL
  customer_name: string;       // NOT NULL
  created_at: string;
  updated_at: string;
}
```

## Files Requiring Updates

### 1. ❌ src/components/admin/AdminJobManager.tsx
**Issue**: Inline `interface Job` with non-existent columns
```typescript
interface Job {
  id: number;  // Should be string
  client_email // ❌ Does not exist in schema
  landscaper_email // ❌ Does not exist in schema
}
```
**Fix**: Import Job from canonical, remove references to client_email/landscaper_email

### 2. ❌ src/components/client/JobDetailsModal.tsx
**Issue**: Inline `interface Job` with non-existent fields
```typescript
interface Job {
  landscaper_name // ❌ Not in schema
  landscaper_phone // ❌ Not in schema
  landscaper_email // ❌ Not in schema
}
```
**Fix**: Import Job, use service_address instead of address

### 3. ❌ src/professionals/types-and-actions.ts
**Issue**: Export interface Job with many legacy fields
```typescript
export interface Job {
  scheduled_at // ❌ Should be preferred_date
  started_at // ❌ Not in schema
  completed_at // ❌ Not in schema
  earnings // ❌ Not in schema
  landscaper_id // ❌ Not in schema
}
```
**Fix**: Import and re-export canonical Job type

### 4. ❌ src/components/JobDrawer.tsx
**Issue**: Type Job with legacy fields
```typescript
type Job = {
  title // ❌ Should be service_name
  service // ❌ Should be service_type
  scheduled_at // ❌ Should be preferred_date
  started_at // ❌ Not in schema
  completed_at // ❌ Not in schema
}
```
**Fix**: Import Job, map legacy fields to new schema

### 5. ❌ src/hooks/useDashboardData.ts
**Issue**: Inline interface JobData
**Fix**: Import and use canonical Job type

### 6. ❌ src/components/landscaper/PhotoGallery.tsx
**Issue**: Inline interface Job with title field
**Fix**: Import Job, use service_name

### 7. ❌ src/components/mapping/RouteOptimizer.tsx
**Issue**: Inline interface Job with title field
**Fix**: Import Job, use service_name

### 8. ❌ src/components/tracking/LiveJobTracker.tsx
**Issue**: Inline interface Job with title field
**Fix**: Import Job, use service_name

### 9. ❌ src/components/v2/layout/UpcomingJobs.tsx
**Issue**: Inline interface Job
**Fix**: Import canonical Job

### 10. ❌ src/pages/ClientHistory.tsx
**Issue**: Inline interface Job
**Fix**: Import canonical Job

### 11. ❌ src/pages/NewRequests.tsx
**Issue**: Inline interface Job
**Fix**: Import canonical Job

## Recommended Fix Strategy

1. **Import canonical type**: `import { Job } from '@/types/job';`
2. **Remove inline definitions**
3. **Update field references**:
   - `title` → `service_name`
   - `service` → `service_type`
   - `address` → `service_address`
   - `scheduled_at` → `preferred_date`
4. **Remove non-existent fields**: client_email, landscaper_email, started_at, completed_at, earnings

## Type Safety Benefits
- Single source of truth
- Compile-time errors for schema drift
- Autocomplete for correct fields
- Prevents querying non-existent columns
