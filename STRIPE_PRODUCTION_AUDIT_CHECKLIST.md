# 🔍 Stripe Production Configuration Audit

## 📋 Pre-Deployment Verification

### Environment Variables Check
- [ ] **Vercel Production Environment**
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (not pk_test_)
  - [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (not sk_test_)  
  - [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`

- [ ] **Supabase Vault Secrets**
  - [ ] `STRIPE_SECRET_KEY` matches Vercel value
  - [ ] `STRIPE_WEBHOOK_SECRET` matches webhook endpoint

### Code Configuration Check
- [ ] **StripePaymentMethodManager.tsx**
  - [ ] No hardcoded test keys
  - [ ] Uses `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] No fallback to pk_test_ keys

- [ ] **Edge Functions**
  - [ ] `create-stripe-customer` uses vault STRIPE_SECRET_KEY
  - [ ] `create-payment-intent` uses vault STRIPE_SECRET_KEY
  - [ ] `stripe-webhook` uses vault STRIPE_WEBHOOK_SECRET

## 🚀 Post-Deployment Validation

### 1. Application Load Test
```bash
# Test URL: https://[your-domain]/profile#payment
```
- [ ] Page loads without errors
- [ ] No console errors about invalid API keys
- [ ] Stripe Elements render correctly

### 2. Payment Method Addition Test
- [ ] "Add Payment Method" button works
- [ ] Stripe card form appears
- [ ] Test card (4242 4242 4242 4242) processes
- [ ] Success message displays
- [ ] No 401/403 API errors

### 3. Backend Integration Test
- [ ] Customer created in Stripe dashboard
- [ ] Payment method attached to customer
- [ ] Webhook events logged successfully
- [ ] No failed webhook deliveries

### 4. Network Request Validation
**Check browser DevTools Network tab:**
- [ ] Stripe API calls use live endpoints
- [ ] Authorization headers use live keys
- [ ] No test mode indicators in responses

### 5. Error Handling Test
- [ ] Invalid card numbers show proper errors
- [ ] Network failures handled gracefully
- [ ] User sees helpful error messages

## 🔧 Troubleshooting Guide

### Issue: "Invalid API Key" Error
**Symptoms:** Console shows 401 errors
**Solution:**
1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel
2. Check key starts with `pk_live_`
3. Redeploy after fixing

### Issue: "No such customer" Error  
**Symptoms:** Backend API calls fail
**Solution:**
1. Verify `STRIPE_SECRET_KEY` in Supabase Vault
2. Check key starts with `sk_live_`
3. Restart edge functions

### Issue: Webhook Failures
**Symptoms:** Stripe events not processing
**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` matches endpoint
2. Verify webhook URL points to production
3. Test webhook delivery in Stripe dashboard

## ✅ Production Ready Criteria

### Critical Requirements
- [ ] All API keys are LIVE mode (not test)
- [ ] Payment method addition works end-to-end
- [ ] No invalid API key errors in production
- [ ] Webhook events process successfully
- [ ] Customer data syncs between app and Stripe

### Performance Requirements  
- [ ] Payment form loads in <2 seconds
- [ ] Card validation responds instantly
- [ ] Payment processing completes in <5 seconds
- [ ] Error messages appear immediately

### Security Requirements
- [ ] No API keys exposed in client-side code
- [ ] All secrets stored in secure vaults
- [ ] HTTPS enforced for all payment requests
- [ ] CSP headers allow Stripe domains

## 📊 Success Metrics

### Immediate Validation (0-5 minutes)
- [ ] Zero console errors on payment page
- [ ] Stripe Elements load successfully
- [ ] Test payment method saves

### Short-term Validation (5-30 minutes)
- [ ] Webhook events appear in Stripe logs
- [ ] Customer records sync correctly
- [ ] No failed API requests in monitoring

### Long-term Monitoring (30+ minutes)
- [ ] Real user payments process successfully
- [ ] Error rates remain below 1%
- [ ] Payment success rate above 95%

## 🎯 Final Confirmation

**Before marking as complete, verify:**

1. **Live Payment Test**
   - Use real credit card (small amount)
   - Confirm charge appears in Stripe dashboard
   - Verify webhook processing

2. **User Experience Test**
   - Test from different browsers/devices
   - Confirm mobile payment flow works
   - Validate error handling

3. **Monitoring Setup**
   - Enable Stripe webhook monitoring
   - Set up payment failure alerts
   - Configure success rate tracking

## 📞 Emergency Contacts

- **Stripe Support:** https://support.stripe.com/
- **Vercel Support:** https://vercel.com/support  
- **Supabase Support:** https://supabase.com/support

---

**✅ PRODUCTION STRIPE CONFIGURATION COMPLETE**

Date: ________________
Verified by: ________________
Payment flow tested: ✅ / ❌
Ready for live payments: ✅ / ❌