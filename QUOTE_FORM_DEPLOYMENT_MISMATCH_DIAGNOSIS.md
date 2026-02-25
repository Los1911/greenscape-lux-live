# Admin Dashboard Deployment Mismatch Diagnosis & Fix

## Problem Summary

The Admin Dashboard shows "Failed to load jobs" due to a Supabase 400 error. The browser is loading **stale JavaScript** that still queries the `quotes` table with invalid filters, even though all source code has been corrected to query the `jobs` table.

## Root Cause

**This is NOT a code issue.** The code is correct. The problem is:

1. **Stale Deployment**: The production domain (`greenscapelux.com`) is serving an old JavaScript bundle
2. **Vercel Project Mismatch**: Multiple Vercel projects exist, and the domain may be pointing to a stale/deleted deployment
3. **Aggressive CDN Caching**: Vercel's CDN is serving cached JavaScript files

## Evidence

### Failing Request (from browser console)
```
GET /rest/v1/quotes?
  select=*
  &assigned_landscaper_id=is.null
  &status=eq.pending
  &order=created_at.desc
→ 400 Bad Request
```

### Current Code (CORRECT)
All admin components now query `jobs` table:
- `AdminJobsPanel.tsx` → `from('jobs')`
- `AdminJobPricingPanel.tsx` → `from('jobs')`
- `AdminJobPhotoReview.tsx` → `from('job_photos')` → `from('jobs')`
- `JobMatchingDashboard.tsx` → `from('jobs')`

### The Query Pattern `assigned_landscaper_id=is.null` Does NOT Exist in Current Code
This proves the browser is loading old JavaScript.

## Fix Applied

### 1. Cache-Busting Headers (vercel.json)
```json
{
  "source": "/index.html",
  "headers": [
    { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
    { "key": "Pragma", "value": "no-cache" },
    { "key": "Expires", "value": "0" }
  ]
}
```

### 2. Version Tracking (public/version.json)
```json
{
  "commitHash": "admin-jobs-fix-v3-20260126",
  "buildId": "jobs-table-query-fix-final",
  "querySource": "jobs",
  "legacyQuotesRemoved": true
}
```

### 3. Enhanced VersionChecker Component
- Detects version mismatches
- Clears service worker caches
- Forces hard reload on stale detection

### 4. Inline Cache Detection (index.html)
- JavaScript runs before React loads
- Detects stale HTML and forces reload
- Clears all caches on version mismatch

### 5. Build Version Logging (main.tsx)
- Logs build version on startup
- Validates cache against server version
- Helps identify stale deployments

## Verification Steps

### Step 1: Check Current Deployment Version
Open browser console on production site and look for:
```
═══════════════════════════════════════════════════════════════
🚀 GreenScape Lux Starting...
📦 Build Version: admin-jobs-fix-v3-20260126
🔍 Query Source: jobs (admin queries use jobs table)
═══════════════════════════════════════════════════════════════
```

If you see a different version or "quotes" as query source, the deployment is stale.

### Step 2: Check Version Endpoint
```bash
curl -H "Cache-Control: no-cache" "https://greenscapelux.com/version.json?t=$(date +%s)"
```

Expected response:
```json
{
  "commitHash": "admin-jobs-fix-v3-20260126",
  "querySource": "jobs"
}
```

### Step 3: Force Cache Clear (User)
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: DevTools → Application → Storage → Clear site data

### Step 4: Verify Admin Dashboard
1. Navigate to `/admin-dashboard`
2. Open Network tab
3. Look for Supabase requests
4. Verify requests go to `jobs` table, NOT `quotes`

## Vercel Deployment Checklist

### Identify Active Project
Run in Vercel CLI:
```bash
vercel list
vercel domains ls
```

Look for which project owns `greenscapelux.com`.

### Force Redeploy
```bash
# Option 1: Via CLI
vercel --prod --force

# Option 2: Via Dashboard
# Go to Vercel → Project → Deployments → Redeploy (with cache clear)
```

### Verify Domain Alias
```bash
vercel domains inspect greenscapelux.com
```

Ensure the domain points to the correct project and latest deployment.

## If Still Failing

### Nuclear Option: Clear All Caches
1. **Vercel Dashboard**: Project → Settings → Advanced → Clear Build Cache
2. **Cloudflare (if used)**: Purge Everything
3. **Browser**: Clear all site data for greenscapelux.com
4. **Redeploy**: `vercel --prod --force`

### Check for Orphaned Deployments
Multiple Vercel projects may exist:
- greenscapelux
- greenscapelux-v1 / v2 / v3
- greenscape-lux-live
- greenscape-lux-app
- greenscape-lux-platform

Only ONE should own the production domain. Delete or unlink others.

## Success Criteria

After fix is deployed:
1. ✅ Console shows `Build Version: admin-jobs-fix-v3-20260126`
2. ✅ Console shows `Query Source: jobs`
3. ✅ No 400 errors from Supabase
4. ✅ Admin Dashboard loads jobs correctly
5. ✅ Network requests go to `jobs` table, not `quotes`

## Files Modified

| File | Change |
|------|--------|
| `vercel.json` | Added cache-busting headers for HTML and version.json |
| `public/version.json` | Updated with new build ID and querySource marker |
| `src/components/VersionChecker.tsx` | Enhanced with aggressive cache detection and clearing |
| `index.html` | Added inline cache detection script |
| `src/main.tsx` | Added build version logging and cache validation |

## Contact

If the issue persists after all steps:
1. Check Vercel deployment logs for build errors
2. Verify GitHub Actions workflow completed successfully
3. Confirm the correct branch is being deployed
4. Check for any Vercel build cache issues
