# Emergency Cache Clear & Deployment Guide

## 🚨 IMMEDIATE ACTION REQUIRED

The quote form on https://www.greenscapelux.com is serving **stale cached code**. No console logs appear because the browser is loading old JavaScript bundles.

---

## ⚡ QUICK FIX (5 Minutes)

### Step 1: Run Deployment Script
```bash
# Make executable (first time only)
chmod +x scripts/force-deploy-with-verification.sh

# Deploy to production with cache busting
./scripts/force-deploy-with-verification.sh production
```

### Step 2: Wait for Propagation
The script will:
- ✅ Create version.json with current commit hash
- ✅ Update index.html with version meta tag
- ✅ Force deploy to Vercel
- ✅ Purge CDN cache
- ✅ Verify deployment matches local code

### Step 3: Test in Incognito
```
1. Open Chrome/Firefox Incognito window
2. Visit: https://www.greenscapelux.com/version.json
3. Verify commitHash matches your local git commit
4. Visit: https://www.greenscapelux.com/get-quote
5. Open Console (F12)
6. Look for: "🏁 ClientQuoteForm component mounted/rendered"
7. Submit form - verify all step logs appear
```

---

## 🔍 WHY THIS IS HAPPENING

### CDN Caching Layers
1. **Vercel Edge Cache** - Caches static assets globally
2. **Browser Cache** - Caches JS/CSS locally
3. **Service Worker** - May cache app shell
4. **DNS Cache** - May serve old IP

### The Problem
- Code deployed successfully ✅
- But CDN serves old cached bundles ❌
- Browser never downloads new code ❌
- Console logs from new code never execute ❌

---

## 🛠️ MANUAL CACHE CLEARING

### Clear Vercel CDN
```bash
# Force new deployment
vercel --prod --yes --force

# Purge specific paths
curl -X PURGE https://www.greenscapelux.com/
curl -X PURGE https://www.greenscapelux.com/assets/index-*.js
curl -X PURGE https://www.greenscapelux.com/get-quote
```

### Clear Browser Cache (All Users)
**The deployment script adds cache-busting query params:**
- `/assets/index.js?v=abc1234-1234567890`
- Forces browser to download new file

**Users can manually clear:**
- Chrome: `Ctrl+Shift+Delete` → Clear cached images and files
- Firefox: `Ctrl+Shift+Delete` → Cached Web Content
- Safari: `Cmd+Option+E`

### Clear Service Worker
```javascript
// Run in DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service workers cleared');
  location.reload();
});
```

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify each item:

- [ ] `/version.json` returns current commit hash
- [ ] `<meta name="version">` in page source matches commit
- [ ] Console shows "🏁 ClientQuoteForm component mounted/rendered"
- [ ] Console shows "Form bound to handleSubmit: true"
- [ ] Form submission logs all 11 steps
- [ ] Network tab shows POST to `/unified-email`
- [ ] Email received in inbox

---

## 🎯 EXPECTED CONSOLE OUTPUT

```javascript
// On page load
🏁 ClientQuoteForm component mounted/rendered
Form bound to handleSubmit: true
Current loading state: false

// On form submit
🎯 Step 1 — handleSubmit fired
🎯 Step 2 — Validation passed
🎯 Step 3 — Preparing data
🎯 Step 4 — Calling edge function
🎯 Step 5 — Response received
🎯 Step 6 — Success handling
✅ Quote submitted successfully
```

---

## 🚀 DEPLOYMENT SCRIPT FEATURES

### Automatic Version Tagging
- Embeds git commit hash in build
- Creates `/version.json` endpoint
- Updates `<meta name="version">` tag
- Allows runtime version checking

### Cache Busting
- Adds timestamp query params
- Forces CDN to fetch new assets
- Purges Vercel edge cache
- Clears old deployments

### Verification
- Fetches `/version.json` after deploy
- Compares deployed vs local commit
- Reports success/failure
- Provides testing instructions

---

## 🐛 TROUBLESHOOTING

### "vercel: command not found"
```bash
npm install -g vercel
vercel login
vercel link
```

### Version endpoint 404
```bash
# Ensure file exists
ls -la public/version.json

# Commit and redeploy
git add public/version.json
git commit -m "Add version endpoint"
./scripts/force-deploy-with-verification.sh production
```

### Logs still don't appear
1. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear all caches**: DevTools → Application → Clear storage
3. **Disable cache**: DevTools → Network → Disable cache (checkbox)
4. **Use incognito**: Guaranteed fresh session
5. **Check service worker**: DevTools → Application → Service Workers → Unregister all

### Version matches but form doesn't work
- Check browser console for errors
- Verify Supabase edge function is deployed
- Check Vercel function logs
- Test edge function directly with curl

---

## 📞 SUPPORT COMMANDS

### Check Current Deployment
```bash
vercel ls
```

### View Deployment Logs
```bash
vercel logs
```

### Check Build Output
```bash
vercel inspect <deployment-url>
```

### Test Version Endpoint
```bash
curl -s https://www.greenscapelux.com/version.json | jq
```

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:
1. Version endpoint returns current commit ✅
2. All console logs appear ✅
3. Form submits successfully ✅
4. Emails are sent ✅
5. No JavaScript errors ✅

---

## 🎉 NEXT STEPS

After successful deployment:
1. Monitor Vercel analytics for errors
2. Check Supabase logs for edge function calls
3. Verify email delivery in Resend dashboard
4. Test on multiple devices/browsers
5. Set up automated deployment monitoring

---

## 📚 RELATED FILES

- `scripts/force-deploy-with-verification.sh` - Main deployment script
- `public/version.json` - Version metadata endpoint
- `src/components/VersionChecker.tsx` - Auto-reload on version change
- `FORCE_CACHE_PURGE_DEPLOYMENT.md` - Detailed deployment guide
