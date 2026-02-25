# 🚀 GreenScape Lux - Stripe Live Key Deployment Guide

## Critical Issue Resolved
The Stripe public key was showing as "UNDEFINED" because the environment variable name in code (`VITE_STRIPE_PUBLIC_KEY`) didn't match what was configured in Vercel/GitHub Pages (`VITE_STRIPE_PUBLISHABLE_KEY`).

## ✅ Code Changes Complete
All code has been updated to use: `VITE_STRIPE_PUBLIC_KEY`

---

## 🎯 DEPLOYMENT OPTIONS

### Option 1: Automated Deployment (GitHub Actions) ⭐ RECOMMENDED

1. **Set GitHub Secret (one-time setup)**
   ```bash
   # Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
   # Add secret:
   Name: VERCEL_TOKEN
   Value: [Get from https://vercel.com/account/tokens]
   ```

2. **Run the Workflow**
   - Go to: `Actions` tab in GitHub
   - Select: "Update Vercel Stripe Key and Deploy"
   - Click: "Run workflow"
   - Confirm the Stripe key is correct
   - Click: "Run workflow" button

3. **Wait for completion** (~2-3 minutes)

---

### Option 2: Manual Script Execution

```bash
# 1. Set your Vercel token
export VERCEL_TOKEN="your_vercel_token_here"

# 2. Make script executable
chmod +x scripts/vercel-stripe-production-deployment.sh

# 3. Run the script
./scripts/vercel-stripe-production-deployment.sh
```

---

### Option 3: Manual Vercel Dashboard

1. **Login to Vercel**: https://vercel.com
2. **Select your project**: GreenScape Lux
3. **Go to Settings → Environment Variables**
4. **Delete old variable**:
   - Find: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Click trash icon → Delete
5. **Add new variable**:
   - Name: `VITE_STRIPE_PUBLIC_KEY`
   - Value: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - Environment: Production
   - Click: Save
6. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## 🔍 VERIFICATION

After deployment completes:

1. **Open your production site**
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Look for this log**:
   ```
   🔧 Environment Variables:
   VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx...
   ```

### ✅ Success Indicators
- Stripe key shows `pk_live_51S1Ht0K6kWkUsx...` (not "UNDEFINED")
- No "Invalid API key" errors in console
- Payment forms load without errors

### ❌ If Still Showing "UNDEFINED"
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check Vercel environment variables are saved
4. Verify deployment completed successfully

---

## 📋 Environment Variable Checklist

Ensure ALL these are set in Vercel Production:

- ✅ `VITE_STRIPE_PUBLIC_KEY` = pk_live_51S1Ht0K6kWkUsx...
- ✅ `VITE_SUPABASE_URL` = https://your-project.supabase.co
- ✅ `VITE_SUPABASE_ANON_KEY` = eyJhbGc...
- ✅ `VITE_GOOGLE_MAPS_API_KEY` = AIza...

---

## 🆘 Troubleshooting

**Q: GitHub Actions fails with "VERCEL_TOKEN not found"**
A: Add VERCEL_TOKEN to GitHub Secrets (see Option 1, step 1)

**Q: Script fails with "command not found: vercel"**
A: Install Vercel CLI: `npm install -g vercel@latest`

**Q: Still seeing UNDEFINED after deployment**
A: Wait 2-3 minutes for CDN cache to clear, then hard refresh browser

---

## 📞 Support

If issues persist after following this guide:
1. Check Vercel deployment logs for errors
2. Verify all environment variables in Vercel dashboard
3. Test in incognito/private browsing mode
