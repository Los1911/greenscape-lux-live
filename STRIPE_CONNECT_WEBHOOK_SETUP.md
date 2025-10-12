# Stripe Connect Webhook Setup Guide

## Overview
This guide explains how to set up Stripe Connect webhooks to automatically sync connected account status and send notifications to landscapers.

## What This Webhook Does

### Events Handled
1. **account.updated** - Triggered when a connected account's status changes
2. **capability.updated** - Triggered when payment/payout capabilities change

### Automatic Actions
- ✅ Updates landscaper database with current Connect status
- ✅ Sends email when onboarding is complete
- ✅ Sends in-app notification when ready to receive payments
- ✅ Alerts landscaper when additional verification is needed
- ✅ Logs all events for audit trail

## Setup Instructions

### Step 1: Deploy the Edge Function
The function is already created at `supabase/functions/stripe-connect-webhook/index.ts`

### Step 2: Get the Webhook URL
Your webhook endpoint URL is:
```
https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-connect-webhook
```

### Step 3: Configure in Stripe Dashboard

1. **Log into Stripe Dashboard**
   - Go to https://dashboard.stripe.com

2. **Navigate to Webhooks**
   - Click **Developers** in the left sidebar
   - Click **Webhooks**
   - Click **Add endpoint**

3. **Configure Endpoint**
   - **Endpoint URL**: Paste your Supabase function URL
   - **Description**: "GreenScape Lux Connect Events"
   - **Events to send**: Select these events:
     - ✅ `account.updated`
     - ✅ `capability.updated`

4. **Save and Get Signing Secret**
   - Click **Add endpoint**
   - Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Add Webhook Secret to Supabase

```bash
# In your terminal
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

Or via Supabase Dashboard:
1. Go to Project Settings > Edge Functions
2. Add secret: `STRIPE_WEBHOOK_SECRET`
3. Paste the webhook signing secret

## Testing the Webhook

### Test in Stripe Dashboard
1. Go to **Developers > Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select `account.updated` event
5. Click **Send test webhook**

### Verify in Supabase
Check the `webhook_logs` table:
```sql
SELECT * FROM webhook_logs 
WHERE event_type IN ('account.updated', 'capability.updated')
ORDER BY created_at DESC 
LIMIT 10;
```

Check notifications were created:
```sql
SELECT * FROM stripe_connect_notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

## Notification Flow

### When Onboarding Completes
1. Stripe sends `account.updated` with `charges_enabled: true` and `payouts_enabled: true`
2. Webhook updates landscaper record
3. Email sent: "🎉 Stripe Connect Setup Complete!"
4. In-app notification created
5. Landscaper can now receive payments

### When Verification Needed
1. Stripe sends `account.updated` with requirements
2. Webhook checks `currently_due` and `past_due` fields
3. Email sent: "⚠️ Action Required: Complete Verification"
4. In-app notification with specific fields needed
5. Landscaper clicks link to complete verification

### When Capability Activates
1. Stripe sends `capability.updated` with `status: active`
2. In-app notification: "Card Payments Enabled" or "Payouts Enabled"
3. Landscaper sees updated status in dashboard

## Database Schema

### stripe_connect_notifications Table
```sql
CREATE TABLE stripe_connect_notifications (
  id UUID PRIMARY KEY,
  landscaper_id UUID REFERENCES landscapers(id),
  event_type TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  requirements JSONB DEFAULT '{}'::jsonb,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Monitoring

### Check Recent Events
```sql
SELECT 
  scn.event_type,
  l.name as landscaper_name,
  scn.charges_enabled,
  scn.payouts_enabled,
  scn.notification_sent,
  scn.created_at
FROM stripe_connect_notifications scn
JOIN landscapers l ON l.id = scn.landscaper_id
ORDER BY scn.created_at DESC
LIMIT 20;
```

### Check Failed Webhooks
```sql
SELECT * FROM webhook_logs 
WHERE event_type LIKE 'account.%' OR event_type LIKE 'capability.%'
ORDER BY created_at DESC;
```

## Troubleshooting

### Webhook Not Receiving Events
1. Verify webhook URL is correct in Stripe Dashboard
2. Check that `STRIPE_WEBHOOK_SECRET` is set in Supabase
3. Test webhook from Stripe Dashboard
4. Check Supabase Edge Function logs

### Notifications Not Sending
1. Verify `unified-email` function is deployed
2. Check `RESEND_API_KEY` is set
3. Verify user email exists in database
4. Check email logs: `SELECT * FROM email_logs ORDER BY created_at DESC`

### Status Not Updating
1. Verify `stripe_account_id` matches in landscapers table
2. Check webhook_logs for event receipt
3. Verify landscaper record exists
4. Check Edge Function logs for errors

## Security Notes

- ✅ Webhook signature verification prevents unauthorized requests
- ✅ Service role key used for database updates
- ✅ All events logged for audit trail
- ✅ CORS headers properly configured

## Next Steps

After setup:
1. Test with a real Connect onboarding flow
2. Monitor webhook_logs for successful events
3. Verify emails are being sent
4. Check landscaper dashboard shows updated status
5. Test verification required flow

## Support

If webhooks aren't working:
1. Check Stripe Dashboard > Webhooks for failed attempts
2. Review Supabase Edge Function logs
3. Verify all environment variables are set
4. Test with Stripe CLI for local debugging
