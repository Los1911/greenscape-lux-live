# Edge Function Deployment Debug Guide

## Issue Analysis
The `password-reset-with-unified-email` edge function is not firing, showing "Failed to send request to Edge Function" error.

## Root Cause Investigation

### 1. Function Deployment Status
- Function is deployed with ID: `6afee7eb-96c6-439e-afeb-37aa5c11d1a0`
- Function name: `password-reset-with-unified-email`
- Endpoint: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/6afee7eb-96c6-439e-afeb-37aa5c11d1a0`

### 2. Common Issues & Fixes Applied

#### CORS Headers
✅ **Fixed**: Added proper CORS headers including `Access-Control-Allow-Methods`
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```

#### Method Validation
✅ **Fixed**: Added explicit method validation
```typescript
if (req.method !== 'POST') {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

#### Enhanced Logging
✅ **Fixed**: Added comprehensive console logging for debugging
```typescript
console.log('Password reset function called');
console.log('Request body:', body);
console.log('Generating reset token for:', email);
```

### 3. Frontend Debugging

#### Function Invocation
The frontend calls the function by name:
```typescript
const response = await supabase.functions.invoke('password-reset-with-unified-email', {
  body: { email, redirectTo }
});
```

#### Debug Utility Created
Created `edgeFunctionDiagnostic.ts` to test connectivity:
```typescript
import { testEdgeFunctionConnectivity } from '@/utils/edgeFunctionDiagnostic';

// Test in browser console:
testEdgeFunctionConnectivity().then(console.log);
```

### 4. Testing Steps

#### Step 1: Test Debug Function
```javascript
// In browser console:
import { supabase } from '@/lib/supabase';
const response = await supabase.functions.invoke('debug-function-deployment', {
  body: { testMessage: 'test' }
});
console.log(response);
```

#### Step 2: Test Password Reset Function
```javascript
// In browser console:
const response = await supabase.functions.invoke('password-reset-with-unified-email', {
  body: { 
    email: 'test@example.com',
    redirectTo: 'https://greenscapelux.com/reset-password'
  }
});
console.log(response);
```

### 5. Environment Variables Check
Ensure these are set in Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

### 6. Network Debugging

#### Check Function Endpoints
```javascript
// Get function URLs:
import { getFunctionEndpoints } from '@/utils/edgeFunctionDiagnostic';
console.log(getFunctionEndpoints());
```

#### Direct HTTP Test
```bash
curl -X POST \
  https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/password-reset-with-unified-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

## Expected Resolution
With the fixes applied:
1. CORS issues should be resolved
2. Function should accept POST requests properly
3. Enhanced logging will show exactly where failures occur
4. Debug utilities will help identify connectivity issues

## Next Steps
1. Test the debug function first to verify basic connectivity
2. Check browser network tab for actual HTTP errors
3. Review Supabase function logs for server-side errors
4. Verify environment variables are properly set