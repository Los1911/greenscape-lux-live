# 🚨 STRIPE CRITICAL FIXES - EXECUTION PLAN
*Complete Action Plan to Restore Payment Functionality*

## 🎯 MISSION CRITICAL OVERVIEW
Your GreenScape Lux payment system is currently **100% BROKEN** due to missing environment variables. This plan provides the exact sequence to restore full payment functionality in under 30 minutes.

## 🔥 EXECUTION SEQUENCE (DO IN ORDER)

### PHASE 1: VERCEL ENVIRONMENT SETUP (5 minutes)
**Status**: 🚨 CRITICAL - Must complete first

**Actions**:
1. **Access Vercel**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. **Add Variable**: 
   - Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - Environment: Production
3. **Redeploy**: Deployments → Redeploy latest

**Success Criteria**: ✅ Environment variable shows in Vercel dashboard

### PHASE 2: SUPABASE SECRETS CONFIGURATION (15 minutes)
**Status**: 🚨 CRITICAL - Backend payment processing

**Actions**:
1. **Get Stripe Keys**:
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy secret key (sk_live_...)
   
2. **Create Webhook**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret (whsec_...)

3. **Add to Supabase**:
   - Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/secrets
   - Add: `STRIPE_SECRET_KEY` = your secret key
   - Add: `STRIPE_WEBHOOK_SECRET` = your webhook secret

**Success Criteria**: ✅ Both secrets visible in Supabase dashboard

### PHASE 3: CODE FIXES (5 minutes)
**Status**: ⚠️ HIGH - Fix fallback key mismatch

**Actions**:
1. **Update File**: `src/components/client/StripePaymentMethodManager.tsx`
2. **Find Line 12**: Current hardcoded fallback key
3. **Replace With**: Correct fallback key (if needed)

**Success Criteria**: ✅ Code uses correct fallback key

### PHASE 4: VERIFICATION & TESTING (5 minutes)
**Status**: ✅ VALIDATION - Ensure everything works

**Actions**:
1. **Browser Test**:
   - Open production site
   - Console: `console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);`
   - Should show correct key

2. **Payment Test**:
   - Navigate to payment methods
   - Try adding payment method
   - Should complete without errors

3. **Webhook Test**:
   - Stripe Dashboard → Webhooks → Send test webhook
   - Check Supabase function logs

**Success Criteria**: ✅ All tests pass without errors

## 📋 DETAILED CHECKLISTS

### ✅ PHASE 1 CHECKLIST - VERCEL:
- [ ] Logged into Vercel dashboard
- [ ] Found GreenScape Lux project
- [ ] Navigated to Settings → Environment Variables
- [ ] Added `VITE_STRIPE_PUBLISHABLE_KEY` with correct value
- [ ] Set environment to "Production"
- [ ] Saved environment variable
- [ ] Triggered redeploy
- [ ] Waited for deployment completion

### ✅ PHASE 2 CHECKLIST - SUPABASE:
- [ ] Accessed Stripe Dashboard (live mode)
- [ ] Copied secret key (sk_live_...)
- [ ] Created webhook endpoint with correct URL
- [ ] Selected required webhook events
- [ ] Copied webhook secret (whsec_...)
- [ ] Accessed Supabase secrets dashboard
- [ ] Added STRIPE_SECRET_KEY secret
- [ ] Added STRIPE_WEBHOOK_SECRET secret
- [ ] Verified both secrets are saved

### ✅ PHASE 3 CHECKLIST - CODE:
- [ ] Located StripePaymentMethodManager.tsx file
- [ ] Checked current fallback key on line 12
- [ ] Updated to correct key if needed
- [ ] Committed and pushed changes (if made)

### ✅ PHASE 4 CHECKLIST - TESTING:
- [ ] Verified environment variable in browser console
- [ ] Tested payment method addition
- [ ] Confirmed no "Invalid API Key" errors
- [ ] Sent test webhook from Stripe
- [ ] Verified webhook processing in Supabase logs
- [ ] Confirmed end-to-end payment flow works

## 🚨 CRITICAL SUCCESS METRICS

### After Completion, You Should See:
1. **Browser Console**: Correct publishable key displayed
2. **Payment Forms**: Load without API key errors
3. **Stripe Dashboard**: API calls from your domain
4. **Supabase Logs**: Successful webhook processing
5. **User Experience**: Payment methods can be added successfully

## ⚠️ FAILURE POINTS & SOLUTIONS

### If Vercel Environment Variable Doesn't Work:
- Clear browser cache completely
- Try incognito/private browsing mode
- Verify deployment completed successfully
- Check deployment logs for build errors

### If Supabase Secrets Don't Work:
- Verify exact secret names (case sensitive)
- Check for extra spaces in secret values
- Ensure Supabase project is active
- Review edge function deployment status

### If Webhooks Fail:
- Verify webhook URL is exactly correct
- Check webhook endpoint is "Active" in Stripe
- Review Supabase function logs for errors
- Test webhook endpoint accessibility

## 🎯 PRIORITY ORDER (IF TIME LIMITED)

### Must Do (Critical):
1. ✅ Add VITE_STRIPE_PUBLISHABLE_KEY to Vercel
2. ✅ Redeploy application
3. ✅ Add STRIPE_SECRET_KEY to Supabase

### Should Do (High):
4. ✅ Add STRIPE_WEBHOOK_SECRET to Supabase
5. ✅ Create webhook endpoint in Stripe

### Nice to Do (Medium):
6. ✅ Fix hardcoded fallback key
7. ✅ Test end-to-end payment flow

## 📞 EMERGENCY SUPPORT

### If You Get Stuck:
1. **Check Error Messages**: Browser console and Supabase logs
2. **Verify Keys**: Ensure no typos or extra characters
3. **Test Incrementally**: Complete one phase before moving to next
4. **Document Issues**: Note exact error messages for troubleshooting

### Common Error Messages:
- "Invalid API Key provided" = Vercel env var issue
- "Authentication failed" = Supabase secrets issue
- "Webhook endpoint not found" = URL configuration issue

---

**⏰ TOTAL TIME**: 20-30 minutes
**🎯 PRIORITY**: CRITICAL - Execute immediately
**📋 DEPENDENCIES**: Stripe account access + Supabase admin access
**🚀 OUTCOME**: Fully functional payment system