# 🔧 VERCEL STRIPE ENVIRONMENT SETUP GUIDE
*Step-by-Step Instructions for Production Deployment*

## 🎯 OVERVIEW
This guide walks you through setting up the missing `VITE_STRIPE_PUBLISHABLE_KEY` environment variable in Vercel production environment to fix the current payment system issues.

## 🚨 CURRENT ISSUE
- **Problem**: `VITE_STRIPE_PUBLISHABLE_KEY` is not set in Vercel production environment
- **Impact**: Frontend falls back to incorrect hardcoded key, causing "Invalid API Key" errors
- **Status**: CRITICAL - Payments completely broken

## 📋 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Access Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Sign in to your Vercel account
3. Find and click on your GreenScape Lux project

### STEP 2: Navigate to Environment Variables
1. Click on your project name to enter project dashboard
2. Click on "Settings" tab in the top navigation
3. Click on "Environment Variables" in the left sidebar

### STEP 3: Add Missing Environment Variable
1. Click the "Add New" button
2. Fill in the form:
   - **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - **Environment**: Select "Production" (and "Preview" if you want)
3. Click "Save"

### STEP 4: Redeploy Application
**Option A - From Vercel Dashboard:**
1. Go to "Deployments" tab
2. Find the most recent deployment
3. Click the three dots (•••) menu
4. Click "Redeploy"
5. Confirm the redeploy

**Option B - Trigger from Git:**
1. Make any small commit to your repository
2. Push to your main branch
3. Vercel will automatically redeploy

### STEP 5: Verify Deployment
1. Wait for deployment to complete (usually 2-3 minutes)
2. Visit your production site
3. Open browser developer tools (F12)
4. Go to Console tab
5. Type: `console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);`
6. Should output: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`

## 🧪 TESTING PAYMENT FUNCTIONALITY

### Test Payment Method Addition:
1. Go to your production site
2. Log in as a client
3. Navigate to payment methods or billing section
4. Try to add a new payment method
5. Should complete without "Invalid API Key provided" errors

### Expected Success Indicators:
- ✅ No console errors about invalid API keys
- ✅ Payment method form loads properly
- ✅ Card input fields are interactive
- ✅ Payment method saves successfully

## 🔍 TROUBLESHOOTING

### If Environment Variable Doesn't Show:
- Refresh the Vercel dashboard page
- Check that you selected the correct project
- Verify you have admin access to the project

### If Redeploy Doesn't Work:
- Try Option B (git commit) instead
- Check deployment logs for any errors
- Ensure the environment variable was saved correctly

### If Payment Still Fails:
- Clear browser cache and cookies
- Check browser console for specific error messages
- Verify the key value was copied exactly (no extra spaces)

## 📊 VERIFICATION CHECKLIST

### ✅ Environment Variable Setup:
- [ ] Logged into Vercel dashboard
- [ ] Found correct project
- [ ] Added `VITE_STRIPE_PUBLISHABLE_KEY` environment variable
- [ ] Set value to correct publishable key
- [ ] Selected "Production" environment
- [ ] Saved the variable

### ✅ Deployment:
- [ ] Triggered redeploy from Vercel dashboard OR git commit
- [ ] Waited for deployment to complete
- [ ] Verified new deployment is live

### ✅ Testing:
- [ ] Checked browser console shows correct key value
- [ ] Tested payment method addition functionality
- [ ] Confirmed no "Invalid API Key" errors
- [ ] Verified Stripe elements load properly

## 🚀 NEXT STEPS

After completing this guide, you should also:

1. **Complete Supabase Configuration**:
   - Add `STRIPE_SECRET_KEY` to Supabase secrets
   - Add `STRIPE_WEBHOOK_SECRET` to Supabase secrets

2. **Fix Hardcoded Fallback Key**:
   - Update `src/components/client/StripePaymentMethodManager.tsx` if needed

3. **Test End-to-End Payment Flow**:
   - Add payment method
   - Process test payment
   - Verify webhook handling

## 📞 SUPPORT

If you encounter issues:
1. Double-check the key value is exactly: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
2. Ensure no extra spaces or characters were added
3. Verify you're looking at the production environment, not preview/development
4. Check Vercel deployment logs for any build errors

---

**⏰ ESTIMATED TIME**: 5-10 minutes
**🎯 PRIORITY**: CRITICAL - Complete immediately to restore payments