# Unified Email Function Diagnostic Report

## Issue Summary
**Date:** October 11, 2025  
**Environment:** Supabase Project `mwvcbedvnimabfwubazz`  
**Function:** unified-email (v28)

### Reported Issues:
1. ✅ **Preview Environment:** Admin email sends successfully to admin.1@greenscapelux.com
2. ❌ **Production Environment:** Admin email does NOT send
3. ❌ **Both Environments:** Client confirmation email never sends

---

## Root Cause Analysis

### 1. Missing Client Confirmation Email
**Status:** CONFIRMED BUG  
**Severity:** HIGH

The current unified-email function (v28) **does NOT implement client confirmation emails** for quote_confirmation type.

**Current Code (Lines 134-151):**
```typescript
case 'quote_confirmation': {
  emailConfig = {
    from: 'admin.1@greenscapelux.com',
    reply_to: 'support.team@greenscapelux.com',
    to: ['admin.1@greenscapelux.com'],  // Only admin email
    subject: `New Quote Request from ${data.name || 'Unknown'}`,
    html: quoteRequestTemplate(data)
  }
  break
}
```

**Problem:** Only ONE email is sent (admin notification). No second email for customer confirmation.

---

### 2. Preview vs Production Discrepancy

**Possible Causes:**

#### A. Different Function Versions
- Preview may be running a cached or different version
- Production may have deployment issues

#### B. Resend API Configuration
- API key differences between environments
- Domain verification status
- Rate limiting on production domain

#### C. Environment Variables
- RESEND_API_KEY may differ
- Hardcoded fallback: `'re_dTWTSNo5_L2o9dFGw2mwyy8VFvvXxTC6A'`

#### D. Logging Issues
- Production logs may not be visible
- Errors may be silently failing

---

## Required Fixes

### Fix 1: Add Client Confirmation Email

**Implementation:**
```typescript
case 'quote_confirmation': {
  // ADMIN NOTIFICATION EMAIL
  console.log('=== SENDING ADMIN NOTIFICATION EMAIL ===')
  const adminEmailConfig = {
    from: 'admin.1@greenscapelux.com',
    reply_to: 'support.team@greenscapelux.com',
    to: ['admin.1@greenscapelux.com'],
    subject: `New Quote Request from ${data.name || 'Unknown'}`,
    html: quoteRequestTemplate(data)
  }

  const adminResult = await sendEmailWithRetry(adminEmailConfig)
  console.log('Admin Email Sent:', adminResult.data)
  await logEmail('quote_admin', 'admin.1@greenscapelux.com', true)

  // CLIENT CONFIRMATION EMAIL
  console.log('=== SENDING CLIENT CONFIRMATION EMAIL ===')
  const clientEmailConfig = {
    from: 'admin.1@greenscapelux.com',
    to: data.email,
    subject: 'Your GreenScape Lux Quote Request Confirmation',
    reply_to: 'support.team@greenscapelux.com',
    html: clientConfirmationTemplate({
      name: data.name || 'Valued Customer',
      service: data.selectedServices?.join(', ') || data.services || 'our services'
    })
  }

  const clientResult = await sendEmailWithRetry(clientEmailConfig)
  console.log('Client Email Sent:', clientResult.data)
  await logEmail('quote_client', data.email, true)

  return new Response(JSON.stringify({ 
    success: true, 
    adminEmail: adminResult.data,
    clientEmail: clientResult.data
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

### Fix 2: Enhanced Diagnostic Logging

Add environment detection:
```typescript
console.log('=== UNIFIED EMAIL FUNCTION INVOKED ===')
console.log('Environment:', Deno.env.get('DENO_DEPLOYMENT_ID') || 'local')
console.log('Resend API Key configured:', !!RESEND_API_KEY)
console.log('Request type:', type)
console.log('Request data:', JSON.stringify(data, null, 2))
```

---

## Verification Steps

### Step 1: Check Supabase Edge Function Logs
```bash
# View real-time logs
supabase functions logs unified-email --tail

# Check for errors
supabase functions logs unified-email --limit 50
```

### Step 2: Check email_logs Table
```sql
SELECT 
  email_type,
  recipient,
  success,
  error_message,
  sent_at
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;
```

### Step 3: Verify Resend Dashboard
- Check "Logs" section for delivery status
- Verify both admin.1@greenscapelux.com emails
- Look for bounce/rejection messages

### Step 4: Test Both Environments
```bash
# Test Preview
curl -X POST \
  https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quote_confirmation",
    "to": "admin.1@greenscapelux.com",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "555-1234",
      "services": ["Lawn Care"],
      "propertySize": "Medium",
      "budget": "$500",
      "message": "Test quote request"
    }
  }'

# Check response for both adminEmail and clientEmail IDs
```

---

## Expected Behavior After Fix

### Quote Confirmation Flow:
1. User submits quote form
2. **Email 1 (Admin):** Sent to admin.1@greenscapelux.com
   - Subject: "New Quote Request from [Name]"
   - Contains: Full quote details
3. **Email 2 (Client):** Sent to customer's email
   - Subject: "Your GreenScape Lux Quote Request Confirmation"
   - Contains: Thank you message and next steps

### Response Structure:
```json
{
  "success": true,
  "adminEmail": {
    "id": "abc123..."
  },
  "clientEmail": {
    "id": "def456..."
  },
  "apiKeyConfigured": true
}
```

---

## Deployment Checklist

- [ ] Update unified-email function with dual email logic
- [ ] Add clientConfirmationTemplate
- [ ] Add enhanced logging
- [ ] Deploy to Supabase
- [ ] Test in Preview environment
- [ ] Test in Production environment
- [ ] Verify both emails in Resend dashboard
- [ ] Check email_logs table for success entries
- [ ] Confirm customer receives confirmation email

---

## Monitoring

### Key Metrics to Track:
- Admin email delivery rate
- Client email delivery rate
- Email send latency
- Error rates by environment
- Resend API response times

### Alert Conditions:
- Email delivery failure rate > 5%
- No emails sent in 1 hour during business hours
- Resend API errors
- Missing client confirmation emails

---

## Next Steps

1. **Immediate:** Deploy updated function with client confirmation
2. **Short-term:** Add comprehensive error handling
3. **Long-term:** Implement email queue system for reliability
