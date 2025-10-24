# Comprehensive Jobs Table Schema Audit Report

## Executive Summary

**Audit Date:** October 2, 2025  
**Scope:** All TypeScript interfaces, Supabase queries, and insert/update operations related to jobs table  
**Status:** ⚠️ CRITICAL MISMATCHES FOUND

---

## 1. Actual Jobs Table Schema

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_type TEXT,
  service_address TEXT,
  price NUMERIC,
  preferred_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Core Columns:
- ✅ `id` - UUID primary key
- ✅ `service_name` - NOT NULL
- ✅ `service_type` - nullable
- ✅ `service_address` - nullable
- ✅ `price` - nullable numeric
- ✅ `preferred_date` - nullable timestamptz
- ✅ `status` - NOT NULL (default 'pending')
- ✅ `customer_name` - NOT NULL
- ✅ `created_at` - timestamptz
- ✅ `updated_at` - timestamptz

---

## 2. TypeScript Interface Audit

### ❌ PROBLEM: Multiple Conflicting Job Interfaces

#### File: `src/professionals/types-and-actions.ts`
```typescript
export interface Job {
  id: string;
  service_name?: string | null;        // ✅ Correct
  service_type?: string | null;        // ✅ Correct
  service_address?: string | null;     // ✅ Correct
  // Legacy fields for backward compatibility
  title?: string | null;               // ❌ NOT IN SCHEMA
  service?: string | null;             // ❌ NOT IN SCHEMA
  address?: string | null;             // ❌ NOT IN SCHEMA
  scheduled_at: string | null;         // ❌ Should be preferred_date
  started_at?: string | null;          // ❌ NOT IN SCHEMA
  completed_at?: string | null;        // ❌ NOT IN SCHEMA
  status: string | null;               // ✅ Correct
  price?: number | null;               // ✅ Correct
  earnings?: number | null;            // ❌ NOT IN SCHEMA
  time_spans?: { start?: string; end?: string }[]; // ❌ NOT IN SCHEMA
  total_elapsed_minutes?: number | null; // ❌ NOT IN SCHEMA
  landscaper_id?: string | null;       // ❌ NOT IN SCHEMA
  landscaper_email?: string | null;    // ❌ NOT IN SCHEMA
  assigned_to?: string | null;         // ❌ NOT IN SCHEMA
  assigned_email?: string | null;      // ❌ NOT IN SCHEMA
  before_photo_url?: string | null;    // ❌ NOT IN SCHEMA
  after_photo_url?: string | null;     // ❌ NOT IN SCHEMA
  notes?: string | null;               // ❌ NOT IN SCHEMA
}
```

#### File: `src/db/contracts.ts`
```typescript
export type Job = {
  id: string;
  landscaper_id: string;               // ❌ NOT IN SCHEMA
  assigned_email: string | null;       // ❌ NOT IN SCHEMA
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduled_at: string | null;         // ❌ Should be preferred_date
  started_at: string | null;           // ❌ NOT IN SCHEMA
  completed_at: string | null;         // ❌ NOT IN SCHEMA
  earnings: number | null;             // ❌ NOT IN SCHEMA
};
```

#### File: `src/hooks/useDashboardData.ts`
```typescript
interface JobData {
  id: string;                          // ✅ Correct
  service_name: string;                // ✅ Correct
  service_type: string;                // ✅ Correct
  status: string;                      // ✅ Correct
  price?: number;                      // ✅ Correct
  created_at: string;                  // ✅ Correct
  preferred_date?: string;             // ✅ Correct
  customer_name?: string;              // ✅ Correct
  service_address?: string;            // ✅ Correct
}
```
**Status:** ✅ CORRECT - This is the best interface

---

## 3. Query Audit - SELECT Statements

### ✅ CORRECT Queries

#### `src/components/JobWorkflowManager.tsx` (Line 37-40)
```typescript
.from('jobs')
.select('id, service_name, service_type, service_address, status, client_email, landscaper_id, created_at, price, customer_name')
```
**Issue:** Selects `client_email` and `landscaper_id` which don't exist in schema

