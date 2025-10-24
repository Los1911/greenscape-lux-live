# Quote Email Resend Integration Audit

## Issue: Resend Not Receiving Quote Emails

### Current Flow Analysis

#### 1. Frontend (ClientQuoteForm.tsx)
```typescript
// Line 145: Calls sendQuoteEmail edge function
fetch(`${supabaseUrl}/functions/v1/sendQuoteEmail`, {
  body: JSON.stringify({
    name, email, phone,
    address: formData.propertyAddress,  // ⚠️ Sends 'address'
    services, propertySize, comments
  })
})
```

#### 2. Edge Function (send-quote-email/index.ts)
```typescript
// Line 11: Expects different fields
const { name, email, phone, services, propertySize, comments } = await req.json()
// ❌ 'address' field is NOT extracted
// ❌ 'propertyAddress' is NOT in the payload
```

#### 3. Resend API Call
```typescript
// Lines 29-41: Direct Resend API call
fetch('https://api.resend.com/emails', {
  headers: {
    'Authorization': `Bearer ${serverConfig.resendApiKey}`
  },
  body: JSON.stringify({
    from: 'noreply@greenscapelux.com',
    to: ['admin.1@greenscapelux.com'],
    subject: `New Quote Request from ${name}`,
    html: emailHtml
  })
})
```

## Root Causes

### 1. ❌ Missing Field in Edge Function
- Frontend sends `address` field
- Edge function doesn't extract or use it
- Email template doesn't include property address

### 2. ⚠️ Poor Error Handling
```typescript
// Line 52: Returns 200 even on error!
return new Response(JSON.stringify({ error: error.message }), {
  status: 200  // ❌ Should be 500
})
```

### 3. ⚠️ No RESEND_API_KEY Validation
- No check if key is placeholder value
- No logging of Resend API response details
- Silent failures

### 4. 🔄 Duplicate Email System
- `send-quote-email` function (simple, no retry)
- `unified-email` function (robust, with retry + templates)
- Should consolidate to one system

## Solutions

### Option A: Fix send-quote-email (Quick Fix)
1. Add `address` field extraction
2. Include address in email template
3. Add proper error status codes
4. Add detailed logging
5. Validate RESEND_API_KEY

### Option B: Switch to unified-email (Recommended)
1. Use existing `unified-email` function
2. Has built-in retry logic
3. Uses quoteRequestTemplate
4. Better error handling
5. Already supports quote_confirmation type

## Recommended Fix: Switch to unified-email

### Update ClientQuoteForm.tsx
```typescript
fetch(`${supabaseUrl}/functions/v1/unified-email`, {
  body: JSON.stringify({
    template_type: 'quote_confirmation',
    to: 'admin.1@greenscapelux.com',
    template_data: {
      name, email, phone,
      services: allServices,
      propertySize: formData.propertySize,
      budget: formData.budget,
      message: formData.comments
    }
  })
})
```

### Benefits
- ✅ Uses proven email template
- ✅ Has retry logic (3 attempts)
- ✅ Proper error handling (500 status)
- ✅ Validates required secrets
- ✅ Detailed error messages
- ✅ Already includes property info

## Immediate Action Items

1. **Switch to unified-email** in ClientQuoteForm.tsx
2. **Add property address** to quoteRequestTemplate
3. **Verify RESEND_API_KEY** is set in Supabase secrets
4. **Test email delivery** end-to-end
5. **Remove or deprecate** send-quote-email function
