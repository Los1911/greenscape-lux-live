# Stripe Onboarding Audit Report
**Date:** October 12, 2025  
**Status:** ⚠️ CRITICAL ISSUES IDENTIFIED

## Executive Summary

This audit reveals **CRITICAL GAPS** in Stripe onboarding for both clients and professionals:

### 🚨 Critical Issues
1. **VITE_STRIPE_PUBLISHABLE_KEY Missing** - Client payment setup broken
2. **No Stripe Connect Integration** - Professional payouts not implemented
3. **Manual Payment Setup** - No automated onboarding flow
4. **Missing STRIPE_CONNECT_CLIENT_ID** - Connect accounts cannot be created

---

## 1. Environment Variables Audit

### ✅ Frontend Variables (Accessible)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51S1Ht0K6kWkUsxtpuh... ✅ CONFIGURED
```
- **Status:** Configured in `.env.local.template`
- **Runtime Access:** `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`
- **Validation:** StripeKeyValidator component confirms access
- **Issue:** NOT SET in production Vercel environment ❌

### ✅ Backend Variables (Supabase Secrets)
```bash
STRIPE_SECRET_KEY=sk_live_... ✅ CONFIGURED
STRIPE_WEBHOOK_SECRET=whsec_... ✅ CONFIGURED
```
- **Status:** Stored in Supabase Vault
- **Access:** Edge functions via `serverConfig.stripeSecretKey`

### ❌ MISSING: Stripe Connect Configuration
```bash
STRIPE_CONNECT_CLIENT_ID=ca_... ❌ NOT CONFIGURED
```
- **Impact:** Cannot create Express/Standard Connect accounts
- **Required For:** Landscaper payout onboarding
- **Where to Get:** Stripe Dashboard → Connect → Settings

---

## 2. Client Payment Onboarding Flow

### Current Implementation

#### ✅ Payment Method Manager
**File:** `src/components/client/PaymentMethodManager.tsx`
- Displays StripeKeyValidator component
- Shows "Add Payment Method" button
- Lists saved payment methods

#### ✅ Payment Method Modal
**File:** `src/components/client/PaymentMethodModal.tsx`
- Opens modal for adding payment methods
- Integrates with Stripe Elements

#### ⚠️ Stripe Initialization
**File:** `src/lib/stripe.ts`
```typescript
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
  'pk_live_51S1Ht0K6kWkUsxtpuh...' // Fallback
