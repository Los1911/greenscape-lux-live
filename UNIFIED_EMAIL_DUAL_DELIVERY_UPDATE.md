# Unified Email Function - Dual Delivery Fix

## Issue
- Admin emails work in Preview but not Production
- Client confirmation emails never send in either environment

## Solution Implemented

### Updated unified-email Edge Function (v29)

**Key Changes:**

1. **Dual Email Delivery for Quote Confirmations**
   - Admin notification sent to `admin.1@greenscapelux.com`
   - Client confirmation sent to `data.email` (customer)
   - Both emails logged separately in `email_logs` table

2. **Enhanced Logging**
   - Environment detection (Preview vs Production)
   - Detailed request logging
   - Separate log entries for admin and client emails
   - Email ID tracking from Resend API

3. **Client Confirmation Template**
   ```html
   Thank you, ${name}!
   Your quote request for ${service} has been received.
   Our team will contact you shortly with next steps.
   ```

4. **Error Handling**
   - If client email missing, only admin email sent
   - Graceful fallback with warning logs
   - Environment info included in error responses

## Manual Update Required

Since automatic deployment failed, please manually update the function:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz
2. Navigate to Edge Functions
3. Find `unified-email` function

### Step 2: Update Function Code
Replace the entire function with the code from:
`supabase/functions/unified-email/index.ts`

### Step 3: Deploy to Both Environments
```bash
# Deploy to Preview
supabase functions deploy unified-email

# Deploy to Production
supabase functions deploy unified-email --project-ref mwvcbedvnimabfwubazz
```

### Step 4: Verify Deployment
Check that both environments show v29 or higher:
```bash
supabase functions list
```

## Testing After Deployment

### Test Quote Submission
```bash
curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quote_confirmation",
    "to": "admin.1@greenscapelux.com",
    "data": {
      "name": "Test Customer",
      "email": "customer@example.com",
      "phone": "555-0123",
      "selectedServices": ["Lawn Care", "Landscaping"],
      "propertySize": "Medium",
      "budget": "$500-1000",
      "message": "Test quote request"
    }
  }'
```

### Expected Results
1. Admin receives notification at admin.1@greenscapelux.com
2. Customer receives confirmation at customer@example.com
3. Both emails appear in Resend dashboard
4. Two entries in `email_logs` table:
   - `quote_confirmation_admin`
   - `quote_confirmation_client`

### Check Logs
```sql
SELECT * FROM email_logs 
WHERE email_type LIKE 'quote_confirmation%' 
ORDER BY sent_at DESC 
LIMIT 10;
```

## Environment Differences Investigation

### Why Preview Works But Production Doesn't

**Possible Causes:**
1. **Function Version Mismatch**
   - Preview may be running newer code
   - Production stuck on older version

2. **Environment Variables**
   - Check RESEND_API_KEY in both environments
   - Verify SUPABASE_URL and SERVICE_ROLE_KEY

3. **DNS/Email Routing**
   - admin.1@greenscapelux.com may have different MX records
   - Resend domain verification status

### Verification Steps

1. **Check Function Versions**
   ```bash
   # Preview
   curl https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/unified-email \
     -H "Content-Type: application/json" \
     -d '{"type":"admin_alert","to":"admin.1@greenscapelux.com","data":{"message":"Version check"}}'
   
   # Production (if different URL)
   curl https://[production-url]/functions/v1/unified-email \
     -H "Content-Type: application/json" \
     -d '{"type":"admin_alert","to":"admin.1@greenscapelux.com","data":{"message":"Version check"}}'
   ```

2. **Check Logs for Environment Info**
   - Look for "=== UNIFIED EMAIL FUNCTION INVOKED ===" in logs
   - Check "Environment: Production" or "Environment: Preview"
   - Verify "API key configured: YES"

3. **Resend Dashboard Check**
   - Go to https://resend.com/emails
   - Filter by date and sender
   - Check delivery status for both environments

## Next Steps

1. **Manual Deployment** (Required)
   - Update function code in Supabase dashboard
   - Deploy to both Preview and Production

2. **Test Both Environments**
   - Submit test quote in Preview
   - Submit test quote in Production
   - Verify both admin and client emails arrive

3. **Monitor Logs**
   - Check Supabase Edge Function logs
   - Check email_logs table
   - Check Resend dashboard

4. **Report Results**
   - Confirm admin emails work in both environments
   - Confirm client emails work in both environments
   - Share any error messages or logs

## Support

If issues persist after manual deployment:
1. Check Supabase Edge Function logs for detailed error messages
2. Verify Resend API key is valid and has sending permissions
3. Confirm admin.1@greenscapelux.com is verified in Resend
4. Check email_logs table for error_message column
