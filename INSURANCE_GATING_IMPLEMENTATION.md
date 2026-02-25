# Insurance Gating for Tree & Property Care Services

## Implementation Complete

This document describes the insurance gating system that restricts high-risk services to landscapers with verified insurance.

## Gated Services

The following services require verified insurance:

- Tree Removal
- Tree Trimming & Pruning
- Stump Grinding
- Land Clearing
- Property Flip Cleanups (Real Estate Ready)
- HOA or Multi-Property Contracts

These services are categorized as **"Tree & Property Care"**.

## Architecture

### 1. Configuration (`src/lib/insuranceRequirements.ts`)

Central configuration file containing:
- `INSURANCE_REQUIRED_SERVICES` - List of services requiring insurance
- `serviceRequiresInsurance(serviceName)` - Check if a service requires insurance
- `jobRequiresInsurance(job)` - Check if a job requires insurance (checks service_type, service_name, selected_services)
- `landscaperHasVerifiedInsurance(landscaper)` - Check if landscaper has verified insurance
- `canLandscaperAcceptJob(job, landscaper)` - Determine if a landscaper can accept a specific job
- `filterJobsForLandscaper(jobs, landscaper)` - Filter jobs based on insurance status

### 2. Backend Enforcement (`validate-job-acceptance` Edge Function)

Server-side validation that runs before any job acceptance:

1. Receives `jobId` and `landscaperId`
2. Fetches job details and checks if it requires insurance
3. If insurance required, fetches landscaper's insurance status
4. Returns success/failure with appropriate error message
5. Logs blocked attempts for audit purposes

**Endpoint:** `POST /functions/v1/validate-job-acceptance`

**Request:**
```json
{
  "jobId": "uuid",
  "landscaperId": "uuid"
}
```

**Response (Success):**
```json
{
  "success": true,
  "requiresInsurance": false,
  "message": "Job acceptance validated"
}
```

**Response (Blocked):**
```json
{
  "success": false,
  "requiresInsurance": true,
  "hasInsurance": false,
  "error": "Insurance verification required to accept this job",
  "blockedServices": ["Tree Removal"]
}
```

### 3. UI Components (`src/components/landscaper/InsuranceRequiredBadge.tsx`)

- `InsuranceRequiredBadge` - Badge/icon indicating insurance requirement
- `InsuranceRequiredBanner` - Banner prompting insurance upload
- `LockedJobOverlay` - Overlay for locked job cards
- `InsuranceStatusIndicator` - Shows landscaper's insurance status

### 4. Frontend Integration

Updated components:
- `src/components/v2/layout/AvailableJobs.tsx`
- `src/pages/landscaper-dashboard/JobsPanel.tsx`

Features:
- Jobs are separated into accessible and locked categories
- Locked jobs show with amber border and overlay
- Insurance banner appears when locked jobs exist
- Accept button is disabled with tooltip for locked jobs
- Backend validation is called before job acceptance

## Flow

### For Uninsured Landscapers

1. Available jobs are loaded
2. Jobs are filtered into accessible and locked categories
3. Accessible jobs appear normally
4. Locked jobs appear with:
   - Amber border
   - "Insurance Required" badge
   - Locked overlay
   - Disabled accept button with tooltip
5. Insurance banner prompts document upload
6. If user somehow triggers accept (e.g., API call):
   - Frontend check blocks immediately
   - Backend validation blocks as failsafe
   - Error toast displayed

### For Insured Landscapers

1. All jobs appear normally
2. No insurance badges or overlays
3. Accept works as usual
4. Backend validation confirms insurance status

## Database Schema

The `landscapers` table includes:
- `insurance_verified` (boolean) - Primary insurance status flag
- `insurance_file_url` (text, optional) - Fallback check for uploaded documents

## Safety Guarantees

1. **Frontend-only checks are NOT relied upon** - Backend always validates
2. **Uninsured landscapers cannot see or accept high-risk jobs** - UI filters + backend blocks
3. **No breaking changes** - Existing job lifecycle unchanged
4. **Audit trail** - Blocked attempts are logged

## Admin & Client Behavior

- Admin dashboard: Unchanged, can see all jobs
- Client quote flow: Unchanged, can request any service
- Platform assignment: Only assigns insured landscapers to high-risk jobs

## Testing

### Test Uninsured Landscaper
1. Create/use landscaper with `insurance_verified = false`
2. Create job with service_type = "Tree Removal"
3. Verify job appears locked in Available Jobs
4. Verify accept button is disabled
5. Verify API call returns 403 error

### Test Insured Landscaper
1. Create/use landscaper with `insurance_verified = true`
2. Create job with service_type = "Tree Removal"
3. Verify job appears normally
4. Verify accept works successfully

## Files Modified/Created

### New Files
- `src/lib/insuranceRequirements.ts` - Configuration and utilities
- `src/components/landscaper/InsuranceRequiredBadge.tsx` - UI components
- `validate-job-acceptance` - Edge function for backend validation

### Modified Files
- `src/components/v2/layout/AvailableJobs.tsx` - Added insurance gating
- `src/pages/landscaper-dashboard/JobsPanel.tsx` - Added insurance gating
