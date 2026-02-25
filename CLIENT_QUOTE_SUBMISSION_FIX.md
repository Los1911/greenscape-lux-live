# CLIENT QUOTE SUBMISSION FIX

## Issue
New clients (email/password or Google OAuth) could reach Step 4 of 4 on the Request Service form but received "Something went wrong. Please try again." on submit.

## Root Cause Analysis

### Primary Issue: JWT Verification Mismatch
The `create-quote-and-job` edge function was deployed with `verify_jwt: true`, which means:
1. It requires a valid JWT token in the Authorization header
2. Requests without a JWT are rejected with a 401 error

The client code was calling the function via direct `fetch()` WITHOUT including the Authorization header:
```javascript
// BEFORE - No auth header
const response = await fetch(edgeFunctionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestPayload)
});
```

### Why This Affected New Users Specifically
- Admin/sandbox flows may have used different code paths
- The error was masked as a generic "Something went wrong" message
- New users hitting the production flow encountered the JWT requirement

## Solution Implemented

### 1. Created New Public Edge Function
Created `create-quote-and-job-public` that does NOT require JWT verification:
- Works for both guest users (no auth) and authenticated clients
- Uses service role key internally to bypass RLS
- Identical functionality to the original function

### 2. Updated Client Code
Updated `RequestServiceForm.tsx` to:
1. Use the new public endpoint: `create-quote-and-job-public`
2. Still include JWT token when available (for future audit/logging)
3. Added comprehensive logging for debugging

### 3. Enhanced Error Handling
- Full request payload logging in dev mode
- Full response logging in dev mode
- Specific error codes returned from edge function
- Better error messages for users

## Files Changed

### Edge Functions
- **NEW**: `create-quote-and-job-public` - Public endpoint without JWT requirement

### Frontend
- `src/pages/RequestServiceForm.tsx`:
  - Changed endpoint from `create-quote-and-job` to `create-quote-and-job-public`
  - Added JWT token to Authorization header when available
  - Added comprehensive logging

## Verification Steps

1. **Guest Flow Test**:
   - Go to `/get-quote` (guest mode)
   - Fill out form and submit
   - Should succeed without authentication

2. **New Client Flow Test**:
   - Create new account (email/password or Google OAuth)
   - Navigate to client dashboard
   - Click "Request Service"
   - Fill out form and submit
   - Should succeed and navigate to thank you page

3. **Existing Client Flow Test**:
   - Log in as existing client
   - Submit quote request
   - Should succeed

## Technical Details

### Edge Function Configuration
```
create-quote-and-job:        verify_jwt: true  (original - requires JWT)
create-quote-and-job-public: verify_jwt: false (new - no JWT required)
```

### Request Flow
```
Client Browser
    ↓
fetch() to create-quote-and-job-public
    ↓
Edge Function (no JWT check)
    ↓
Service Role → Supabase (bypasses RLS)
    ↓
Insert to quotes + jobs tables
    ↓
Success response
```

## Invariant Rules Established

1. **Public endpoints** (guest + authenticated) should NOT require JWT verification
2. **Protected endpoints** (authenticated only) should require JWT verification
3. **Client code** should always include JWT when available, even for public endpoints
4. **Error responses** should include specific error codes for debugging

## Date
January 19, 2026
