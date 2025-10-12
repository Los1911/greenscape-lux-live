# Stripe Connect Webhook Implementation Guide

## Overview
This guide covers the implementation of the Stripe Connect webhook handler that automatically syncs account status updates to the database and sends notifications to landscapers.

## Features Implemented

### 1. Automatic Status Sync
- Listens for `account.updated` events from Stripe Connect
- Updates both `landscapers` and `users` tables with current account status
- Tracks `charges_enabled`, `payouts_enabled`, and `details_submitted` fields
- Sets `stripe_account_status` to 'active' or 'pending' based on capabilities

### 2. Notification System
- **Onboarding Complete**: Sent when account becomes fully verified
  - Triggers when `charges_enabled` AND `payouts_enabled` both become true
  - Email notification with congratulations message
  - In-app notification in dashboard
  
- **Verification Required**: Sent when additional information is needed
  - Triggers when `requirements.currently_due` or `requirements.past_due` has items
  - Lists specific fields that need to be completed
  - Provides direct link to complete verification

### 3. Audit Logging
- All webhook events logged to `webhook_logs` table
- Account status changes tracked in `stripe_connect_notifications` table
- Includes full requirements object for debugging

## Database Schema

### stripe_connect_notifications Table
```sql
CREATE TABLE stripe_connect_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landscaper_id UUID REFERENCES landscapers(id),
  event_type TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  requirements JSONB,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Deployment Steps

### 1. Deploy Edge Function
```bash
# Deploy the stripe-connect-sync function
supabase functions deploy stripe-connect-sync

# Verify deployment
supabase functions list
```

### 2. Configure Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter webhook URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/stripe-connect-sync
   ```
4. Select events to listen for:
   - `account.updated`
5. Copy the webhook signing secret
6. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Test Webhook
```bash
# Use Stripe CLI to test locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-connect-sync

# Trigger test event
stripe trigger account.updated
```

## Webhook Event Flow

```
Stripe Connect Account Updated
         ↓
Webhook receives account.updated event
         ↓
Verify webhook signature
         ↓
Log event to webhook_logs
         ↓
Query landscaper by stripe_connect_id
         ↓
Update landscapers table (charges_enabled, payouts_enabled, status)
         ↓
Update users table (stripe_account_status)
         ↓
Log to stripe_connect_notifications
         ↓
Check if status changed to active → Send completion email + notification
         ↓
Check if verification required → Send action required email + notification
         ↓
Return 200 OK to Stripe
```

## Notification Templates

### Onboarding Complete Email
- **Subject**: 🎉 Stripe Connect Setup Complete - Ready to Receive Payments!
- **Content**: 
  - Congratulations message
  - List of completed steps (Identity, Bank, Tax)
  - Link to dashboard
  - Explanation of payment flow

### Verification Required Email
- **Subject**: ⚠️ Action Required: Complete Your Stripe Verification
- **Content**:
  - Friendly greeting
  - List of required fields
  - Highlighted warning box
  - Direct link to complete verification

## Status Mapping

| Stripe Status | Database Status | Notification Trigger |
|--------------|----------------|---------------------|
| charges_enabled: false, payouts_enabled: false | pending | None |
| charges_enabled: true, payouts_enabled: false | pending | Verification Required |
| charges_enabled: false, payouts_enabled: true | pending | Verification Required |
| charges_enabled: true, payouts_enabled: true | active | Onboarding Complete |

## Monitoring & Debugging

### Check Webhook Logs
```sql
SELECT * FROM webhook_logs 
WHERE event_type = 'account.updated' 
ORDER BY processed_at DESC 
LIMIT 10;
```

### Check Notification History
```sql
SELECT 
  scn.*,
  l.business_name,
  u.email
FROM stripe_connect_notifications scn
JOIN landscapers l ON l.id = scn.landscaper_id
JOIN users u ON u.id = l.user_id
ORDER BY scn.created_at DESC
LIMIT 20;
```

### Check Failed Notifications
```sql
SELECT * FROM stripe_connect_notifications 
WHERE notification_sent = false 
AND created_at < NOW() - INTERVAL '1 hour';
```

## Error Handling

The webhook handler includes comprehensive error handling:
- Invalid signature → 400 error
- Missing landscaper → Log and return 200 (prevents retry loop)
- Database errors → Logged but doesn't fail webhook
- Email failures → Logged but doesn't fail webhook

## Security Considerations

1. **Webhook Signature Verification**: Always verify the Stripe signature header
2. **Service Role Key**: Uses service role key to bypass RLS for updates
3. **CORS Headers**: Properly configured for Stripe webhook calls
4. **Idempotency**: Webhook events are logged with event_id to prevent duplicates

## Integration with Dashboard

The StripeConnectOnboardingCard component automatically:
- Fetches current account status from `users.stripe_account_status`
- Shows real-time progress based on webhook updates
- Displays verification requirements from latest webhook event
- Auto-dismisses when status becomes 'active'

## Testing Checklist

- [ ] Webhook endpoint is accessible
- [ ] Webhook secret is configured
- [ ] account.updated events are received
- [ ] landscapers table is updated correctly
- [ ] users table is updated correctly
- [ ] Onboarding complete email is sent
- [ ] Verification required email is sent
- [ ] In-app notifications appear
- [ ] Dashboard card reflects status changes
- [ ] Webhook logs are created
- [ ] stripe_connect_notifications records are created

## Troubleshooting

### Webhook not receiving events
1. Check Stripe webhook configuration
2. Verify endpoint URL is correct
3. Check Supabase function logs
4. Test with Stripe CLI

### Notifications not sending
1. Check unified-email function is deployed
2. Verify RESEND_API_KEY is configured
3. Check email_logs table for errors
4. Verify user email is valid

### Status not updating in dashboard
1. Check browser console for errors
2. Verify RLS policies allow reads
3. Check real-time subscriptions are working
4. Clear browser cache

## Next Steps

1. **Deploy to Production**: Follow deployment steps above
2. **Monitor Webhooks**: Set up alerts for failed webhooks
3. **Test Thoroughly**: Use Stripe test mode to verify all flows
4. **Document for Team**: Share this guide with team members

## Related Documentation

- [Stripe Connect Onboarding Card Implementation](./STRIPE_CONNECT_ONBOARDING_IMPLEMENTATION.md)
- [Unified Email System](./UNIFIED_EMAIL_CONSOLIDATION_COMPLETE.md)
- [Notification System](./NOTIFICATION_SYSTEM_IMPLEMENTATION_COMPLETE.md)
