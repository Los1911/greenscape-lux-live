<<<<<<< HEAD
# Vercel Stripe Key Setup Guide

## Critical Issue
The Stripe public key is showing as "UNDEFINED" in production because the environment variable is not set in Vercel.

## Immediate Action Required

### Step 1: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your GreenScape Lux project
3. Navigate to **Settings** → **Environment Variables**
4. Add or update the following variable:

```
Name: VITE_STRIPE_PUBLIC_KEY
Value: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
Environment: Production, Preview, Development (select all)
```

5. Click **Save**

### Step 2: Redeploy the Application

**Option A: Trigger Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Choose **Use existing Build Cache** (optional)
5. Click **Redeploy**

**Option B: Trigger Redeploy from Git**
```bash
git commit --allow-empty -m "Trigger Vercel redeploy for Stripe key"
git push origin main
```

### Step 3: Verify Stripe Key in Production

1. Wait for deployment to complete (2-3 minutes)
2. Visit https://greenscapelux.com
3. Open browser DevTools (F12)
4. Go to **Console** tab
5. Look for environment variable logs
6. Verify `VITE_STRIPE_PUBLIC_KEY` shows: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`

### Step 4: Test Stripe Integration

1. Navigate to any page with Stripe integration (payment forms, checkout)
2. Verify Stripe.js loads without errors
3. Check console for any Stripe-related errors
4. Test payment method addition (use test card if in test mode)

## GitHub Pages Alternative

If using GitHub Pages instead of Vercel:

### Update GitHub Secrets

1. Go to https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Click **New repository secret**
3. Add:
```
Name: VITE_STRIPE_PUBLIC_KEY
Value: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
```

### Update GitHub Actions Workflow

The workflow file `.github/workflows/github-pages-deploy.yml` already includes:

```yaml
env:
  VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}
```

### Trigger Deployment

```bash
git commit --allow-empty -m "Trigger GitHub Pages redeploy for Stripe key"
git push origin main
```

## Verification Checklist

- [ ] Environment variable added to Vercel/GitHub
- [ ] Application redeployed
- [ ] Browser console shows correct Stripe key
- [ ] No "UNDEFINED" errors in console
- [ ] Stripe.js loads successfully
- [ ] Payment forms render correctly
- [ ] No API key errors in Network tab

## Troubleshooting

### Issue: Still showing "UNDEFINED" after redeploy

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito/private browsing mode
4. Verify deployment timestamp matches recent deploy

### Issue: Stripe.js fails to load

**Solution:**
1. Check browser console for specific error messages
2. Verify the key starts with `pk_live_` or `pk_test_`
3. Confirm no extra spaces in the environment variable value
4. Check Network tab for failed Stripe API requests

### Issue: Environment variable not available at build time

**Solution:**
1. Ensure variable name starts with `VITE_`
2. Restart Vite dev server if testing locally
3. Verify Vercel has the variable in all environments (Production, Preview, Development)

## Expected Console Output

After successful deployment, you should see:

```
[Config] Stripe Public Key: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
[Stripe] Initialized successfully
```

## Next Steps After Verification

1. Test complete payment flow end-to-end
2. Verify Stripe Connect onboarding for landscapers
3. Test payment method management
4. Confirm webhook endpoints are receiving events
5. Monitor Stripe Dashboard for successful transactions

## Support Resources

- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- GitHub Actions Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Stripe API Keys: https://dashboard.stripe.com/apikeys
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html

---

**Status:** Ready for deployment
**Priority:** CRITICAL
**Estimated Time:** 5-10 minutes
=======
# VERCEL STRIPE KEY SETUP - IMMEDIATE FIX

## CRITICAL ISSUE
`VITE_STRIPE_PUBLISHABLE_KEY` is missing from Vercel environment variables, causing Stripe initialization to fail.

## IMMEDIATE SOLUTION

### Step 1: Add Environment Variable to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Set:
   - **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - **Environment**: Production (and Preview if needed)

### Step 2: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger deployment

## ALTERNATIVE QUICK FIX
If you can't access Vercel dashboard immediately, add a temporary fallback in the code:

```typescript
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK';
```

## VERIFICATION
After deployment, check browser console for:
```
Environment check: {
  NODE_ENV: "production",
  VITE_STRIPE_PUBLISHABLE_KEY: "SET",
  actualKey: "pk_live_..."
}
```
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
