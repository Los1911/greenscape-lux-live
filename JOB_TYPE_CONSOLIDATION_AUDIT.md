# Job Type Consolidation Audit

## Executive Summary
Found **12 files** with inline `Job` interface/type definitions that should import from `src/types/job.ts`.

## Canonical Job Type (src/types/job.ts)
```typescript
export interface Job {
  id: string;
  service_name: string;        // NOT NULL
  service_type: string;        // NOT NULL
  service_address: string;     // NOT NULL
  price: number;               // NOT NULL
  preferred_date: string;      // NOT NULL (ISO timestamp)
  status: string;              // NOT NULL
  customer_name: string;       // NOT NULL
  created_at?: string;
  updated_at?: string;
}
```

## Files Requiring Updates

### 1. ✅ CRITICAL - src/components/JobWorkflowManager.tsx
**Issue**: Inline Job interface, queries `client_email` (doesn't exist)
**Fix**: Import Job, remove client_email from query
```typescript
// Remove lines 9-19, add:
import { Job } from '@/types/job';
// Remove client_email from line 39
```

### 2. ✅ CRITICAL - src/components/client/JobCard.tsx
**Issue**: Inline Job interface with wrong fields (address, date, landscaper_name)
**Fix**: Import Job, map fields correctly
```typescript
// address → service_address
// date → preferred_date
// landscaper_name → not in schema (remove or join with profiles)
```

### 3. ✅ CRITICAL - src/components/JobDrawer.tsx
**Issue**: Uses many non-existent fields (title, service, scheduled_at, notes, started_at, completed_at, before_photo_url, after_photo_url)
**Fix**: This component needs major refactoring or should be deprecated
- title/service → service_name
- address → service_address
- scheduled_at → preferred_date
- Remove: notes, started_at, completed_at, photo URLs (not in schema)

### 4. src/components/admin/LiveJobsFeed.tsx
**Issue**: Inline type Job
**Fix**: Import from src/types/job.ts

### 5. src/components/client/JobDetailsModal.tsx
**Issue**: Inline Job interface
**Fix**: Import from src/types/job.ts, verify field mappings

### 6. src/components/landscaper/PhotoGallery.tsx
**Issue**: Uses title field (doesn't exist)
**Fix**: Import Job, use service_name

### 7. src/components/mapping/RouteOptimizer.tsx
**Issue**: Uses title, location fields
**Fix**: Import Job, use service_name, service_address

### 8. src/components/tracking/LiveJobTracker.tsx
**Issue**: Uses title field
**Fix**: Import Job, use service_name

### 9. src/components/v2/layout/UpcomingJobs.tsx
**Issue**: Inline Job interface
**Fix**: Import from src/types/job.ts

### 10. src/pages/ClientHistory.tsx
**Issue**: Inline Job interface
**Fix**: Import from src/types/job.ts

### 11. src/pages/NewRequests.tsx
**Issue**: Inline Job interface
**Fix**: Import from src/types/job.ts

### 12. src/professionals/types-and-actions.ts
**Issue**: Exports its own Job interface (might be intentional)
**Decision**: Check if this is used elsewhere; if not, import from src/types/job.ts

## Recommended Approach

1. **Phase 1**: Update simple files (just need import swap)
   - LiveJobsFeed.tsx
   - UpcomingJobs.tsx
   - ClientHistory.tsx
   - NewRequests.tsx

2. **Phase 2**: Update files with field mapping issues
   - JobWorkflowManager.tsx
   - JobCard.tsx
   - JobDetailsModal.tsx
   - PhotoGallery.tsx
   - RouteOptimizer.tsx
   - LiveJobTracker.tsx

3. **Phase 3**: Handle complex cases
   - JobDrawer.tsx (needs major refactoring)
   - types-and-actions.ts (verify usage)

## Type Safety Recommendation

Add a validation helper to prevent drift:
```typescript
// In src/lib/jobValidation.ts
export function assertJobSchema(obj: any): asserts obj is Job {
  const required = ['service_name', 'service_type', 'service_address', 
                    'price', 'preferred_date', 'status', 'customer_name'];
  for (const field of required) {
    if (!(field in obj)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}
```
