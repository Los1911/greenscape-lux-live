# JOBS TABLE customer_name AUDIT REPORT
**Generated:** 2025-10-02  
**Objective:** Audit all code paths where jobs are created to ensure `customer_name` is always included in inserts

---

## ✅ JOBS TABLE SCHEMA (CONFIRMED)
Your jobs table columns:
- `id`
- `service_name`
- `service_type`
- `service_address`
- `price`
- `preferred_date`
- `status`
- `created_at`
- `updated_at`
- **`customer_name`** (NOT NULL constraint)

---

## 🔍 AUDIT FINDINGS

### 1. ✅ **CreateJobModal.tsx** (Admin Job Creation)
**File:** `src/components/admin/CreateJobModal.tsx`  
**Line:** 61-72

**Status:** ✅ **INCLUDES customer_name**

```typescript
const { error } = await supabase.from('jobs').insert([{
  service_name: formData.service_name,
  client_email: formData.client_email,
  landscaper_email: formData.landscaper_email || null,
  price: parseFloat(formData.price),
  service_address: formData.location,
  scheduled_date: formData.date,
  scheduled_time: formData.time,
  status: formData.status,
  customer_name: formData.client_email.split('@')[0], // ✅ PRESENT (fallback)
  created_at: new Date().toISOString()
}]);
```

**Notes:**
- Uses email prefix as fallback for customer_name
- ⚠️ Uses non-existent columns: `scheduled_date`, `scheduled_time`
- Should use: `preferred_date` instead

---

### 2. ✅ **AvailableJobs.tsx** (Landscaper Accepts Quote → Creates Job)
**File:** `src/components/v2/layout/AvailableJobs.tsx`  
**Line:** 92-108

**Status:** ✅ **INCLUDES customer_name**

```typescript
const { error: jobError } = await supabase
  .from('jobs')
  .insert({
    customer_name: quote.customer_name, // ✅ PRESENT
    service_address: quote.location,
    service_type: quote.service_type,
    preferred_date: quote.preferred_date,
    status: 'scheduled',
    notes: quote?.notes ?? '',
    landscaper_id: user.id,
    client_email: quote.customer_email,
    landscaper_email: landscaper.email,
    assigned_email: landscaper.email,
    time_spans: [],
    total_elapsed_minutes: 0,
    earnings: 0
  });
```

**Notes:**
- Properly pulls `customer_name` from quote object
- ⚠️ Includes non-schema columns: `notes`, `landscaper_email`, `assigned_email`, `time_spans`, `total_elapsed_minutes`, `earnings`
- Missing: `service_name`, `price`

---

### 3. ⚠️ **NewRequests.tsx** (Landscaper Accepts Pending Job)
**File:** `src/pages/NewRequests.tsx`  
**Line:** 69-76

**Status:** ⚠️ **DOES NOT CREATE JOBS** (only updates existing jobs)

```typescript
// Update job with landscaper ID and change status
const { error } = await supabase
  .from('jobs')
  .update({
    landscaper_id: user.id,
    status: 'accepted',
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId);
```

**Notes:**
- This is an UPDATE operation, not INSERT
- Assumes jobs already exist with customer_name
- No risk of NOT NULL constraint violation

---

## 🚨 CRITICAL ISSUES FOUND

### Issue #1: Missing `customer_name` Source Validation
**Problem:** `AvailableJobs.tsx` assumes `quote.customer_name` exists in quotes table

**Risk:** If quotes table doesn't have `customer_name`, job creation will fail

**Recommendation:**
```typescript
customer_name: quote.customer_name || quote.customer_email?.split('@')[0] || 'Unknown',
```

---

### Issue #2: Schema Mismatch in CreateJobModal
**Problem:** Inserts `scheduled_date` and `scheduled_time` which don't exist in jobs table

**Fix Required:**
```typescript
// WRONG:
scheduled_date: formData.date,
scheduled_time: formData.time,

// CORRECT:
preferred_date: formData.date,
// Remove scheduled_time (no equivalent column)
```

---

### Issue #3: Extra Columns in AvailableJobs Insert
**Problem:** Inserting columns that don't exist in schema:
- `notes`
- `landscaper_email`
- `assigned_email`
- `time_spans`
- `total_elapsed_minutes`
- `earnings`

**Impact:** Will cause database errors

**Fix Required:** Remove all non-existent columns from insert

---

## 📋 QUOTE SUBMISSION PATHS (DO NOT CREATE JOBS)

### GetQuoteEnhanced.tsx
**File:** `src/pages/GetQuoteEnhanced.tsx`  
**Line:** 174-187

**Action:** Inserts into `quote_requests` table (NOT jobs)

```typescript
const { data: dbData, error: dbError } = await supabase
  .from('quote_requests')  // ← Different table
  .insert({
    name: formData.name,
    email: formData.email,
    // ... other quote fields
  })
```

**Status:** ✅ Not relevant to jobs table

---

### ClientQuoteForm.tsx
**File:** `src/pages/ClientQuoteForm.tsx`  
**Line:** 127-138, 149-160

**Action:** Inserts into `quote_requests` table (NOT jobs)

**Status:** ✅ Not relevant to jobs table

---

## ✅ RECOMMENDATIONS

### 1. Fix CreateJobModal.tsx
```typescript
const { error } = await supabase.from('jobs').insert([{
  service_name: formData.service_name,
  service_type: formData.service_name, // Add this
  client_email: formData.client_email,
  price: parseFloat(formData.price),
  service_address: formData.location,
  preferred_date: formData.date, // FIXED
  status: formData.status,
  customer_name: formData.client_email.split('@')[0],
  created_at: new Date().toISOString()
}]);
```

### 2. Fix AvailableJobs.tsx
```typescript
const { error: jobError } = await supabase
  .from('jobs')
  .insert({
    customer_name: quote.customer_name || quote.customer_email?.split('@')[0] || 'Unknown',
    service_name: quote.service_type, // Add
    service_type: quote.service_type,
    service_address: quote.location,
    preferred_date: quote.preferred_date,
    price: 0, // Add with default or calculate
    status: 'scheduled',
    landscaper_id: user.id,
    client_email: quote.customer_email,
    created_at: new Date().toISOString()
  });
```

### 3. Add Validation Helper
Create a utility function to ensure customer_name is always present:

```typescript
// src/utils/jobValidation.ts
export function ensureCustomerName(data: any): string {
  return data.customer_name 
    || data.name 
    || data.client_name 
    || data.email?.split('@')[0] 
    || 'Unknown Customer';
}
```

---

## 📊 SUMMARY

| File | Creates Jobs? | Includes customer_name? | Status |
|------|--------------|------------------------|--------|
| CreateJobModal.tsx | ✅ Yes | ✅ Yes (fallback) | ⚠️ Schema mismatch |
| AvailableJobs.tsx | ✅ Yes | ✅ Yes | ⚠️ Extra columns |
| NewRequests.tsx | ❌ No (updates only) | N/A | ✅ OK |
| GetQuoteEnhanced.tsx | ❌ No (quote_requests) | N/A | ✅ OK |
| ClientQuoteForm.tsx | ❌ No (quote_requests) | N/A | ✅ OK |

---

## 🎯 ACTION ITEMS

1. ✅ **customer_name is included in all job creation paths**
2. ⚠️ **Fix schema mismatches in CreateJobModal.tsx**
3. ⚠️ **Remove extra columns from AvailableJobs.tsx insert**
4. ✅ **Add fallback validation for customer_name**
5. ⚠️ **Verify quotes table has customer_name column**

---

**Conclusion:** All job creation paths include `customer_name`, but there are schema mismatches that need fixing to prevent other database errors.
