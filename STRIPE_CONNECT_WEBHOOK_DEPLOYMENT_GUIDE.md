# Stripe Connect Webhook Deployment Guide

## Quick Start

The Stripe Connect webhook handler has been created and is ready for deployment. Follow these steps to activate it.

## 1. Deploy the Edge Function

```bash
# Navigate to your project directory
cd /path/to/greenscapelux

# Deploy the stripe-connect-sync function
supabase functions deploy stripe-connect-sync

# Verify deployment
supabase functions list | grep stripe-connect-sync
```

## 2. Configure Stripe Webhook

### Step 1: Get Your Webhook URL
After deployment, your webhook URL will be:
```
https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-connect-sync
```

### Step 2: Add Webhook in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → Webhooks**
3. Click **"Add endpoint"**
4. Enter the webhook URL from above
5. Select **"Connect"** as the endpoint type
6. Select events to listen for:
   - ✅ `account.updated`
7. Click **"Add endpoint"**

### Step 3: Save Webhook Secret
1. After creating the webhook, click on it to view details
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## 3. Test the Webhook

### Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI if you haven't
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local function for testing
stripe listen --forward-to https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-connect-sync

# In another terminal, trigger a test event
stripe trigger account.updated
```

### Manual Testing
1. Complete Stripe Connect onboarding for a test landscaper account
2. Check the `webhook_logs` table for the event:
   ```sql
   SELECT * FROM webhook_logs 
   WHERE event_type = 'account.updated' 
   ORDER BY processed_at DESC 
   LIMIT 5;
   ```
3. Verify the `stripe_connect_notifications` table has a new record
4. Check that the landscaper received an email notification

## 4. Verify Database Setup

The database tables have been configured with the following structure:

### stripe_connect_notifications Table
- `id` - UUID primary key
- `landscaper_id` - References landscapers table
- `event_type` - Type of webhook event (e.g., 'account.updated')
- `stripe_account_id` - Stripe Connect account ID
- `charges_enabled` - Whether charges are enabled
- `payouts_enabled` - Whether payouts are enabled
- `requirements` - JSONB object with verification requirements
- `notification_sent` - Boolean flag for notification delivery
- `created_at` - Timestamp of event
- `updated_at` - Timestamp of last update

### users Table (Enhanced)
- `stripe_account_status` - Added field to track Connect status ('pending' or 'active')

## 5. Monitor Webhook Activity

### Check Recent Webhook Events
```sql
SELECT 
  event_type,
  event_id,
  processed_at,
  data->>'object'->>'id' as stripe_account_id
FROM webhook_logs 
WHERE event_type = 'account.updated'
ORDER BY processed_at DESC 
LIMIT 10;
```

### Check Notification Delivery
```sql
SELECT 
  scn.*,
  l.business_name,
  u.email,
  u.stripe_account_status
FROM stripe_connect_notifications scn
JOIN landscapers l ON l.id = scn.landscaper_id
JOIN users u ON u.id = l.user_id
ORDER BY scn.created_at DESC
LIMIT 10;
```

### Check Failed Notifications
```sql
SELECT * FROM stripe_connect_notifications 
WHERE notification_sent = false 
AND created_at < NOW() - INTERVAL '1 hour';
```

## 6. Webhook Event Flow

When a Stripe Connect account is updated:

1. **Stripe sends webhook** → `stripe-connect-sync` function
2. **Function logs event** → `webhook_logs` table
3. **Function queries landscaper** → By `stripe_connect_id`
4. **Function updates status** → Both `landscapers` and `users` tables
5. **Function logs notification** → `stripe_connect_notifications` table
6. **Function checks status change**:
   - If newly active → Send "Setup Complete" email + in-app notification
   - If verification needed → Send "Action Required" email + in-app notification
7. **Function returns 200 OK** → Stripe marks webhook as delivered

## 7. Notification Types

### Onboarding Complete
**Trigger**: When `charges_enabled` AND `payouts_enabled` both become true

**Email Subject**: 🎉 Stripe Connect Setup Complete - Ready to Receive Payments!

**Content**:
- Congratulations message
- Checklist of completed steps
- Link to dashboard
- Payment flow explanation

**In-App Notification**:
- Type: `stripe_onboarding_complete`
- Title: "Stripe Setup Complete!"
- Message: "Your account is verified and ready to receive payments."

### Verification Required
**Trigger**: When `requirements.currently_due` or `requirements.past_due` has items

**Email Subject**: ⚠️ Action Required: Complete Your Stripe Verification

**Content**:
- Friendly greeting
- List of required fields
- Highlighted warning
- Direct link to complete

**In-App Notification**:
- Type: `stripe_verification_required`
- Title: "Verification Required"
- Message: "Please complete: [list of fields]"

## 8. Dashboard Integration

The `StripeConnectOnboardingCard` component automatically:
- Fetches status from `users.stripe_account_status`
- Shows real-time progress
- Displays verification requirements
- Auto-dismisses when status = 'active'

## 9. Troubleshooting

### Webhook Not Receiving Events
- ✅ Check Stripe webhook configuration
- ✅ Verify endpoint URL is correct
- ✅ Check Supabase function logs
- ✅ Test with Stripe CLI

### Notifications Not Sending
- ✅ Verify `unified-email` function is deployed
- ✅ Check `RESEND_API_KEY` is configured
- ✅ Review `email_logs` table for errors
- ✅ Confirm user email is valid

### Status Not Updating
- ✅ Check `webhook_logs` for events
- ✅ Verify RLS policies allow updates
- ✅ Check function logs for errors
- ✅ Confirm `stripe_connect_id` matches

## 10. Security Checklist

- ✅ Webhook signature verification enabled
- ✅ Service role key used for database updates
- ✅ CORS headers properly configured
- ✅ RLS policies restrict access appropriately
- ✅ Webhook secret stored securely in Supabase secrets

## 11. Next Steps

1. **Deploy to Production**: Run the deployment command
2. **Configure Stripe**: Add webhook endpoint in Stripe dashboard
3. **Test Thoroughly**: Use test mode to verify all flows
4. **Monitor**: Set up alerts for failed webhooks
5. **Document**: Share this guide with your team

## Support

For issues or questions:
- Check Supabase function logs
- Review Stripe webhook delivery logs
- Consult [STRIPE_CONNECT_WEBHOOK_IMPLEMENTATION.md](./STRIPE_CONNECT_WEBHOOK_IMPLEMENTATION.md)
- Review [Stripe Connect documentation](https://stripe.com/docs/connect)
