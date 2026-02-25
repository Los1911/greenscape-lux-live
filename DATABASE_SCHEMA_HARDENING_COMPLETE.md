# Database Schema Hardening Complete

## Objective
Harden database schema usage across the app to prevent runtime crashes caused by missing or renamed columns.

## Summary
All `select('*')` queries in critical frontend components have been replaced with explicit column selection, and null-safe guards have been added to handle missing or renamed columns gracefully.

---

## New Utility File Created

### `src/lib/databaseSchema.ts`
A comprehensive database schema utility providing:

1. **Explicit Column Definitions** for all key tables:
   - `JOBS_COLUMNS` - clientView, landscaperView, adminView, minimal
   - `JOB_PHOTOS_COLUMNS` - select, minimal
   - `JOB_ADDONS_COLUMNS` - select, minimal
   - `LANDSCAPERS_COLUMNS` - profileView, stripeView, adminView, minimal
   - `PROFILES_COLUMNS` - clientView, basicView, minimal
   - `NOTIFICATIONS_COLUMNS` - select, minimal
   - `PAYMENTS_COLUMNS` - select, minimal
   - `PAYOUTS_COLUMNS` - select, minimal
   - `ADMIN_SERVICE_AREAS_COLUMNS` - select, minimal
   - `STRIPE_CONNECT_NOTIFICATIONS_COLUMNS` - select, minimal

2. **Null-Safe Helper Functions**:
   - `safeGet<T>()` - Generic safe getter with fallback
   - `safeString()` - Safe string extraction
   - `safeNumber()` - Safe number extraction
   - `safeBoolean()` - Safe boolean extraction
   - `safeDate()` - Safe date extraction
   - `safeArray<T>()` - Safe array extraction

3. **Query Result Normalizers**:
   - `normalizeJob()` - Handles job column variations
   - `normalizeJobPhoto()` - Handles photo column variations (file_url/photo_url, type/photo_type)
   - `normalizeLandscaper()` - Handles landscaper column variations (approved/is_approved)
   - `normalizeProfile()` - Handles profile column variations
   - `normalizeNotification()` - Handles notification columns
   - `normalizePayment()` - Handles payment columns

4. **Safe Query Wrapper**:
   - `safeQuery()` - Wraps Supabase queries with error handling and normalization

5. **Table Existence Check**:
   - `checkTableAccess()` - Verifies table/column accessibility before querying

---

## Files Updated

### 1. `src/components/client/MyJobsSection.tsx`
**Changes:**
- Replaced `select('*')` with `select(JOBS_COLUMNS.clientView)`
- Added `normalizeJobData()` function to handle missing columns
- All job data is now normalized before use
- Graceful fallback for column variations (service_type/service_name, service_address/property_address)

### 2. `src/hooks/useDashboardData.ts`
**Changes:**
- Replaced `select('*')` with explicit column selection
- Added `normalizeJob()` function for safe data handling
- Both client and landscaper job queries now use explicit columns
- Stats calculation uses normalized data with null-safe access

### 3. `src/lib/landscapers.ts`
**Changes:**
- Replaced `select('*')` with `select(LANDSCAPERS_COLUMNS.profileView)`
- Added `normalizeLandscaper()` from databaseSchema
- New `getLandscaperStripeStatus()` function with explicit Stripe columns
- All functions now return normalized data with proper typing

### 4. `src/components/JobCompletionForm.tsx`
**Changes:**
- Replaced `select('*')` with `select(JOB_PHOTOS_COLUMNS.select)`
- Added `normalizePhoto()` function to handle column variations
- Handles both `file_url` and `photo_url` column names
- Handles both `type` and `photo_type` column names
- Handles both `uploaded_at` and `created_at` column names
- Graceful error handling - doesn't crash if table doesn't exist

### 5. `src/pages/landscaper-dashboard/JobsPanel.tsx`
**Changes:**
- Replaced `select('*')` with `select(JOBS_COLUMNS.landscaperView)`
- Added `normalizeJobData()` function for safe job handling
- Landscaper profile query uses explicit columns
- All job data normalized before display
- Job Actions panel queries already used explicit columns (verified)

---

## Column Mapping Strategy

### Jobs Table
| Frontend Expects | Database Column | Fallback |
|-----------------|-----------------|----------|
| service_type | service_type | service_name |
| service_name | service_name | service_type |
| service_address | service_address | property_address |
| price | price | earnings, total_amount |
| status | status | 'pending' |

### Job Photos Table
| Frontend Expects | Database Column | Fallback |
|-----------------|-----------------|----------|
| file_url | file_url | photo_url |
| type | type | photo_type |
| uploaded_at | uploaded_at | created_at |

### Landscapers Table
| Frontend Expects | Database Column | Fallback |
|-----------------|-----------------|----------|
| approved | approved | is_approved |
| average_rating | average_rating | rating |
| tier | tier | 'bronze' |

---

## Graceful Degradation

All updated components now:
1. **Never crash** on missing columns - use safe defaults
2. **Log warnings** to console for debugging
3. **Show fallback UI** when data is unavailable
4. **Handle table non-existence** gracefully (e.g., job_blocked_reviews)

---

## Backward Compatibility

✅ **Preserved** - All changes are backward compatible:
- Old column names still work via fallback logic
- New column names are preferred when available
- No schema changes required
- No breaking changes to existing data

---

## Verification Checklist

- [x] No `select('*')` in critical job queries
- [x] No `select('*')` in job_photos queries
- [x] No `select('*')` in landscapers queries (critical paths)
- [x] Null-safe guards on all optional columns
- [x] Graceful degradation for missing tables
- [x] Console warnings for debugging
- [x] No runtime crashes from missing columns

---

## Remaining `select('*')` Queries

The following files still use `select('*')` but are lower priority (admin/analytics):
- Admin dashboard components (non-critical)
- Analytics components (non-critical)
- Backup/restore components (admin only)
- Notification system (has fallbacks)

These can be updated in a future iteration if needed.

---

## Date
Completed: December 31, 2025