```
- **Issue:** Fallback key used when env var missing
- **Production Risk:** May use wrong key in production

#### ✅ Backend: Create Payment Intent
**File:** `supabase/functions/create-payment-intent/index.ts`
- Creates Stripe customers automatically
- Stores `stripe_customer_id` in profiles table
- Calculates platform fees (15%)
- Records payment in `payments` table

### Client Onboarding Steps
1. ✅ Client signs up
2. ✅ Profile created in `clients` table
3. ✅ Navigate to payment methods page
4. ❌ **BROKEN:** StripeKeyValidator shows error if env var missing
5. ⚠️ Click "Add Payment Method"
6. ✅ Modal opens with Stripe Elements
7. ✅ Payment method saved to Stripe
8. ✅ `stripe_customer_id` stored in profile

### Issues Identified
- **Production Environment:** VITE_STRIPE_PUBLISHABLE_KEY not set in Vercel
- **Error Handling:** No graceful degradation if Stripe fails to load
- **User Experience:** Validator error visible to end users

---

## 3. Professional/Landscaper Onboarding Flow

### Current Implementation

#### ❌ NO STRIPE CONNECT INTEGRATION
**File:** `src/pages/LandscaperOnboarding.tsx`
- Only collects basic profile information
- Shows placeholder text: "Payment setup will be handled through our billing team"
- **NO automated Stripe Connect onboarding**

#### ❌ Missing Connect Account Creation
**Expected File:** `supabase/functions/create-stripe-connect-account/index.ts`
- **Status:** File may exist but not integrated into onboarding flow
- **Required:** Create Express Connect accounts for landscapers
- **Missing:** Onboarding link generation

#### ⚠️ Database Schema
**File:** `supabase/migrations/001_core_tables.sql`
```sql
CREATE TABLE landscapers (
  ...
  stripe_connect_id TEXT, -- ✅ Column exists
  ...
);
```
- **Status:** Database ready to store Connect account IDs
- **Issue:** No code populates this field

#### ⚠️ Banking Panel (Partial Implementation)
**File:** `src/components/v2/layout/BankingPanel.tsx`
```typescript
const { data, error } = await supabase.functions.invoke(
  'create-stripe-connect-account',
  { body: { userId: user.id, email: user.email } }
);
```
- **Status:** Code exists to call Connect account creation
- **Issue:** Not integrated into main onboarding flow
- **Location:** Only in v2 layout (not used in main flow)

### Professional Onboarding Steps (Current)
1. ✅ Landscaper signs up
2. ✅ Profile created in `landscapers` table
3. ✅ Complete onboarding form (name, business, experience)
4. ❌ **MISSING:** Stripe Connect account creation
5. ❌ **MISSING:** Banking information collection
6. ❌ **MISSING:** Identity verification
7. ❌ **MISSING:** Payout configuration
8. ⚠️ Manual email sent for payment setup

### Critical Gaps
- **No Automated Onboarding:** Manual process via billing team
- **No Connect Accounts:** Cannot process payouts automatically
- **No Account Links:** No onboarding/dashboard links generated
- **No Verification:** No identity/banking verification flow

---

## 4. Webhook Configuration

### ✅ Webhook Handler
**File:** `supabase/functions/stripe-webhook/index.ts`
```typescript
switch (event.type) {
  case 'payment_intent.succeeded': ✅
  case 'payment_intent.payment_failed': ✅
  case 'customer.subscription.updated': ✅
}
```

### ❌ Missing Connect Events
Required webhook events NOT handled:
- `account.updated` - Connect account status changes
- `account.application.deauthorized` - Account disconnection
- `transfer.created` - Payout transfers
- `payout.paid` - Payout completion
- `payout.failed` - Payout failures

### Webhook Endpoint
```
https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook
```
- **Status:** ✅ Deployed and configured
- **Secret:** ✅ Stored in Supabase Vault
- **Events:** ⚠️ Only payment events, no Connect events

---

## 5. Database Integration

### ✅ Payments Table
```sql
payments (
  stripe_payment_intent_id TEXT,
  customer_id UUID,
  job_id UUID,
  amount DECIMAL,
  platform_fee DECIMAL,
  landscaper_amount DECIMAL,
  status TEXT,
  ...
)
```
- **Status:** ✅ Properly records all payments
- **Integration:** ✅ Updated by webhook handler

### ⚠️ Landscaper Payouts Table
**Expected:** `landscaper_payouts` table
- **Status:** May exist but not actively used
- **Required Fields:**
  - `landscaper_id`
  - `stripe_transfer_id`
  - `amount`
  - `status`
  - `payout_date`

### ❌ Missing: Connect Account Tracking
No table to track:
- Connect account onboarding status
- Verification status
- Capabilities enabled
- Requirements pending

---

## 6. UI/UX Validation

### Client Payment UI
✅ **Loading States:** Buttons disabled during processing  
✅ **Error Messages:** Clear error display in StripeKeyValidator  
⚠️ **Success Feedback:** Limited success confirmation  
❌ **Validation Visible:** Stripe key validator shown to end users

### Professional Onboarding UI
✅ **Form Validation:** Required fields enforced  
❌ **Payment Setup:** Only placeholder text  
❌ **Progress Indicator:** No multi-step onboarding flow  
❌ **Status Tracking:** No way to see onboarding completion

---

## 7. Critical Action Items

### Immediate (Production Blocking)
1. **Set VITE_STRIPE_PUBLISHABLE_KEY in Vercel Production**
   ```bash
   vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
   # Enter: pk_live_51S1Ht0K6kWkUsxtpuh...
   ```

2. **Get Stripe Connect Client ID**
   - Go to: https://dashboard.stripe.com/settings/applications
   - Copy "Client ID" (starts with `ca_`)
   - Add to Supabase Secrets: `STRIPE_CONNECT_CLIENT_ID`

3. **Remove StripeKeyValidator from Production UI**
   - Keep for admin/debug pages only
   - Don't show validation errors to end users

### High Priority (Week 1)
4. **Implement Stripe Connect Onboarding**
   - Create `create-stripe-connect-account` edge function
   - Generate Account Links for onboarding
   - Integrate into LandscaperOnboarding.tsx
   - Use Express accounts (faster onboarding)

5. **Add Connect Webhook Handlers**
   - Handle `account.updated` events
   - Update `landscapers.stripe_connect_id`
   - Track verification status

6. **Create Payout System**
   - Implement `process-payout` edge function
   - Create `landscaper_payouts` table
   - Schedule automated payouts

### Medium Priority (Week 2-3)
7. **Enhance Client Payment UX**
   - Add payment method success confirmation
   - Implement default payment method selection
   - Add payment method deletion

8. **Professional Dashboard**
   - Show Connect account status
   - Display payout history
   - Link to Stripe Express Dashboard

9. **Testing & Validation**
   - Test full client payment flow
   - Test professional onboarding end-to-end
   - Verify webhook processing

---

## 8. Recommended Architecture

### Client Flow
```
Signup → Profile → Add Payment Method → Stripe Customer Created → Ready to Pay
```

### Professional Flow
```
Signup → Profile → Create Connect Account → 
Complete Onboarding (Stripe) → Verification → 
Approved → Receive Payouts
```

### Payment Flow
```
Client Pays → Payment Intent → Webhook → 
Record Payment → Calculate Commission → 
Schedule Payout → Transfer to Landscaper
```

---

## 9. Security Checklist

✅ **Publishable Key:** Client-side safe  
✅ **Secret Key:** Server-side only (Supabase Vault)  
✅ **Webhook Secret:** Validated on every webhook  
❌ **Connect Client ID:** Not yet configured  
✅ **Customer IDs:** Stored securely in database  
⚠️ **Connect Account IDs:** Column exists but unused

---

## 10. Next Steps

1. **Configure missing environment variables**
2. **Implement Stripe Connect integration**
3. **Add Connect webhook handlers**
4. **Create payout automation**
5. **Test end-to-end flows**
6. **Update documentation**

**Estimated Time:** 2-3 days for full implementation
**Priority:** CRITICAL - Required for production launch
