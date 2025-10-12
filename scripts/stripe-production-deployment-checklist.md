# Stripe Production Deployment Checklist

## Pre-Deployment Validation

### 1. Supabase Configuration
- [ ] Navigate to Supabase Dashboard → Project Settings → Edge Functions
- [ ] Update `STRIPE_SECRET_KEY` with live key (`sk_live_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret (`whsec_...`)
- [ ] Verify no test keys remain in Supabase environment

### 2. Vercel Configuration  
- [ ] Navigate to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` with live key (`pk_live_...`)
- [ ] Ensure variable is set for "Production" environment
- [ ] Redeploy to apply new environment variables

### 3. Stripe Dashboard Setup
- [ ] Create webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook-handler`
- [ ] Configure required events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed` 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy webhook signing secret to Supabase

### 4. Code Validation
- [ ] Run: `node scripts/validate-stripe-production.js`
- [ ] Verify no test keys in codebase
- [ ] Verify no placeholder values remain
- [ ] Check Stripe client initialization in browser console

### 5. Deployment Testing
- [ ] Deploy to production
- [ ] Test client dashboard loads without errors
- [ ] Verify Stripe Elements initialize correctly
- [ ] Test small payment ($0.50) to verify end-to-end flow
- [ ] Check webhook events received in Stripe Dashboard

### 6. Monitoring Setup
- [ ] Monitor Stripe Dashboard for live transactions
- [ ] Check Supabase Edge Function logs for webhook processing
- [ ] Verify payment confirmations are sent to customers
- [ ] Test payment failure scenarios

## Emergency Contacts & Rollback

### If Payment Issues Occur:
1. **Immediate**: Revert to test keys in all environments
2. **Debug**: Check Supabase and Vercel logs for errors
3. **Test**: Verify functionality in development environment
4. **Redeploy**: Only switch back to live keys after testing

### Key Locations:
- **Supabase**: Project Settings → Edge Functions → Environment Variables
- **Vercel**: Project Settings → Environment Variables → Production
- **Stripe**: Dashboard → Developers → Webhooks

## Success Criteria
✅ All payments process successfully  
✅ Webhooks receive events without errors  
✅ Customer notifications sent correctly  
✅ No test keys remain in any environment  
✅ Production monitoring shows healthy metrics