# Stripe Connect Onboarding Card Implementation

## Overview
Added a prominent Stripe Connect onboarding card to the landscaper dashboard Overview panel that displays setup progress, onboarding status, and payout readiness.

## Features Implemented

### 1. **StripeConnectOnboardingCard Component**
Location: `src/components/landscaper/StripeConnectOnboardingCard.tsx`

#### Key Features:
- **Onboarding Status Tracking**: Checks Stripe Connect account status from profiles table
- **Visual Progress Indicator**: Shows completion percentage with animated progress bar
- **Step-by-Step Breakdown**:
  - Identity Verification (FileText icon)
  - Bank Account Setup (Building2 icon)
  - Tax Information (CreditCard icon)
- **Payout Readiness Status**: Live indicator showing if account is ready to receive payments
- **Dismissible**: Can be dismissed once fully set up (auto-hides when payouts enabled)
- **Clear CTA Button**: 
  - "Start Stripe Connect Setup" (new accounts)
  - "Continue Setup" (pending accounts)
  - Shows loading state during setup

#### Visual Design:
- Gradient background (emerald to blue)
- Prominent border styling
- Icon-based step indicators
- Color-coded completion status (green = complete, gray = incomplete)
- Animated progress bar
- Pulsing status indicator

### 2. **Integration with Overview Panel**
Location: `src/pages/landscaper-dashboard/OverviewPanel.tsx`

- Placed at the **top** of the Overview panel for maximum visibility
- Only displays when:
  - User is authenticated (landscaperId available)
  - Profile email exists
  - Account is not fully set up (auto-hides when complete)

### 3. **Database Integration**
Reads from `profiles` table:
- `stripe_connect_id`: Stripe Connect account ID
- `stripe_account_status`: Account status (pending/active)

### 4. **Stripe Connect Flow**
1. User clicks "Start Stripe Connect Setup"
2. Calls `create-stripe-connect-account` edge function
3. Stores account ID and status in profiles table
4. Redirects to Stripe onboarding URL
5. Returns to dashboard after completion
6. Card updates to show progress/completion

## Usage

The card automatically appears on the landscaper dashboard Overview panel when:
- User has not completed Stripe Connect onboarding
- User's account status is not "active"

Once the user completes all steps and payouts are enabled, the card automatically dismisses.

## Database Schema Requirements

Ensure `profiles` table has these columns:
```sql
stripe_connect_id TEXT
stripe_account_status TEXT -- values: 'pending', 'active'
```

## Edge Function Required

`create-stripe-connect-account` edge function should:
- Create Stripe Connect account
- Generate onboarding URL
- Return account ID and onboarding URL

## Visual States

1. **Not Started**: All steps incomplete, "Start Setup" button
2. **In Progress**: Some steps complete, progress bar shows percentage
3. **Pending Completion**: Account created but not all steps verified
4. **Complete**: All steps done, payouts enabled, card auto-hides

## Customization

To modify the steps or styling:
- Edit `steps` state in StripeConnectOnboardingCard.tsx
- Adjust gradient colors in className
- Modify icons from lucide-react

## Benefits

- **Increased Conversion**: Prominent placement ensures landscapers complete setup
- **Clear Progress**: Visual indicators show exactly what's needed
- **Reduced Support**: Self-explanatory steps reduce confusion
- **Professional UX**: Matches dashboard design language
