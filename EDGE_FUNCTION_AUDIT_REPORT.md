# Edge Function Response Audit Report

## Executive Summary
Audited 6 critical edge functions to identify potential null response issues causing "FetchEvent.respondWith received an error: Returned response is null".

## Functions Audited

### ✅ COMPLIANT FUNCTIONS
These functions properly handle all code paths and return valid Response objects:

#### 1. unified-email ✅
- **Status**: COMPLIANT
- **CORS**: Proper OPTIONS handling
- **Error Handling**: Comprehensive try-catch with proper Response objects
- **All Paths Return**: Valid Response objects with proper headers

#### 2. sendQuoteEmail ✅
- **Status**: COMPLIANT  
- **CORS**: Proper OPTIONS handling
- **Error Handling**: All errors return Response objects with status 200 (intentional)
- **All Paths Return**: Valid Response objects

#### 3. create-payment-intent ✅
- **Status**: COMPLIANT
- **CORS**: Proper OPTIONS handling
- **Error Handling**: All errors return proper Response objects
- **All Paths Return**: Valid Response objects with appropriate status codes

#### 4. submit-contact-form ✅
- **Status**: COMPLIANT
- **CORS**: Proper OPTIONS handling
- **Error Handling**: Comprehensive error handling with Response objects
- **All Paths Return**: Valid Response objects

### ⚠️ POTENTIAL ISSUES IDENTIFIED

#### 5. stripe-webhook ⚠️
- **Status**: NEEDS IMPROVEMENT
- **Issue**: Some code paths may not return Response objects
- **Risk**: Medium - webhook handlers might not return responses
- **Fix Required**: Add explicit returns in all handler functions

## Critical Findings

### Root Cause Analysis
The "null response" error is likely NOT coming from the main email functions (unified-email, sendQuoteEmail) as they are properly implemented.

### Most Likely Sources:
1. **stripe-webhook**: Handler functions don't explicitly return responses
2. **Older/Legacy Functions**: Functions not audited yet may have null return paths
3. **Runtime Errors**: Unhandled exceptions causing null returns

## Immediate Action Required

### 1. Fix stripe-webhook Function
The stripe-webhook function has handler functions that don't return values, which could cause the main function to return undefined/null.

### 2. Audit Remaining Functions
Need to audit the remaining ~50 edge functions for similar issues.

### 3. Add Global Error Monitoring
Implement consistent error handling patterns across all functions.

## Recommended Fix Pattern

```typescript
Deno.serve(async (req) => {
  // Always handle OPTIONS first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Main logic here
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

## Next Steps
1. Fix stripe-webhook function immediately
2. Implement systematic audit of all remaining functions
3. Add error monitoring to track null response sources
4. Establish function development standards