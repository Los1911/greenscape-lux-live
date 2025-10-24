# 🚨 NUCLEAR CACHE PURGE - EXECUTION PLAN

## Problem Statement
The quote form at https://www.greenscapelux.com/get-quote is serving **stale cached JavaScript**. Despite multiple deployments, the console logs added to ClientQuoteForm.tsx are not appearing, indicating the browser is loading old bundled code from CDN cache.

## Root Cause
Multi-layer caching is preventing new code from reaching users:
1. **Vercel Edge CDN** - Caching JS bundles globally
2. **Browser Cache** - Storing old assets locally  
3. **Service Workers** - May be caching app shell
4. **Build Cache** - Vercel may be reusing old build artifacts

## Solution: Force Cache-Busted Deployment

---

## 📋 EXECUTION STEPS

### Step 1: Run Deployment Script
```bash
# Navigate to project root
cd /path/to/greenscape-lux

# Make script executable (first time only)
chmod +x scripts/force-deploy-with-verification.sh

# Execute force deployment
./scripts/force-deploy-with-verification.sh production
```

**What this does:**
- ✅ Gets current git commit hash
- ✅ Creates `/version.json` with commit metadata
- ✅ Updates `<meta name="version">` in index.html
- ✅ Commits version files
- ✅ Deploys to Vercel with `--force` flag
- ✅ Waits for CDN propagation
- ✅ Purges Vercel cache
- ✅ Verifies deployed version matches local

### Step 2: Monitor Deployment
Watch the script output for:
```
🚀 Starting Force Deployment with Cache Busting
================================================
Environment: production
Commit Hash: abc1234
Build ID: abc1234-1234567890
Timestamp: 1234567890

✅ Version file created
✅ Version meta tag updated
✅ Deployment complete
✅ Cache purge complete
✅ SUCCESS: Deployment verified!
```

### Step 3: Verify in Incognito Mode
```bash
# Open incognito/private browsing window
# Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
# Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)

# Visit version endpoint
https://www.greenscapelux.com/version.json

# Expected response:
{
  "commitHash": "abc1234",
  "buildId": "abc1234-1234567890",
  "timestamp": 1234567890,
  "environment": "production",
  "deployedAt": "2025-01-15T10:30:00Z"
}
```

### Step 4: Test Quote Form
1. **Open incognito window** (fresh session, no cache)
2. Navigate to: `https://www.greenscapelux.com/get-quote`
3. **Open DevTools Console** (F12 or Cmd+Option+I)
4. **Look for mount log**: `🏁 ClientQuoteForm component mounted/rendered`
5. **Look for pre-render logs**:
   - `Form bound to handleSubmit: true`
   - `Current loading state: false`
6. **Fill out form** with test data
7. **Click Submit button**
8. **Verify all step logs appear**:
   ```
   🎯 Step 1 — handleSubmit fired
   🎯 Step 2 — Validation passed
   🎯 Step 3 — Preparing data
   🎯 Step 4 — Calling edge function
   🎯 Step 5 — Response received
   🎯 Step 6 — Success handling
   ✅ Quote submitted successfully
   ```

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify each item:

### Version Endpoint
- [ ] `/version.json` returns HTTP 200
- [ ] `commitHash` matches local git commit
- [ ] `timestamp` is recent (within last 5 minutes)
- [ ] `environment` is "production"

### Page Source
- [ ] View page source (Ctrl+U)
- [ ] Find `<meta name="version" content="...">`
- [ ] Verify content matches commitHash

### Console Logs
- [ ] `🏁 ClientQuoteForm component mounted/rendered` appears
- [ ] `Form bound to handleSubmit: true` appears
- [ ] `Current loading state: false` appears
- [ ] All 11 step logs appear on form submit

### Network Tab
- [ ] Open DevTools → Network tab
- [ ] Filter by "Fetch/XHR"
- [ ] Submit form
- [ ] Verify POST request to `unified-email` edge function
- [ ] Check response status (200 = success)

### Email Delivery
- [ ] Check recipient inbox
- [ ] Verify quote notification email received
- [ ] Check admin inbox for notification

---

## 🐛 TROUBLESHOOTING

### Issue: Script fails with "vercel: command not found"
**Solution:**
```bash
npm install -g vercel
vercel login
vercel link
```

### Issue: Version endpoint returns 404
**Solution:**
```bash
# Verify file exists
ls -la public/version.json

# If missing, create it
cat > public/version.json << EOF
{
  "commitHash": "$(git rev-parse --short HEAD)",
  "buildId": "$(git rev-parse --short HEAD)-$(date +%s)",
  "timestamp": $(date +%s),
  "environment": "production",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Commit and redeploy
git add public/version.json
git commit -m "Add version endpoint"
./scripts/force-deploy-with-verification.sh production
```

