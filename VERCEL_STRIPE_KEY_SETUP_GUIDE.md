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