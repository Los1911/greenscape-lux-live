# Nuclear Cache Purge - Complete Guide

## Status: EMAILS ARE WORKING ✅

Incognito mode proves the code is deployed and emails are firing. Issue is browser cache.

## For You (Developer)

### Immediate Fix:
```bash
# Mac:
Cmd + Shift + R

# Windows/Linux:
Ctrl + Shift + R
```

Then test the quote form - you'll see the diagnostic logs.

## For All Users (Force Fresh Code)

### Step 1: Update Asset Cache Headers

Edit `vercel.json` to add aggressive cache busting:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### Step 2: Force Vercel Redeployment

```bash
# Add cache-busting timestamp to package.json
echo "Deployment: $(date)" >> package.json

# Commit and push
git add .
git commit -m "Force cache purge - $(date +%s)"
git push origin main

# Or use Vercel CLI
vercel --prod --force
```

### Step 3: Purge Vercel CDN Cache

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Purge all cache
vercel --prod --force

# Or via API:
curl -X DELETE "https://api.vercel.com/v1/deployments/[DEPLOYMENT_ID]/cache" \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

### Step 4: Update Service Worker

The `public/sw.js` needs version checking:

```javascript
const CACHE_VERSION = 'v' + Date.now();
const CACHE_NAME = 'greenscape-' + CACHE_VERSION;

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

## Verification

### 1. Check Version Endpoint
```bash
curl https://greenscapelux.com/version.json
```

Should show current git commit hash.

### 2. Test in Incognito
Open incognito window and submit quote - should see diagnostic logs.

### 3. Test in Normal Browser
After cache clear, should see same logs as incognito.

### 4. Check Network Tab
- DevTools → Network tab
- Disable cache checkbox
- Refresh page
- All JS files should show "200" not "304 (from cache)"

## What's Already Working

✅ Quote form submission
✅ Database insertion
✅ Email notification via unified-email edge function
✅ Console diagnostic logs
✅ VersionChecker component for auto-detection

## The Real Issue

**Not a code problem** - it's a cache distribution problem:
- Your code is correct ✅
- Deployment is live ✅
- Incognito proves it works ✅
- Normal browser has stale cache ❌

## Quick Test Commands

```bash
# Clear your local cache
# Then in browser console:

// Check version
fetch('/version.json').then(r => r.json()).then(console.log)

// Check if service worker is active
navigator.serviceWorker.getRegistrations().then(console.log)

// Unregister service worker
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
)
```

## Success Criteria

After cache clear, you should see in console:
```
✅ Quote saved successfully to database: [UUID]
✅ Sending quote notification via unified-email...
✅ Quote notification sent successfully via unified-email
```

Just like you saw in incognito mode!