### Issue: Version matches but logs still don't appear
**Try these steps in order:**

1. **Hard Refresh Browser**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Clear All Browser Cache**
   - Open DevTools (F12)
   - Go to **Application** tab
   - Click **Clear storage**
   - Check all boxes
   - Click **Clear site data**
   - Close and reopen browser

3. **Disable Cache in DevTools**
   - Open DevTools (F12)
   - Go to **Network** tab
   - Check **Disable cache** checkbox
   - Keep DevTools open while testing

4. **Clear Service Workers**
   - Open DevTools (F12)
   - Go to **Application** tab
   - Click **Service Workers**
   - Click **Unregister** for all workers
   - Refresh page

5. **Test in Different Browser**
   - Try Chrome, Firefox, Safari, Edge
   - Use incognito/private mode
   - If works in one browser, it's a cache issue

6. **Wait for CDN Propagation**
   - CDN can take 2-5 minutes to propagate globally
   - Try accessing from different network (mobile data)
   - Check from different geographic location (VPN)

### Issue: Form submits but no email received
**Check these items:**

1. **Console Logs**
   - Verify all 11 steps complete
   - Check for error messages
   - Look for "Email sent successfully" log

2. **Network Tab**
   - Verify POST request to `/unified-email`
   - Check response status code
   - Inspect response body for errors

3. **Supabase Edge Function Logs**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions
   - Select `unified-email` function
   - Check logs for errors

4. **Resend Dashboard**
   - Log in to Resend dashboard
   - Check recent emails
   - Verify email was sent
   - Check for delivery errors

5. **Email Configuration**
   - Verify `RESEND_API_KEY` is set in Supabase secrets
   - Check sender email is verified in Resend
   - Verify recipient email is valid

---

## 📊 EXPECTED OUTCOMES

### ✅ Success Indicators
- Version endpoint returns current commit
- Console shows all diagnostic logs
- Form submission triggers all 11 steps
- POST request appears in Network tab
- Email notification received
- No JavaScript errors in console

### ❌ Failure Indicators
- Version endpoint 404 or returns old commit
- No console logs appear
- Form submission silent failure
- No POST request in Network tab
- JavaScript errors in console
- Email not received

---

## 🎯 POST-DEPLOYMENT MONITORING

### Immediate (0-5 minutes)
- [ ] Test quote form in incognito mode
- [ ] Verify console logs appear
- [ ] Submit test quote
- [ ] Confirm email received

### Short-term (5-30 minutes)
- [ ] Test from different devices
- [ ] Test from different networks
- [ ] Monitor Vercel analytics for errors
- [ ] Check Supabase logs for edge function calls

### Long-term (1-24 hours)
- [ ] Monitor error rates in production
- [ ] Check email delivery success rate
- [ ] Verify no user-reported issues
- [ ] Confirm cache is serving new version

---

## 📞 SUPPORT RESOURCES

### Vercel Dashboard
- URL: https://vercel.com/dashboard
- Check deployment status
- View build logs
- Monitor function invocations

### Supabase Dashboard
- URL: https://supabase.com/dashboard
- Check edge function logs
- Monitor database queries
- Review RLS policies

### Resend Dashboard
- URL: https://resend.com/dashboard
- View sent emails
- Check delivery status
- Monitor API usage

---

## 🚀 NEXT STEPS AFTER SUCCESS

1. **Remove Diagnostic Logs** (optional)
   - Once confirmed working, can remove excessive console.logs
   - Keep critical error logging
   - Maintain production monitoring

2. **Set Up Monitoring**
   - Configure error tracking (Sentry, LogRocket, etc.)
   - Set up uptime monitoring
   - Create alerts for form submission failures

3. **Document for Team**
   - Share deployment process
   - Document troubleshooting steps
   - Create runbook for future deployments

4. **Optimize Caching Strategy**
   - Review cache headers
   - Configure appropriate TTLs
   - Implement cache invalidation strategy

---

## ✅ COMPLETION CRITERIA

Deployment is successful when ALL of these are true:
- ✅ Version endpoint returns current commit hash
- ✅ Console shows "🏁 ClientQuoteForm component mounted/rendered"
- ✅ Form submission logs all 11 steps
- ✅ POST request to unified-email succeeds
- ✅ Email notification received in inbox
- ✅ No JavaScript errors in console
- ✅ Works in incognito mode across browsers
- ✅ Works on mobile devices

---

## 🎉 SUCCESS!

Once all criteria are met, the cache purge is complete and the quote form is fully operational with the latest code deployed.
