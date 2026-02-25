# Stripe Webhook Edge Function Column Fix Required

## Issue
Multiple Stripe webhook edge functions use the incorrect column name `stripe_account_id` instead of the correct `stripe_connect_id` that matches the database schema.

## Files Requiring Updates

### 1. `supabase/functions/stripe-connect-webhook/index.ts`

**Lines to fix:**
- Line 64: `.eq('stripe_account_id', account.id)` → `.eq('stripe_connect_id', account.id)`
- Line 78: `.eq('stripe_account_id', account.id)` → `.eq('stripe_connect_id', account.id)`
- Line 113: `.eq('stripe_account_id', capability.account)` → `.eq('stripe_connect_id', capability.account)`

**Add `stripe_account_status` update:**
```typescript
function calculateAccountStatus(account: Stripe.Account): string {
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.requirements?.disabled_reason) return 'restricted'
  if (account.requirements?.past_due?.length > 0 || account.requirements?.currently_due?.length > 0) return 'pending_verification'
  if (account.details_submitted) return 'pending_verification'
  return 'pending'
}

await supabase.from('landscapers').update({
  stripe_account_status: calculateAccountStatus(account),
  stripe_charges_enabled: account.charges_enabled || false,
  stripe_payouts_enabled: account.payouts_enabled || false,
  stripe_details_submitted: account.details_submitted || false,
  stripe_onboarding_complete: isNowActive,
  updated_at: new Date().toISOString()
}).eq('stripe_connect_id', account.id)
```

### 2. `supabase/functions/stripe-webhook/index.ts`

**Line to fix:**
- Line 113: `.eq('stripe_account_id', account.id)` → `.eq('stripe_connect_id', account.id)`

## Frontend Integration

The frontend includes realtime subscription to database changes via:
- `src/services/StripeConnectStatusService.ts` - Status management service
- `src/pages/landscaper-dashboard/OverviewPanel.tsx` - Realtime subscription
- Components listen for `STRIPE_STATUS_REFRESH_EVENT` to auto-refresh

## Database Fields Updated

| Field | Type | Description |
|-------|------|-------------|
| `stripe_account_status` | TEXT | pending, pending_verification, active, restricted |
| `stripe_charges_enabled` | BOOLEAN | Can accept charges |
| `stripe_payouts_enabled` | BOOLEAN | Can receive payouts |
| `stripe_details_submitted` | BOOLEAN | Identity verified |
| `stripe_onboarding_complete` | BOOLEAN | Full onboarding complete |

## Deployment

```bash
supabase functions deploy stripe-connect-webhook
supabase functions deploy stripe-webhook
```
