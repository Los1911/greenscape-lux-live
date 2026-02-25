# Client Quote Submission Alignment Audit Report

**Date:** 2026-01-19
**Status:** FIXES APPLIED

## Executive Summary

The client quote submission was failing because the frontend was not sending the required `apikey` header when making direct fetch requests to Supabase edge functions.

## Root Cause Analysis

### The Problem
Supabase edge functions require the `apikey` header for all requests, even when using `verify_jwt: false`. The frontend was only sending:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for authenticated users)

But was MISSING:
- `apikey: <anon_key>` ← **THIS WAS THE ISSUE**

### Why Direct Invocation Worked
When we invoked the function directly using the Famous.ai tooling, the system automatically includes the required headers. But browser-based fetch requests don't have this automatic header injection.

## Audit Findings

### 1. Frontend → Edge Function Contract ✅ FIXED

**Before:**
```javascript
let authHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};
```

**After:**
```javascript
let authHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'apikey': anonKey  // REQUIRED: Supabase edge functions need the apikey header
};
```

### 2. Edge Function Expectations ✅ VERIFIED

The `create-quote-and-job-public` edge function:
- Uses `SUPABASE_SERVICE_ROLE_KEY` internally (bypasses RLS)
- Does NOT require auth.uid() for operation
- Returns explicit error codes for all failure cases
- Handles both guest and authenticated users

### 3. Database Constraints ✅ VERIFIED

**quotes table:**
- `customer_name` - NOT NULL ✓
- `customer_email` - NOT NULL ✓
- `service_type` - NOT NULL ✓
- `quote_id` - NOT NULL ✓

All required fields are properly populated by the edge function.

**jobs table:**
- `customer_name` - NOT NULL ✓
- All other fields have defaults or are nullable

### 4. RLS Policies ✅ VERIFIED

The edge function uses `SUPABASE_SERVICE_ROLE_KEY` which:
- Bypasses all RLS policies
- Has full access to both `quotes` and `jobs` tables
- Multiple service_role policies exist as backup

### 5. Environment Consistency ✅ VERIFIED

The frontend now uses:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '<fallback_key>';
```

Both values are correctly configured with fallbacks.

## Changes Made

### File: `src/pages/RequestServiceForm.tsx`

1. **Added `apikey` header to all edge function requests**
   - Line 468: Added `'apikey': anonKey` to authHeaders

2. **Enhanced logging for debugging**
   - Added dev-mode logging of headers (with apikey redacted)
   - Added edge function URL logging

3. **Consolidated environment variable usage**
   - Single definition of `supabaseUrl` and `anonKey` at the start of submission
   - Reused for both quote creation and email sending

### File: `create-quote-and-job-public` (Edge Function)

1. **Enhanced logging**
   - Added request headers logging
   - Added detailed quote/job data logging
   - Added error details in JSON format

## Testing Verification

Direct invocation test result:
```json
{
  "success": true,
  "quoteId": "QR-1768783056707-03NWO4T38",
  "quoteDbId": 29,
  "jobId": "03014d9a-52da-41d5-9ff6-a271d85fa4c6",
  "jobCreated": true,
  "message": "Estimate request submitted successfully"
}
```

## Next Steps for Production Verification

1. **Clear browser cache** - Ctrl+Shift+R or clear site data
2. **Create a new test client account**
3. **Submit a quote request**
4. **Verify success** - Should navigate to /thank-you page
5. **Check database** - Verify quote and job records were created

## Technical Notes

### Why `apikey` is Required

Supabase's edge function gateway validates requests in this order:
1. Check for `apikey` header → Required for all requests
2. Check for `Authorization` header → Required only if `verify_jwt: true`
3. Pass request to function code

Without the `apikey` header, the request is rejected at step 1 before reaching the function code.

### Header Requirements Summary

| Header | Required | Purpose |
|--------|----------|---------|
| `apikey` | ALWAYS | Identifies the Supabase project |
| `Authorization` | Only if verify_jwt: true | Authenticates the user |
| `Content-Type` | For POST/PUT | Specifies request body format |

## Conclusion

The fix ensures that all edge function requests from the frontend include the required `apikey` header. This aligns the frontend behavior with Supabase's gateway requirements and should resolve the client quote submission failures.
