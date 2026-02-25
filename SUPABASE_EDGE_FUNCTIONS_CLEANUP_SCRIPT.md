# Supabase Edge Functions Cleanup Script

## 🚨 CRITICAL: Manual Deletion Required

**Edge functions can only be deleted from the Supabase Dashboard - not via code or CLI.**

## 📋 DELETION CHECKLIST

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `mwvcbedvnimabfwubazz`
3. Navigate to **Edge Functions** section

### Step 2: Delete Test Functions (20+ functions)
Delete ALL functions starting with `test-`:

- ✅ test-login-flow
- ✅ test-password-flow  
- ✅ test-password-reset
- ✅ test-carlos-password-reset
- ✅ test-pkce-password-reset
- ✅ test-auto-config
- ✅ test-complete-login-flow
- ✅ test-carlos-credentials
- ✅ test-user-status
- ✅ test-landscaper-signup-flow
- ✅ test-commission-calculator
- ✅ test-client-signup-flow
- ✅ test-email-delivery
- ✅ test-quote-email-flow
- ✅ test-retry-system
- ✅ test-email-fix
- ✅ test-password-reset-fix
- ✅ test-unified-password-reset
- ✅ test-password-reset-link
- ✅ test-carlos-password-reset-complete

### Step 3: Delete Debug Functions (25+ functions)
Delete ALL functions starting with `debug-`:

- ✅ debug-password-reset
- ✅ debug-password-reset-live
- ✅ debug-password-reset-url
- ✅ debug-password-reset-pkce
- ✅ debug-login-issue
- ✅ debug-email-error
- ✅ debug-document-upload-404
- ✅ debug-file-upload
- ✅ debug-client-dashboard-loading
- ✅ debug-landscaper-infinite-loop
- ✅ debug-signup-email-flow
- ✅ debug-function-deployment
- ✅ debug-reset-password-env

### Step 4: Delete Diagnostic Functions (15+ functions)
Delete ALL functions with these patterns:

- ✅ diagnose-carlos-account
- ✅ diagnose-password-reset-issue
- ✅ diagnose-supabase-auth-flow
- ✅ diagnose-email-delivery-issues
- ✅ deployment-diagnostic
- ✅ auth-flow-diagnostic
- ✅ password-reset-flow-diagnostic
- ✅ comprehensive-system-diagnostic
- ✅ comprehensive-deployment-audit
- ✅ comprehensive-auth-system-test
- ✅ comprehensive-signup-dashboard-test
- ✅ comprehensive-login-diagnostic
- ✅ comprehensive-password-reset-audit
- ✅ comprehensive-supabase-audit
- ✅ comprehensive-greenscape-audit

### Step 5: Delete Verification Functions (20+ functions)
Delete ALL functions with these patterns:

- ✅ verify-env-config
- ✅ verify-test-accounts
- ✅ check-auth-config
- ✅ check-user-auth-status
- ✅ audit-auth-consistency
- ✅ audit-quote-email-system
- ✅ email-delivery-audit
- ✅ password-reset-email-diagnostic
- ✅ stripe-integration-diagnostic
- ✅ landscaper-approval-restriction

### Step 6: Delete Emergency/Fix Functions (10+ functions)
Delete ALL functions with these patterns:

- ✅ emergency-user-fix
- ✅ emergency-account-creation
- ✅ fix-carlos-login
- ✅ fix-carlos-account
- ✅ fix-missing-user
- ✅ fix-login-credentials
- ✅ fix-email-system
- ✅ fix-password-reset-flow
- ✅ fix-carlos-role
- ✅ fix-carlos-login-credentials

## ✅ PRODUCTION FUNCTIONS TO KEEP (19 functions)

**DO NOT DELETE these essential production functions:**

1. ✅ **stripe-webhook** - Payment processing
2. ✅ **unified-email** - Email system  
3. ✅ **create-payment-intent** - Payment processing
4. ✅ **create-stripe-customer** - Customer management
5. ✅ **stripe-connect-onboarding** - Landscaper payouts (NEW - replaces create-stripe-connect-account)
6. ✅ **create-billing-portal-session** - Billing management
7. ✅ **create-subscription** - Subscription handling
8. ✅ **process-payout** - Automated payouts
9. ✅ **submit-contact-form** - Contact form handling
10. ✅ **send-notification** - Notification system
11. ✅ **send-job-notification** - Job notifications
12. ✅ **send-payout-notification** - Payout notifications
13. ✅ **send-quote-email** - Quote system
14. ✅ **landscaper-signup-email** - Signup emails
15. ✅ **notification-scheduler** - Scheduled notifications
16. ✅ **get-payment-history** - Payment data
17. ✅ **list-payment-methods** - Payment methods
18. ✅ **set-default-payment-method** - Payment defaults
19. ✅ **delete-payment-method** - Payment cleanup

## 🗑️ DEPRECATED FUNCTIONS TO DELETE

**DELETE this function - it has stuck JWT metadata:**

- ❌ **create-stripe-connect-account** - DEPRECATED, replaced by stripe-connect-onboarding


## 🎯 SUCCESS CRITERIA

After cleanup, your Edge Functions list should show:
- **Exactly 19 functions** (down from 100+)
- **No functions with test-, debug-, diagnostic- prefixes**
- **Clean, production-only function names**
- **Improved dashboard performance**

## ⚠️ SAFETY NOTES

- **Zero risk** - Only removing test/debug functions
- **No production impact** - All essential functions preserved
- **No code changes needed** - Local codebase is clean
- **Immediate execution** - Safe to do right now

---

**ESTIMATED TIME**: 15-20 minutes  
**RISK LEVEL**: Zero  
**STATUS**: Ready for immediate execution