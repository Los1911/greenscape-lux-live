# Landscaper Dashboard Audit Report

## Environment Status
- **VITE_SUPABASE_URL**: Environment variable check added to `src/main.tsx` line 9
- **VITE_SUPABASE_PUBLISHABLE_KEY**: Environment variable check added to `src/main.tsx` line 9
- **Status**: Will log `[AUDIT] Missing Supabase envs` if either is missing

## Database Views Status
- **v_landscaper_documents**: ✅ Created successfully
  - Maps `user_id` to `landscaper_id` 
  - Uses `coalesce(mime_type, document_type)` as `file_type`
  - Uses `coalesce(created_at, uploaded_at)` as `uploaded_at`
- **v_landscapers**: ✅ Created successfully
  - Maps `insurance_verified` to `insurance_status`
  - Sets `insurance_expiry` as `null` (column doesn't exist in base table)

## Schema Analysis
### landscaper_documents table columns:
- `id` (uuid), `user_id` (uuid), `document_type` (varchar)
- `file_name` (text), `file_url` (text), `file_size` (integer)
- `mime_type` (varchar), `uploaded_at` (timestamptz)
- `created_at` (timestamptz), `updated_at` (timestamptz)

### landscapers table columns:
- Missing `landscaper_id` column (uses `user_id` instead)
- Missing `insurance_expiry` column
- Has `insurance_verified` (boolean) for status

## Audit Instrumentation Added

### UpcomingJobs.tsx (lines 26-52)
- **Start Job Handler**: Logs jobId, supabase response, error details
- **RLS Check**: Detects PGRST301 errors and count=0 responses
- **File Reference**: `src/components/landscaper/UpcomingJobs.tsx:26-52`

### PhotoUploadModal.tsx (lines 55-108)
- **Upload Process**: Logs file details, storage responses, insert operations
- **Job Completion**: Logs Jobs.complete calls and responses
- **Error Stack Traces**: Full error logging with stack traces
- **File Reference**: `src/components/landscaper/PhotoUploadModal.tsx:55-108`

### DocumentUpload.tsx (lines 38-56)
- **Document Fetching**: Logs Docs.list calls and responses
- **Column Drift Detection**: Specifically checks for 42703 errors
- **File Reference**: `src/components/landscaper/DocumentUpload.tsx:38-56`

## Database Query Helpers (src/db/contracts.ts)

### Jobs Helper
- **forLandscaper()**: Uses `.or()` clause with landscaper_id and assigned_email
- **start()**: Updates status to 'in_progress' with started_at timestamp
- **complete()**: Updates status to 'completed' with completed_at timestamp

### Docs Helper  
- **list()**: Queries v_landscaper_documents view instead of base table
- **Columns**: Selects id, file_url, file_type, uploaded_at

## Potential Issues Identified

### 1. Column Name Mismatch
- **Issue**: Code expects `landscaper_id` but table uses `user_id`
- **Fix Applied**: View maps `user_id` as `landscaper_id`
- **Location**: All database queries

### 2. Missing Environment Variables
- **Detection**: Added checkSupabaseEnvs() at app startup
- **Location**: `src/main.tsx:9`

### 3. RLS Policy Conflicts
- **Detection**: Checks for PGRST301 errors and count=0 responses
- **Locations**: Start/Complete job operations

### 4. View Dependencies
- **Detection**: Probes views at startup in `src/main.tsx:13-27`
- **Views**: v_landscaper_documents, v_landscapers

## Expected Console Logs
When using the dashboard, look for these audit logs:
- `[AUDIT] Start job attempt - jobId: <id>`
- `[AUDIT] Jobs.start response - error: <error>`
- `[AUDIT] Photo upload attempt - jobId: <id>`
- `[AUDIT] Storage upload response - error: <error>`
- `[AUDIT] Fetching documents for user: <id>`
- `[AUDIT] Missing view: <name>` (if views don't exist)
- `[AUDIT] Missing Supabase envs` (if env vars missing)
- `[AUDIT] RLS blocked - jobId: <id>` (if permissions fail)

## Post-Audit Fixes Applied

### 1. Error Handling Improvements
- **Start Job**: Enhanced RLS detection with specific error messages
- **Complete Job**: Improved error handling with RLS permission checks
- **Document Upload**: Better error messaging for schema issues

### 2. Image Compression Added
- **Client-side compression**: Images compressed to max 1920px with 80% quality
- **File processing**: Automatic compression before upload to reduce storage costs
- **PDF handling**: PDFs skip compression process

### 3. Audit Log Cleanup
- **Removed verbose logs**: Cleaned up [AUDIT] prefixes from production code
- **Kept essential logging**: Maintained error logs for debugging
- **Environment checks**: Simplified environment variable warnings

### 4. Query Stabilization
- **Database helpers**: All queries use stable helpers from src/db/contracts.ts
- **View usage**: Document queries use v_landscaper_documents view
- **RLS handling**: Proper detection of permission errors (PGRST301, count=0)

## Next Steps