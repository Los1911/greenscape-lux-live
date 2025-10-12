# Manual Edge Functions Cleanup - Step-by-Step Execution

## 🚨 IMPORTANT: I Cannot Access External Dashboards

I cannot directly access your Supabase Dashboard to perform the cleanup. However, I can guide you through the exact steps and provide tools to help.

## 📋 IMMEDIATE ACTION STEPS

### Step 1: Access Your Dashboard
1. Go to https://supabase.com/dashboard
2. Select project: `mwvcbedvnimabfwubazz`
3. Navigate to **Edge Functions** in left sidebar

### Step 2: Bulk Delete Process
**Current State**: 100+ functions  
**Target State**: 19 production functions

### Quick Identification Guide:
- **DELETE ALL** functions starting with: `test-`, `debug-`, `diagnose-`, `verify-`, `check-`, `audit-`, `emergency-`, `fix-`, `comprehensive-`
- **KEEP ONLY** the 19 production functions listed below

## ✅ PRODUCTION FUNCTIONS TO KEEP (DO NOT DELETE):

1. stripe-webhook
2. unified-email  
3. create-payment-intent
4. create-stripe-customer
5. create-stripe-connect-account
6. create-billing-portal-session
7. create-subscription
8. process-payout
9. submit-contact-form
10. send-notification
11. send-job-notification
12. send-payout-notification
13. send-quote-email
14. landscaper-signup-email
15. notification-scheduler
16. get-payment-history
17. list-payment-methods
18. set-default-payment-method
19. delete-payment-method

## 🎯 SUCCESS VERIFICATION
After cleanup, you should see exactly **19 functions** in your dashboard.

**ESTIMATED TIME**: 15-20 minutes  
**RISK**: Zero (only removing test/debug functions)

## Next Steps After Manual Cleanup
Once you complete the manual cleanup, I can help with:
1. Database index optimization
2. Frontend code consolidation
3. Performance monitoring setup