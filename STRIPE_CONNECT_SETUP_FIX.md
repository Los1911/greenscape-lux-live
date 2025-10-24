# Stripe Connect Setup Fix

## Issue
Landscapers were getting "Failed to create Connect account" error when clicking "Start Stripe Connect Setup" button.

## Root Cause
The edge function `create-stripe-connect-account` was missing from the codebase, causing a 404 error when the frontend tried to invoke it.

## Solution Implemented

### 1. Created Edge Function
**File:** `supabase/functions/create-stripe-connect-account/index.ts`

**Functionality:**
- Creates Stripe Express Connect account for landscapers
- Generates Account Link for Stripe onboarding flow
- Returns account ID and onboarding URL
- Handles errors with detailed logging

**API:**
```typescript
// Request
{
  userId: string,
  email: string,
  businessName?: string
}

// Response
{
  success: true,
  accountId: string,
  onboardingUrl: string
}
```

### 2. How It Works

**Step 1: Create Connect Account**
- Type: Express (simplified onboarding)
- Capabilities: card_payments, transfers
- Business type: individual
- Email and business name captured

**Step 2: Generate Onboarding Link**
- Creates Account Link for Stripe-hosted onboarding
- Return URL: `/landscaper-dashboard`
- Refresh URL: `/landscaper-dashboard`
- Type: account_onboarding

**Step 3: Store & Redirect**
- Saves `stripe_connect_id` to profiles table
- Sets `stripe_account_status` to 'pending'
- Redirects user to Stripe onboarding URL

### 3. Stripe Onboarding Flow

When landscaper clicks "Start Stripe Connect Setup":
1. Edge function creates Express account
2. User redirected to Stripe-hosted onboarding
3. Stripe collects:
   - Identity verification (ID, SSN)
   - Bank account details
   - Tax information (W-9)
4. User returns to dashboard after completion
5. Webhook updates account status to 'active'

### 4. Deployment Required

**Deploy Edge Function:**
```bash
supabase functions deploy create-stripe-connect-account
```

**Environment Variables Required:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SITE_URL` - Your site URL for return/refresh URLs

### 5. Testing

**Test the flow:**
1. Login as landscaper
2. Navigate to dashboard
3. Click "Start Stripe Connect Setup"
4. Should redirect to Stripe onboarding (not error)
5. Complete onboarding on Stripe
6. Return to dashboard
7. Verify payout status shows "Ready to receive payments"

## Files Modified
- Created: `supabase/functions/create-stripe-connect-account/index.ts`
- Updated: This documentation

## Next Steps
1. Deploy the edge function to Supabase
2. Test with a real landscaper account
3. Verify webhook handles account.updated events
4. Monitor for any Stripe API errors in logs
