# Unified Email Function Fix Instructions

## Current Status

### ✅ Diagnostic Function Deployed
**Function:** `unified-email-diagnostic`  
**Endpoint:** `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email-diagnostic`

**Test it now:**
```bash
curl https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email-diagnostic
```

This will show:
- Environment details (Preview vs Production)
- Resend API key configuration status
- Test email send result
- Current function version and known issues

---

## Issue Confirmed

### Problem 1: No Client Confirmation Email
**Current unified-email function (v28) only sends admin notification.**

The `quote_confirmation` case sends ONE email:
```typescript
to: ['admin.1@greenscapelux.com']  // Only admin
```

**Missing:** Second email to customer at `data.email`

### Problem 2: Preview vs Production Discrepancy
**Possible causes:**
1. Different Resend API keys
2. Domain verification differences
3. Rate limiting
4. Function version mismatch

---

## Fix Implementation

### Step 1: Run Diagnostic
```bash
# Check current environment configuration
curl https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email-diagnostic

# Look for:
# - resendApiKey.configured: true/false
# - testResendConnection.success: true/false
# - environment.deploymentId (to identify Preview vs Production)
```

### Step 2: Update unified-email Function

**Manual Update Required** (due to network issues with automated deployment)

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → unified-email
3. Replace the `quote_confirmation` case with:

```typescript
case 'quote_confirmation': {
  // ADMIN NOTIFICATION EMAIL
  console.log('=== SENDING ADMIN NOTIFICATION EMAIL ===')
  console.log('Environment:', Deno.env.get('DENO_DEPLOYMENT_ID') || 'local')
  
  const adminEmailConfig = {
    from: 'admin.1@greenscapelux.com',
    reply_to: 'support.team@greenscapelux.com',
    to: ['admin.1@greenscapelux.com'],
    subject: `New Quote Request from ${data.name || 'Unknown'}`,
    html: quoteRequestTemplate({
      name: data.name || 'Unknown',
      email: data.email || 'No email provided',
      phone: data.phone || 'No phone provided',
      services: data.selectedServices || data.services || [],
      propertySize: data.propertySize || 'Not specified',
      budget: data.budget || 'Not specified',
      message: data.message || data.comments || 'No message provided'
    })
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
      service: Array.isArray(data.selectedServices) 
        ? data.selectedServices.join(', ') 
        : (data.services || 'our services')
    })
  }

  const clientResult = await sendEmailWithRetry(clientEmailConfig)
  console.log('Client Email Sent:', clientResult.data)
  await logEmail('quote_client', data.email, true)

  return new Response(JSON.stringify({ 
    success: true, 
    adminEmail: adminResult.data,
    clientEmail: clientResult.data,
    apiKeyConfigured: !!RESEND_API_KEY 
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

4. Add the client confirmation template (after line 50):

```typescript
const clientConfirmationTemplate = (data: any) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #059669;">Thank you, ${data.name}!</h2>
    <p>Your quote request for ${data.service || 'our services'} has been received.</p>
    <p>Our team will contact you shortly with next steps.</p>
    <p>For assistance, reply directly to this email or contact support.team@greenscapelux.com.</p>
    <br>
    <p>— The GreenScape Lux Team</p>
  </div>
`
```

5. Add enhanced logging at the start of serve function (after line 120):

```typescript
console.log('=== UNIFIED EMAIL FUNCTION INVOKED ===')
console.log('Environment:', Deno.env.get('DENO_DEPLOYMENT_ID') || 'local')
console.log('Resend API Key configured:', !!RESEND_API_KEY)
console.log('Request type:', type)
console.log('Request data:', JSON.stringify(data, null, 2))
```

### Step 3: Deploy and Test

```bash
# Deploy the updated function
supabase functions deploy unified-email

# Test with a real quote submission
curl -X POST \
  https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quote_confirmation",
    "to": "admin.1@greenscapelux.com",
    "data": {
      "name": "Test User",
      "email": "your-test-email@example.com",
      "phone": "555-1234",
      "selectedServices": ["Lawn Care", "Landscaping"],
      "propertySize": "Medium",
      "budget": "$500",
      "message": "This is a test quote request"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "adminEmail": {
    "id": "abc123-admin-email-id"
  },
  "clientEmail": {
    "id": "def456-client-email-id"
  },
  "apiKeyConfigured": true
}
```

### Step 4: Verify Email Delivery

1. **Check Supabase Logs:**
```bash
supabase functions logs unified-email --tail
```

Look for:
- "=== SENDING ADMIN NOTIFICATION EMAIL ==="
- "Admin Email Sent: { id: '...' }"
- "=== SENDING CLIENT CONFIRMATION EMAIL ==="
- "Client Email Sent: { id: '...' }"

2. **Check Resend Dashboard:**
- Go to https://resend.com/emails
- Verify TWO emails sent:
  - One to admin.1@greenscapelux.com (admin notification)
  - One to customer email (client confirmation)

3. **Check Database Logs:**
```sql
SELECT 
  email_type,
  recipient,
  success,
  error_message,
  sent_at
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '10 minutes'
ORDER BY sent_at DESC;
```

Should show:
- `quote_admin` → admin.1@greenscapelux.com → success: true
- `quote_client` → customer@email.com → success: true

---

## Troubleshooting

### If Admin Email Still Doesn't Send in Production:

1. **Check Resend API Key:**
```bash
# Run diagnostic in production
curl https://greenscapelux.com/api/unified-email-diagnostic
```

2. **Verify Domain:**
- Ensure admin.1@greenscapelux.com is verified in Resend
- Check DNS records for greenscapelux.com

3. **Check Rate Limits:**
- Resend free tier: 100 emails/day
- Resend paid tier: Higher limits
- Check Resend dashboard for quota usage

### If Client Email Doesn't Send:

1. **Check Customer Email Format:**
```typescript
// Add validation
if (!data.email || !data.email.includes('@')) {
  throw new Error('Invalid customer email address')
}
```

2. **Check Resend Logs:**
- Look for bounce messages
- Verify recipient email is valid
- Check spam folder

### If Both Emails Fail:

1. **Verify Resend API Key:**
```bash
# Test directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin.1@greenscapelux.com",
    "to": ["admin.1@greenscapelux.com"],
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

2. **Check Supabase Environment Variables:**
```bash
supabase secrets list
```

Ensure RESEND_API_KEY is set correctly.

---

## Success Criteria

✅ **Admin Email:**
- Sends to admin.1@greenscapelux.com
- Contains full quote details
- Appears in Resend dashboard
- Logged in email_logs table

✅ **Client Email:**
- Sends to customer's email address
- Contains thank you message
- Appears in Resend dashboard
- Logged in email_logs table

✅ **Both Environments:**
- Preview and Production behave identically
- Response includes both email IDs
- No errors in Supabase logs

---

## Next Steps

1. Run diagnostic function to identify environment differences
2. Manually update unified-email function with dual email logic
3. Test in Preview environment first
4. Deploy to Production
5. Monitor Resend dashboard and Supabase logs
6. Verify customer receives confirmation email

**Need Help?** Check the diagnostic output first:
```bash
curl https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email-diagnostic
```