#### `src/hooks/useDashboardData.ts` (Line 95-99)
```typescript
.from('jobs')
.select('id, service_name, service_type, service_address, status, created_at, preferred_date, price')
```
**Status:** ✅ PERFECT

#### `src/pages/NewRequests.tsx` (Line 36-38)
```typescript
.from('jobs')
.select('id, customer_name, service_address, service_type, preferred_date, price, status')
```
**Status:** ✅ PERFECT

### ❌ PROBLEMATIC Queries

#### `src/components/admin/AdminJobManager.tsx` (Line 37-39)
```typescript
.from('jobs')
.select('id, service_name, service_type, service_address, status, client_email, landscaper_email, scheduled_at, created_at, price')
```
**Issues:**
- ❌ `client_email` - NOT IN SCHEMA
- ❌ `landscaper_email` - NOT IN SCHEMA
- ❌ `scheduled_at` - Should be `preferred_date`

#### `src/components/landscaper/LandscaperUpcomingJobs.tsx` (Line 58-60)
```typescript
.from('jobs')
.select('id, status, earnings, created_at, completed_at, customer_name, client_email, landscaper_id, assigned_email')
```
**Issues:**
- ❌ `earnings` - NOT IN SCHEMA
- ❌ `completed_at` - NOT IN SCHEMA
- ❌ `client_email` - NOT IN SCHEMA
- ❌ `landscaper_id` - NOT IN SCHEMA
- ❌ `assigned_email` - NOT IN SCHEMA

---

## 4. INSERT/UPDATE Operations Audit

### ✅ CORRECT Insert (CreateJobModal.tsx - Line 65-72)
```typescript
.from('jobs').insert([{
  service_name: formData.service_name,
  service_type: formData.service_name,
  service_address: formData.address,
  price: parseFloat(formData.price),
  preferred_date: preferredDateISO,
  customer_name: formData.customer_name || formData.client_email?.split('@')[0] || 'Unknown',
  status: 'pending'
}])
```
**Status:** ✅ CORRECT - All columns match schema

### ✅ CORRECT Insert (AvailableJobs.tsx - Line 93-100)
```typescript
.from('jobs').insert({
  customer_name: quote.customer_name || quote.customer_email?.split('@')[0] || 'Unknown',
  service_name: quote.service_type || 'Landscaping Service',
  service_type: quote.service_type,
  service_address: quote.property_address,
  price: quote.estimated_price || 0,
  preferred_date: quote.preferred_date,
  status: 'pending'
})
```
**Status:** ✅ CORRECT - All columns match schema

### ❌ PROBLEMATIC Update (RescheduleModal.tsx - Line 39-41)
```typescript
.from('jobs')
.update({ 
  date: newDateTime,  // ❌ Should be preferred_date
  status: 'rescheduled'
})
```

---

## 5. Critical Issues Summary

### Schema Drift Problems:
1. **Multiple conflicting Job type definitions** across codebase
2. **Non-existent columns** being queried (client_email, landscaper_email, earnings, etc.)
3. **Legacy column names** still in use (scheduled_at, title, address)
4. **Missing NOT NULL constraint** handling for customer_name

### Type Safety Issues:
1. No single source of truth for Job type
2. Optional fields that are actually NOT NULL in database
3. Extra fields in types that don't exist in schema

---

## 6. Recommended Fixes

### Step 1: Create Canonical Job Type

Create `src/types/job.ts`:
```typescript
/**
 * Canonical Job type matching actual database schema
 * DO NOT modify without updating database schema
 */
export interface Job {
  id: string;
  service_name: string;        // NOT NULL
  service_type: string | null;
  service_address: string | null;
  price: number | null;
  preferred_date: string | null; // ISO timestamp
  status: string;              // NOT NULL
  customer_name: string;       // NOT NULL
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

// For inserts (omit auto-generated fields)
export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'>;

// For updates (all fields optional except id)
export type JobUpdate = Partial<Omit<Job, 'id'>>;
```

