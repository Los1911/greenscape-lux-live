# Force Cache-Purged Deployment Guide

## 🚨 Problem
The live site at https://www.greenscapelux.com is serving stale cached code. Console logs and code changes are not appearing in production despite successful deployments.

## ✅ Solution
Force deployment with aggressive cache busting and verification.

---

## 📋 Prerequisites

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Link project** (if not already linked):
```bash
vercel link
```

---

## 🚀 Deployment Steps

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/force-deploy-with-verification.sh

# Deploy to production
./scripts/force-deploy-with-verification.sh production

# Or deploy to preview
./scripts/force-deploy-with-verification.sh preview
```

### Option 2: Manual Steps

```bash
# 1. Get current commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "Deploying commit: $COMMIT_HASH"

# 2. Create version file
cat > public/version.json << EOF
{
  "commitHash": "$COMMIT_HASH",
  "buildId": "$COMMIT_HASH-$(date +%s)",
  "timestamp": $(date +%s),
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# 3. Force deploy
vercel --prod --yes --force

# 4. Wait for propagation
sleep 15

# 5. Verify deployment
curl -s "https://www.greenscapelux.com/version.json?t=$(date +%s)"
```

---

## 🔍 Verification Steps

### 1. Check Version Endpoint
Open in **incognito/private window**:
```
https://www.greenscapelux.com/version.json?t=TIMESTAMP
```

Expected response:
```json
{
  "commitHash": "abc1234",
  "buildId": "abc1234-1234567890",
  "timestamp": 1234567890,
  "deployedAt": "2025-01-15T10:30:00Z"
}
```

### 2. Verify Quote Form Logs
1. Open **incognito window**
2. Navigate to: `https://www.greenscapelux.com/get-quote`
3. Open DevTools Console (F12)
4. Look for: `🏁 ClientQuoteForm component mounted/rendered`
5. Fill out form and click Submit
6. Verify all step logs appear:
   - ✅ `🎯 Step 1 — handleSubmit fired`
   - ✅ `🎯 Step 2 — Validation passed`
   - ✅ `🎯 Step 3 — Preparing data`
   - etc.

### 3. Hard Refresh Browser Cache
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### 4. Clear Application Cache
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check all boxes
5. Click **Clear site data**
6. Refresh page

---

## 🧹 Additional Cache Clearing

### Clear Vercel CDN Cache
```bash
# Using Vercel CLI
vercel --prod --yes --force

# Using curl (purge specific paths)
curl -X PURGE https://www.greenscapelux.com/
curl -X PURGE https://www.greenscapelux.com/get-quote
curl -X PURGE https://www.greenscapelux.com/assets/*
```

### Clear Browser Cache (All Methods)
```javascript
// Run in DevTools Console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared');
  location.reload(true);
});
```

---

## 🎯 Expected Console Output (After Fix)

When you visit `/get-quote` and submit the form, you should see:

```
🏁 ClientQuoteForm component mounted/rendered
Form bound to handleSubmit: true
Current loading state: false
🎯 Step 1 — handleSubmit fired
🎯 Step 2 — Validation passed
🎯 Step 3 — Preparing data
🎯 Step 4 — Calling edge function
🎯 Step 5 — Response received
🎯 Step 6 — Success handling
✅ Quote submitted successfully
```

---

## 🐛 Troubleshooting

### Issue: Version endpoint returns 404
**Solution**: Ensure `public/version.json` exists and is committed before deployment.

### Issue: Version matches but logs don't appear
**Solution**: 
1. Clear browser cache completely
2. Use incognito mode
3. Check if service worker is caching: DevTools → Application → Service Workers → Unregister

### Issue: Deployment succeeds but version doesn't update
**Solution**:
1. Wait 2-3 minutes for CDN propagation
2. Try different CDN edge: `https://www.greenscapelux.com/version.json?t=$(date +%s)`
3. Check Vercel dashboard for deployment status

### Issue: "vercel: command not found"
**Solution**:
```bash
npm install -g vercel
# or
yarn global add vercel
```

---

## 📊 Monitoring Deployment

### Check Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select GreenScape Lux project
3. View latest deployment
4. Check deployment logs
5. Verify build completed successfully

### Check Build Logs
```bash
vercel logs --follow
```

---

## 🔄 Auto-Reload on Version Change

The `VersionChecker` component has been added to automatically detect version changes and reload the app. To use it:

```tsx
// In App.tsx or main layout
import { VersionChecker } from '@/components/VersionChecker';

function App() {
  return (
    <>
      <VersionChecker />
      {/* rest of app */}
    </>
  );
}
```

---

## ✅ Success Criteria

- [ ] Version endpoint returns current commit hash
- [ ] Console shows "🏁 ClientQuoteForm component mounted/rendered"
- [ ] Form submission triggers all step logs
- [ ] POST request appears in Network tab
- [ ] Email notifications are sent
- [ ] No stale code warnings in console

---

## 📞 Next Steps After Deployment

1. Test in incognito mode immediately
2. Test on different devices/networks
3. Monitor error logs in Vercel dashboard
4. Check Supabase logs for edge function calls
5. Verify email delivery in Resend dashboard

---

## 🎉 Expected Result

After successful deployment and cache clearing, the quote form should:
- Show all diagnostic console logs
- Submit data to edge function
- Send emails via unified-email edge function
- Display success message
- No more silent failures
