# 🚨 STRIPE KEYS MISSING - EMERGENCY FIX GUIDE

## DIAGNOSTIC RESULTS SUMMARY
**Issue**: All three Stripe keys are missing from the runtime environment
**Root Cause**: Environment variables not loaded despite being set in Vercel dashboard
**Failed Step**: Step 2 in deployment checklist (Environment Variable Configuration)

## 🔥 IMMEDIATE ACTIONS REQUIRED

### 1. VERIFY VERCEL ENVIRONMENT VARIABLES
```bash
# Check if variables exist in Vercel:
vercel env ls

# Expected output should show:
# VITE_STRIPE_PUBLISHABLE_KEY (Production)
# STRIPE_SECRET_KEY (Production) 
# STRIPE_WEBHOOK_SECRET (Production)
```

### 2. ADD MISSING VARIABLES TO VERCEL
```bash
# Add publishable key:
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
# When prompted, enter: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK

# Add secret key:
vercel env add STRIPE_SECRET_KEY
# When prompted, enter your actual sk_live_ key from Stripe Dashboard

# Add webhook secret:
vercel env add STRIPE_WEBHOOK_SECRET  
# When prompted, enter your actual whsec_ secret from Stripe Dashboard
```

### 3. CONFIGURE SUPABASE VAULT
```bash
# Set backend secrets:
supabase secrets set STRIPE_SECRET_KEY=sk_live_[YOUR_ACTUAL_KEY]
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_SECRET]

# Verify secrets were set:
supabase secrets list
```

### 4. FORCE REDEPLOY
```bash
# Force redeploy to load new environment variables:
vercel --prod --force

# Wait for deployment to complete, then verify:
curl https://your-app.vercel.app/api/health
```

### 5. VALIDATE CONFIGURATION
```bash
# Run diagnostic again:
node scripts/stripe-validation-diagnostic.js

# Expected output should show:
# ✅ VITE_STRIPE_PUBLISHABLE_KEY: pk_live_...
# ✅ STRIPE_SECRET_KEY: sk_live_...  
# ✅ STRIPE_WEBHOOK_SECRET: whsec_...
```

## 🔍 TROUBLESHOOTING COMMON ISSUES

### Issue: "vercel env add" fails
**Solution**: Login to Vercel first: `vercel login`

### Issue: Environment variables still missing after redeploy
**Solution**: 
1. Check variable scope is set to "Production"
2. Clear deployment cache: `vercel --prod --force`
3. Wait 2-3 minutes for propagation

### Issue: Supabase secrets not accessible
**Solution**:
1. Login: `supabase login`
2. Link project: `supabase link --project-ref [YOUR_PROJECT_ID]`
3. Retry setting secrets

### Issue: Keys are test mode instead of live mode
**Solution**:
1. Go to Stripe Dashboard
2. Toggle to "Live" mode (top left)
3. Copy keys from live mode
4. Update environment variables

## ✅ SUCCESS VERIFICATION

After completing the fix, verify success:

1. **Environment Check**: `vercel env ls` shows all three variables
2. **Diagnostic Pass**: `node scripts/stripe-validation-diagnostic.js` shows no errors
3. **API Test**: `node scripts/stripe-production-validation-suite.js` passes
4. **Frontend Test**: Payment forms load without console errors
5. **Backend Test**: Webhook endpoints respond correctly

## 📋 COMPLETION CHECKLIST

- [ ] Verified Vercel environment variables exist
- [ ] Added missing variables with correct values
- [ ] Configured Supabase Vault with backend secrets
- [ ] Forced redeploy completed successfully
- [ ] Diagnostic script shows all keys present
- [ ] Validation suite passes all tests
- [ ] Payment functionality works in production

## 🎯 NEXT STEPS

1. Update `STRIPE_PRODUCTION_DEPLOYMENT_STATUS.md` with success status
2. Run full audit checklist in `STRIPE_PRODUCTION_AUDIT_CHECKLIST.md`
3. Monitor Stripe Dashboard for successful transactions
4. Document any additional issues encountered

---
**Emergency Status**: ACTIONABLE FIX IDENTIFIED
**Estimated Fix Time**: 15-20 minutes
**Next Action**: Execute steps 1-5 above in sequence