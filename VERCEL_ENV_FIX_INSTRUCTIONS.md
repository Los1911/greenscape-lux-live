# Vercel Environment Variable Fix Instructions

## 🎯 Goal
Configure Vercel to inject `VITE_*` environment variables at build time so your app stops using hardcoded fallbacks.

---

## Step 1: Check Browser Console After Next Deployment

After deploying the updated code, open your production site and check the browser console. You should see:

```
🔍 Vercel Environment Variables Debug
Build Mode: production
Is Production: true
Is Development: false

📦 Environment Variables (injected at build time):
VITE_SUPABASE_URL: ❌ UNDEFINED
VITE_SUPABASE_ANON_KEY: ❌ UNDEFINED
VITE_STRIPE_PUBLISHABLE_KEY: ❌ UNDEFINED
VITE_GOOGLE_MAPS_API_KEY: ❌ UNDEFINED

💡 If all show ❌ UNDEFINED, environment variables are NOT configured in Vercel Dashboard
📝 Action Required: Add VITE_* variables to Vercel → Settings → Environment Variables
```

**If you see ❌ UNDEFINED**, proceed to Step 2.

---

## Step 2: Configure Vercel Dashboard

### 2.1 Navigate to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (GreenScape Lux)
3. Click **Settings** → **Environment Variables**

### 2.2 Add Required Variables

Add these variables with **Production**, **Preview**, and **Development** checked:

| Variable Name | Value | Source |
|---------------|-------|--------|
| `VITE_SUPABASE_URL` | `https://mwvcbedvnimabfwubazz.supabase.co` | From `.env.example` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | From `.env.example` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85...` | From `.env.example` |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4` | From `.env.example` |

### 2.3 Important Settings
- ✅ Check **Production**
- ✅ Check **Preview** 
- ✅ Check **Development**
- ⚠️ **DO NOT** check "Encrypted" (Vite can't access encrypted vars at build time)

---

## Step 3: Redeploy

### Option A: Trigger Redeploy from Vercel Dashboard
1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** = OFF (important!)

### Option B: Trigger Redeploy from Git
```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

---

## Step 4: Verify After Deployment

Open your production site and check the browser console again:

```
🔍 Vercel Environment Variables Debug
Build Mode: production
Is Production: true

📦 Environment Variables (injected at build time):
VITE_SUPABASE_URL: https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY: ✅ SET (eyJhbGciOiJIUzI1NiIs...)
VITE_STRIPE_PUBLISHABLE_KEY: ✅ SET (pk_live_51S1Ht0K6kWk...)
VITE_GOOGLE_MAPS_API_KEY: ✅ SET

✅ Using standard environment configuration
```

**Success!** Your app is now using Vercel env vars instead of hardcoded fallbacks.

---

## Step 5: (Optional) Remove Hardcoded Fallbacks

Once you confirm Vercel env vars are working, you can remove the hardcoded fallbacks:

### Option A: Delete Fallback System Entirely
```bash
# Remove the fallback file
rm src/lib/environmentFallback.ts

# Update config to use strict validation
# Replace imports in src/lib/config.ts
```

### Option B: Use Strict Config
```typescript
// In files that import config, switch to:
import { strictConfig } from '@/lib/configStrict';
// Instead of:
import { config } from '@/lib/config';
```

---

## Troubleshooting

### Issue: Variables still show as undefined after redeploying

**Solution:**
1. Clear Vercel build cache: Redeploy with "Use existing Build Cache" = OFF
2. Verify variables are added to **Production** environment in Vercel Dashboard
3. Check that variable names start with `VITE_` (required for Vite)

### Issue: Variables work in Preview but not Production

**Solution:**
1. Ensure variables are checked for **Production** environment
2. Redeploy from **main** branch (not preview branch)

### Issue: Build fails with "Missing environment variables"

**Solution:**
1. This means pre-build validation is working correctly
2. Add missing variables to Vercel Dashboard
3. Redeploy

---

## Next Steps

After confirming Vercel env vars are working:

1. **Enable Strict Validation**: Switch to `configStrict.ts` to remove fallbacks
2. **Set Up Automated Sync**: Use `npm run sync:env` to validate Vercel env vars match `.env.example`
3. **Configure Slack Notifications**: Get alerts when env vars are missing or mismatched

---

## Reference

- **Vercel Docs**: https://vercel.com/docs/projects/environment-variables
- **Vite Docs**: https://vitejs.dev/guide/env-and-mode.html
- **Your Pre-Build Validator**: `scripts/validate-env-build.js`
- **Your Env Sync Script**: `scripts/vercel-env-sync.js`
