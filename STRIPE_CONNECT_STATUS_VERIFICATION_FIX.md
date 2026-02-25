# Stripe Connect Status Verification Fix

## Problem
After completing Stripe Connect onboarding, the frontend was still showing "0/3 Complete" because:
1. The `stripe_account_status` remained as 'pending' in the database
2. There was no mechanism to verify the account status with Stripe's API after returning from onboarding
3. The `stripe_onboarding_complete` column was missing from the database

## Solution Implemented

### 1. New Edge Function: `verify-stripe-connect-status`
Created a new edge function that:
- Accepts `userId` or `accountId` as parameters
- Fetches the account status directly from Stripe's API
- Updates the database with the verified status:
  - `stripe_account_status` (pending/pending_verification/active/restricted)
  - `stripe_charges_enabled` (boolean)
  - `stripe_payouts_enabled` (boolean)
  - `stripe_details_submitted` (boolean)
  - `stripe_onboarding_complete` (boolean)
- Returns the full status to the frontend

### 2. Database Schema Update
Added missing column:
```sql
ALTER TABLE landscapers 
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
```

### 3. Updated `StripeConnectOnboardingCard.tsx`
- Now calls `verify-stripe-connect-status` on mount if there's a pending account
- Added a "Refresh Status" button for manual verification
- Shows step-by-step progress based on verified status
- Automatically hides when account is fully active

### 4. Updated `LandscaperDashboardV2.tsx`
- Enhanced `handleStripeReturn` to call verification function after returning from Stripe
- Shows appropriate toast messages based on verification result
- Dispatches refresh event to update all components

## How It Works

### Flow After Stripe Onboarding:
1. User completes Stripe onboarding and is redirected back with `?stripe_return=success&account_id=xxx`
2. Dashboard detects the URL parameters
3. Dashboard calls `verify-stripe-connect-status` edge function
4. Edge function fetches account status from Stripe API
5. Edge function updates database with verified status
6. Frontend receives status and updates UI
7. Refresh event dispatched to update all components

### Automatic Verification:
- On component mount, if `stripe_account_status` is 'pending' but `stripe_connect_id` exists
- Calls verification function to get latest status from Stripe
- Updates UI based on response

### Manual Verification:
- User can click "Refresh Status" button
- Calls verification function
- Updates UI with latest status

## Testing

### Test the Edge Function:
```bash
curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/verify-stripe-connect-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"userId": "USER_ID_HERE"}'
```

### Expected Response:
```json
{
  "success": true,
  "accountId": "acct_xxx",
  "status": "active",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "onboardingComplete": true,
  "requirements": {
    "currently_due": [],
    "eventually_due": [],
    "past_due": [],
    "disabled_reason": null
  }
}
```

## Status Values

| Status | Description |
|--------|-------------|
| `not_connected` | No Stripe Connect account exists |
| `pending` | Account created but onboarding not started |
| `pending_verification` | Details submitted, awaiting Stripe review |
| `active` | Fully verified, can accept payments and receive payouts |
| `restricted` | Account has restrictions, needs attention |

## Files Modified

1. `src/components/landscaper/StripeConnectOnboardingCard.tsx` - Added verification logic
2. `src/pages/LandscaperDashboardV2.tsx` - Enhanced return URL handling
3. Edge function `verify-stripe-connect-status` - New function created
4. Database - Added `stripe_onboarding_complete` column

## Verified Status for Carlos Matthews
```json
{
  "stripe_connect_id": "acct_1SHWkjGU0UIEPOEY",
  "stripe_account_status": "active",
  "stripe_charges_enabled": true,
  "stripe_payouts_enabled": true,
  "stripe_details_submitted": true,
  "stripe_onboarding_complete": true
}
```