### Step 2: Create Type-Safe Database Client

Create `src/lib/jobsClient.ts`:
```typescript
import { supabase } from './supabase';
import type { Job, JobInsert, JobUpdate } from '@/types/job';

export const jobsClient = {
  // Get all jobs
  async getAll() {
    return supabase
      .from('jobs')
      .select('id, service_name, service_type, service_address, price, preferred_date, status, customer_name, created_at, updated_at')
      .returns<Job[]>();
  },

  // Get job by ID
  async getById(id: string) {
    return supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()
      .returns<Job>();
  },

  // Create job
  async create(job: JobInsert) {
    // Validate NOT NULL constraints
    if (!job.service_name) throw new Error('service_name is required');
    if (!job.customer_name) throw new Error('customer_name is required');
    
    return supabase
      .from('jobs')
      .insert(job)
      .select()
      .single()
      .returns<Job>();
  },

  // Update job
  async update(id: string, updates: JobUpdate) {
    return supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .returns<Job>();
  }
};
```

### Step 3: Validation Helper

Create `src/lib/jobValidation.ts`:
```typescript
import type { JobInsert } from '@/types/job';

export function validateJobInsert(job: Partial<JobInsert>): job is JobInsert {
  if (!job.service_name) {
    throw new Error('service_name is required');
  }
  if (!job.customer_name) {
    throw new Error('customer_name is required');
  }
  if (!job.status) {
    throw new Error('status is required');
  }
  return true;
}

export function ensureCustomerName(email?: string, name?: string): string {
  if (name) return name;
  if (email) return email.split('@')[0];
  throw new Error('Either customer_name or email must be provided');
}
```

---

## 7. Migration Plan

### Phase 1: Create Type-Safe Foundation (Do First)
1. ✅ Create `src/types/job.ts` with canonical Job type
2. ✅ Create `src/lib/jobsClient.ts` with type-safe queries
3. ✅ Create `src/lib/jobValidation.ts` with validation helpers

### Phase 2: Update All Files (Do in Order)
1. Update `src/professionals/types-and-actions.ts` to import from `src/types/job.ts`
2. Update `src/db/contracts.ts` to use canonical Job type
3. Fix all SELECT queries to only request existing columns
4. Fix all INSERT/UPDATE operations to use type-safe client
5. Remove all references to non-existent columns

### Phase 3: Add Runtime Validation
1. Add Zod schema for runtime validation
2. Add database migration to add CHECK constraints
3. Add API layer validation

---

## 8. Files Requiring Updates

### High Priority (Breaking Errors)
- ❌ `src/components/admin/AdminJobManager.tsx` - Queries non-existent columns
- ❌ `src/components/landscaper/LandscaperUpcomingJobs.tsx` - Queries non-existent columns
- ❌ `src/components/client/RescheduleModal.tsx` - Updates wrong column name
- ❌ `src/db/contracts.ts` - Wrong type definition

### Medium Priority (Type Safety)
- ⚠️ `src/professionals/types-and-actions.ts` - Too many extra fields
- ⚠️ `src/components/JobWorkflowManager.tsx` - Queries extra columns
- ⚠️ All files using Job interface

### Low Priority (Cleanup)
- 📝 Remove legacy field references
- 📝 Add JSDoc comments to types
- 📝 Add integration tests

---

## 9. Conclusion

**Current State:** Multiple conflicting Job types with many non-existent columns being queried

**Recommendation:** Implement type-safe client layer immediately to prevent schema drift

**Benefits:**
- ✅ Single source of truth for Job type
- ✅ Compile-time type checking
- ✅ Runtime validation
- ✅ Prevents NOT NULL constraint errors
- ✅ Self-documenting code
- ✅ Easier refactoring

**Next Steps:**
1. Create canonical types (30 minutes)
2. Create type-safe client (1 hour)
3. Update all files (2-3 hours)
4. Add tests (1 hour)

Total estimated time: 4-5 hours
