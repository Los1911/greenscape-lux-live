# Quote Submission Production Debug Guide

## Issue
Production form stuck on "Submitting Quote Request..." while preview works correctly.

## Root Cause Analysis

### Why Preview Works vs Production Fails

1. **Environment Differences**
   - Preview: Uses development Supabase instance with faster response times
   - Production: Uses production Supabase with potential network latency

2. **Timeout Issues**
   - Database operations may take longer in production
   - Network latency between Vercel and Supabase
   - Edge Function cold starts

3. **Error Handling Gaps**
   - Loading state wasn't guaranteed to reset
   - No failsafe timeout at form level
   - Silent failures in promise chains

## Fixes Implemented

### 1. Failsafe Timeout (Line 93-98)
```typescript
const failsafeTimeout = setTimeout(() => {
  console.error('🚨 FAILSAFE: Resetting loading state after 15s');
  setLoading(false);
  setError('Request timed out. Please try again or contact support.');
}, 15000);
```

**Why This Fixes It:**
- Guarantees loading state resets after 15 seconds
- Prevents infinite loading state
- Shows user-friendly error message

### 2. Reduced Database Timeout (Line 128)
```typescript
setTimeout(() => reject(new Error('Database timeout after 8s')), 8000)
```

**Changed from 10s to 8s:**
- Fails faster if database is slow
- Leaves 7 seconds for failsafe
- Better user experience

### 3. Enhanced Error Handling
```typescript
if (!dbData) {
  console.error('❌ No data returned from database');
  throw new Error('Failed to save quote: No data returned');
}
```

**Catches edge cases:**
- Database returns success but no data
- Ensures error is thrown and caught properly

### 4. Better Logging
```typescript
console.log('🔍 Environment:', {
  mode: import.meta.env.MODE,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});
```

**Production debugging:**
- Shows which environment variables are loaded
- Tracks timing of database operations
- Logs email sending attempts

## Testing Checklist

### In Production
1. ✅ Open browser console
2. ✅ Submit quote form
3. ✅ Watch for these logs:
   - `🚀 Quote submission started`
   - `🔍 Environment:` (verify variables loaded)
   - `📝 Inserting quote to database...`
   - `⏱️ Database operation took Xms`
   - `✅ Quote saved: [ID]`
   - `📧 Sending email via unified-email...`
   - `✅ Success! Navigating to thank you page...`

### Expected Behavior
- Form submits in 1-3 seconds
- Redirects to /thank-you page
- Email sends in background (5-10 seconds)
- Console shows all success logs

### If Still Stuck
1. Check console for error logs
2. Verify environment variables in Vercel
3. Check Supabase logs for database errors
4. Verify Edge Function is deployed

## Environment Variables Required

```bash
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

## Deployment Command

```bash
# Deploy updated Edge Function
supabase functions deploy unified-email --project-ref mwvcbedvnimabfwubazz --no-verify-jwt

# Verify deployment
curl https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"type":"quote_confirmation","data":{"name":"Test","email":"test@test.com"}}'
```

## Next Steps

1. Test in production with console open
2. If still stuck, check Vercel deployment logs
3. Verify Supabase RLS policies allow inserts
4. Check Supabase Edge Function logs

## Success Criteria

✅ Form submits successfully in 1-3 seconds
✅ User redirected to /thank-you page
✅ Quote saved in database
✅ Admin email sent to admin.1@greenscapelux.com
✅ Client email sent to customer's email
✅ No infinite loading states
