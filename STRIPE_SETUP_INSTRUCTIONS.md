# 🔧 Stripe Setup Instructions for GreenScape Lux

## Current Status
✅ **Security Fix Applied**: All hardcoded Stripe keys have been removed from the codebase.
✅ **Non-Blocking Configuration**: The app will now render even if Stripe is not configured.
⚠️ **Action Required**: You need to configure your Stripe API keys to enable payment features.

---

## 🚨 Why You're Seeing a Black Screen

If you're seeing a black screen, it's because the `VITE_STRIPE_PUBLISHABLE_KEY` environment variable is not properly configured. 

**The fix I just applied allows the app to render without Stripe**, but you need to set up your environment variables.

---

## 🛠️ Local Development Setup

### Step 1: Get Your Stripe Test Key
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. **Never use live keys (pk_live_) in development!**

### Step 2: Configure .env.local
1. Open the `.env.local` file in the root of your project
2. Replace this line:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_ACTUAL_STRIPE_TEST_KEY
   ```
   With your actual Stripe test key:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Restart Your Dev Server
```bash
npm run dev
```

The landing page should now load successfully! 🎉

---

## 🌐 Production Deployment Setup

### For Vercel:
1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Add the following variable:
   - **Key**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: Your Stripe **LIVE** publishable key (pk_live_...)
   - **Environments**: Production, Preview, Development
5. **Redeploy** your application

### For Netlify:
1. Go to your Netlify Dashboard
2. Select your site
3. Navigate to **Site settings → Build & deploy → Environment**
4. Add the following variable:
   - **Key**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: Your Stripe **LIVE** publishable key (pk_live_...)
5. **Trigger a new deploy**

---

## 🔍 Verifying Stripe Configuration

### Check Console Logs
When the app loads, check the browser console for:

✅ **Properly Configured**:
```
[STRIPE_CONFIG] Stripe key present: true
[STRIPE_CONFIG] Stripe initialized in test mode
```

❌ **Not Configured**:
```
[STRIPE_CONFIG] WARNING: VITE_STRIPE_PUBLISHABLE_KEY is missing
[STRIPE_CONFIG] Stripe NOT configured - payment features will be disabled
```

### Test Payment Features
1. Navigate to Client Dashboard
2. Try to add a payment method
3. Click "Open Stripe Billing Portal"
4. You should be redirected to Stripe's hosted payment page

---

## 🔐 Security Best Practices

### ✅ DO:
- Use `pk_test_` keys for development and testing
- Use `pk_live_` keys only in production
- Store keys in environment variables
- Use Stripe Billing Portal for payment management
- Keep `.env.local` in `.gitignore`

### ❌ DON'T:
- Commit API keys to version control
- Use live keys in development
- Hardcode keys in source code
- Share keys publicly
- Display keys in the UI

---

## 📋 Current Environment Files

### .env.local (Local Development)
- Used for local development only
- Gitignored - never committed
- Should contain your Stripe TEST key

### .env.production (Production Template)
- Template file committed to repo
- Uses placeholder: `${VITE_STRIPE_PUBLISHABLE_KEY}`
- Actual value comes from deployment platform

### .env.example (Documentation)
- Example file showing required variables
- Uses placeholders only
- Safe to commit to repo

---

## 🐛 Troubleshooting

### Black Screen on Landing Page
**Cause**: Stripe key not configured or invalid format
**Solution**: 
1. Check that `.env.local` exists with valid Stripe key
2. Restart dev server
3. Check browser console for `[STRIPE_CONFIG]` messages

### "Stripe NOT configured" Warning
**Cause**: Missing or invalid `VITE_STRIPE_PUBLISHABLE_KEY`
**Solution**: Follow the setup steps above to add your Stripe key

### Payment Features Not Working
**Cause**: Stripe key not configured
**Solution**: Configure your Stripe key following the steps above

### Build Fails with "pk_live" or "sk_live" Error
**Cause**: Security guard script detected exposed keys
**Solution**: Remove any hardcoded keys from source code

---

## 📞 Support

If you continue to experience issues:
1. Check the browser console for error messages
2. Verify your Stripe key format (should start with `pk_test_` or `pk_live_`)
3. Ensure you've restarted your dev server after changing `.env.local`
4. Check that your Stripe account is active

---

## ✅ Checklist

- [ ] Created/updated `.env.local` with Stripe test key
- [ ] Restarted dev server
- [ ] Verified landing page loads
- [ ] Checked console for `[STRIPE_CONFIG]` success message
- [ ] Tested payment features (if needed)
- [ ] Configured production environment variables (for deployment)

---

**Last Updated**: After Phase 1-3 Security Repair Implementation
**Status**: ✅ All hardcoded keys removed, non-blocking configuration implemented
