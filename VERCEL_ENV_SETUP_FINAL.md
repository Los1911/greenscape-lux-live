# Vercel Environment Variables Setup - Final Configuration

## 🎯 Critical: Configure These Variables in Vercel Dashboard

### Required Steps

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `greenscape-lux`
   - Click: **Settings** → **Environment Variables**

2. **Add Each Variable Below**
   - Click "Add New" for each variable
   - Select **ALL environments**: Production, Preview, Development
   - Click "Save" after each one

## 📋 Environment Variables to Add

### 1. Supabase Configuration

```
Variable Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variable Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variable Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. Stripe Configuration

```
Variable Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... (or pk_test_... for testing)
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variable Name: STRIPE_SECRET_KEY
Value: sk_live_... (or sk_test_... for testing)
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variable Name: STRIPE_WEBHOOK_SECRET
Value: whsec_...
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3. Email Configuration

```
Variable Name: RESEND_API_KEY
Value: re_...
Environments: ✅ Production ✅ Preview ✅ Development
```

### 4. Slack Notifications (Optional but Recommended)

```
Variable Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T.../B.../...
Environments: ✅ Production ✅ Preview ✅ Development
```

### 5. Optional Services

```
Variable Name: GOOGLE_MAPS_API_KEY
Value: AIza...
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variable Name: OPENAI_API_KEY
Value: sk-...
Environments: ✅ Production ✅ Preview ✅ Development
```

## 🚀 After Adding Variables

### 1. Redeploy with Cache Disabled

```bash
# Option A: Via Vercel CLI
vercel --prod --force

# Option B: Via Git
git commit --allow-empty -m "Trigger rebuild with new env vars"
git push origin main
```

### 2. Verify in Browser Console

After deployment completes, open your site and check console:

```javascript
// Should show actual values, not undefined
console.log("Vercel env check:", {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  anonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  stripeKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
});
```

**Expected Output:**
```
Vercel env check: {
  supabaseUrl: "https://your-project.supabase.co",
  anonKey: true,
  stripeKey: true
}
```

### 3. Check Build Logs

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check "Build Logs" for validation output:

```
🔍 Validating environment variables...

✅ VITE_SUPABASE_URL is set
✅ VITE_SUPABASE_ANON_KEY is set
✅ VITE_STRIPE_PUBLISHABLE_KEY is set
✅ SUPABASE_SERVICE_ROLE_KEY is set
✅ STRIPE_SECRET_KEY is set
✅ STRIPE_WEBHOOK_SECRET is set
✅ RESEND_API_KEY is set

✅ All critical environment variables are configured!
```

## 🔒 Security Best Practices

### ✅ DO:
- Use Vercel Dashboard for all environment variables
- Set variables for ALL environments (Production, Preview, Development)
- Use `VITE_` prefix for frontend-accessible variables
- Keep service role keys and secrets without `VITE_` prefix
- Rotate secrets regularly

### ❌ DON'T:
- Commit `.env` or `.env.local` files to Git
- Use `.env.local` for production (it's gitignored)
- Share API keys in Slack or email
- Use test keys in production
- Hardcode secrets in code

## 🐛 Troubleshooting

### Issue: Variables Still Undefined After Adding

**Solution:**
1. Clear Vercel cache: `vercel --prod --force`
2. Check variable names match exactly (case-sensitive)
3. Verify all environments are selected
4. Wait 2-3 minutes for propagation
5. Hard refresh browser (Ctrl+Shift+R)

### Issue: Build Fails with "Missing Critical Variables"

**Solution:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Verify these 3 are present:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
3. Click "Redeploy" in Vercel Dashboard

### Issue: Slack Notifications Not Working

**Solution:**
1. Test webhook: `curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"test"}'`
2. Verify `SLACK_WEBHOOK_URL` is set in Vercel
3. Check Slack app permissions
4. Regenerate webhook if needed

## 📊 Verification Checklist

- [ ] All 8 environment variables added to Vercel Dashboard
- [ ] All environments selected (Production, Preview, Development)
- [ ] Deployment triggered after adding variables
- [ ] Build logs show "✅ All critical environment variables are configured!"
- [ ] Browser console shows actual values (not undefined)
- [ ] Slack notification received (if configured)
- [ ] Application loads without fallback warnings
- [ ] Authentication works (Supabase connected)
- [ ] Payments work (Stripe connected)

## 🎉 Success Indicators

When properly configured, you'll see:

1. **Build Logs:**
   ```
   ✅ All critical environment variables are configured!
   ```

2. **Browser Console:**
   ```
   Vercel env check: {
     supabaseUrl: "https://your-project.supabase.co",
     anonKey: true,
     stripeKey: true
   }
   ```

3. **Slack Notification:**
   ```
   ✅ Environment Variables Valid
   Present: 8/8
   Missing: 0/8
   ```

4. **No Fallback Warnings:**
   - No "Using fallback configuration" messages
   - No "Environment variable undefined" errors

## 📞 Need Help?

If you're still seeing issues:

1. Check build logs in Vercel Dashboard
2. Review browser console for errors
3. Verify Supabase project URL is correct
4. Test Stripe keys in Stripe Dashboard
5. Ensure webhook secrets are up to date

## 🔗 Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Slack API Dashboard](https://api.slack.com/apps)
