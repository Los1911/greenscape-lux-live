# Vercel Production Deployment - Stripe Key Update

## 🎯 Quick Action Required

Your Stripe public key is showing as "UNDEFINED" in production because the environment variable needs to be updated in Vercel.

---

## ⚡ FASTEST METHOD: Vercel Dashboard (5 minutes)

### Step 1: Login to Vercel
Go to: https://vercel.com/dashboard

### Step 2: Select Your Project
Click on: **GreenScape Lux** (or your project name)

### Step 3: Update Environment Variables
1. Click: **Settings** (top navigation)
2. Click: **Environment Variables** (left sidebar)
3. **Delete old variable** (if exists):
   - Find: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Click: 🗑️ (trash icon)
   - Confirm deletion
4. **Add new variable**:
   - Click: **Add New** button
   - **Name**: `VITE_STRIPE_PUBLIC_KEY`
   - **Value**: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - **Environments**: Check ✅ **Production**
   - Click: **Save**

### Step 4: Redeploy
1. Click: **Deployments** (top navigation)
2. Find: Latest deployment (top of list)
3. Click: **⋯** (three dots menu)
4. Click: **Redeploy**
5. Confirm: Click **Redeploy** button
6. Wait: ~2-3 minutes for deployment to complete

### Step 5: Verify
1. Open: Your production URL (e.g., greenscape-lux.vercel.app)
2. Press: **F12** (open DevTools)
3. Go to: **Console** tab
4. Look for:
   ```
   VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx...
   ```
5. ✅ If you see the key → SUCCESS!
6. ❌ If still "UNDEFINED" → Hard refresh (Ctrl+Shift+R)

---

## 🤖 AUTOMATED METHOD: GitHub Actions

### Prerequisites
- GitHub repository connected to Vercel
- Vercel token (get from: https://vercel.com/account/tokens)

### Setup (One-time)
1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click: **New repository secret**
3. **Name**: `VERCEL_TOKEN`
4. **Value**: [Paste your Vercel token]
5. Click: **Add secret**

### Execute
1. Go to: **Actions** tab in GitHub
2. Select: **Update Vercel Stripe Key and Deploy**
3. Click: **Run workflow** dropdown
4. Verify: Stripe key is correct
5. Click: **Run workflow** button
6. Wait: ~3-5 minutes
7. Check: Deployment status (should show ✅)

---

## 📝 What This Does

### Before (Broken)
```
Code expects: VITE_STRIPE_PUBLIC_KEY
Vercel has:   VITE_STRIPE_PUBLISHABLE_KEY ❌ (wrong name)
Result:       "UNDEFINED" error
```

### After (Fixed)
```
Code expects: VITE_STRIPE_PUBLIC_KEY
Vercel has:   VITE_STRIPE_PUBLIC_KEY ✅ (correct name)
Result:       pk_live_51S1Ht0K6kWkUsx... (working!)
```

---

## 🔍 Verification Checklist

After deployment:
- [ ] Open production site
- [ ] Open DevTools Console (F12)
- [ ] See Stripe key logged (not "UNDEFINED")
- [ ] No "Invalid API key" errors
- [ ] Payment forms load correctly
- [ ] Can navigate to payment pages

---

## ⚠️ Important Notes

1. **Environment**: Make sure to select **Production** when adding the variable
2. **Redeploy Required**: Changes only take effect after redeployment
3. **Cache**: May need to wait 2-3 minutes for CDN cache to clear
4. **Browser Cache**: Hard refresh (Ctrl+Shift+R) if still seeing old value

---

## 🆘 Troubleshooting

**Issue**: Still seeing "UNDEFINED" after deployment
**Solution**: 
1. Verify variable name is exactly: `VITE_STRIPE_PUBLIC_KEY`
2. Verify it's enabled for Production environment
3. Clear browser cache completely
4. Try incognito/private browsing mode

**Issue**: Deployment fails
**Solution**: Check Vercel deployment logs for specific error

**Issue**: Can't find project in Vercel
**Solution**: Verify you're logged into correct Vercel account

---

## ✅ Success Confirmation

You'll know it's working when:
1. Console shows: `VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx...`
2. No Stripe-related errors in console
3. Payment pages load without issues
4. Stripe Elements render correctly

---

**Need Help?** Check the deployment logs in Vercel dashboard for detailed error messages.
