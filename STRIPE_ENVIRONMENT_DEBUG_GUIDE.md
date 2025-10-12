# Stripe Environment Variable Debug Guide

## Current Issue
Getting "Missing value for Stripe(): apiKey should be a string" error, indicating VITE_STRIPE_PUBLISHABLE_KEY is not properly set in the Vercel production environment.

## Debug Steps Applied

### 1. Added Comprehensive Logging
Updated `src/lib/stripe.ts` with debug logging to show:
- Environment mode (NODE_ENV)
- Whether VITE_STRIPE_PUBLISHABLE_KEY is SET or MISSING
- The actual key value (for debugging)

### 2. Enhanced Validation
- Checks for undefined, null, or string "undefined"
- Validates key format (must start with 'pk_')
- Throws clear error messages

### 3. Centralized Stripe Configuration
- Updated StripePaymentMethodManager to use centralized getStripe() function
- Ensures all components use the same validation logic

## What to Check Next

### 1. Browser Console
Open browser dev tools and look for the debug output:
```
Environment check: {
  NODE_ENV: "production",
  VITE_STRIPE_PUBLISHABLE_KEY: "MISSING" or "SET",
  actualKey: undefined or "pk_live_..."
}
```

### 2. Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `VITE_STRIPE_PUBLISHABLE_KEY` exists for Production environment
3. The value should start with `pk_live_` for production

### 3. Redeploy After Adding Variable
After adding the environment variable in Vercel:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger deployment

## Expected Behavior
- If key is missing: Clear error message about missing VITE_STRIPE_PUBLISHABLE_KEY
- If key is invalid format: Error about invalid key format
- If key is valid: Stripe should initialize successfully

## Manual Steps Required
1. Add VITE_STRIPE_PUBLISHABLE_KEY to Vercel production environment
2. Set value to your live Stripe publishable key (pk_live_...)
3. Redeploy the application
4. Check browser console for debug output