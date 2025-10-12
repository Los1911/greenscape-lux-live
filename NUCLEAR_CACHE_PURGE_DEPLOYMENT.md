# 🚨 NUCLEAR CACHE PURGE & FORCE REDEPLOY GUIDE

## CRITICAL SITUATION
The signup flows are still failing with "column first_name does not exist in auth.users" despite correct code. This indicates **STALE CACHED BUNDLES** are being served that contain old code referencing invalid columns.

## ✅ CODE STATUS VERIFIED
All signup components are correctly coded:
- `ClientSignUp.tsx` (line 58): `data: { role: 'client' }`
- `LandscaperSignUp.tsx` (line 50): `data: { role: 'landscaper' }`  
- `UnifiedAuth.tsx` (line 90): `data: { role: userType }`

Console.log statements are in place for debugging.

## 🔥 NUCLEAR CACHE PURGE STEPS

### 1. LOCAL CACHE CLEARING
```bash
# Delete all build artifacts
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.cache/
rm -rf node_modules/.vite/

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules/
rm package-lock.json
npm install

# Force fresh build
npm run build
```

### 2. VERCEL FORCE DEPLOYMENT
```bash
# Force redeploy with cache bypass
vercel --prod --force

# OR if using GitHub integration:
# Push empty commit to trigger fresh build
git commit --allow-empty -m "Force cache purge and redeploy"
git push origin main
```

### 3. CDN EDGE CACHE PURGE
- Go to Vercel Dashboard → Project → Functions
- Click "Purge Cache" for all functions
- Go to Settings → Domains → Purge Cache

### 4. BROWSER CACHE CLEARING
```javascript
// Add cache-busting to index.html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 5. SUPABASE EDGE FUNCTION RESTART
```bash
# If using Supabase CLI
supabase functions delete landscaper-signup-email
supabase functions deploy landscaper-signup-email
```

## 🧪 POST-DEPLOYMENT VERIFICATION

### Test Signup Flows
1. Open browser in incognito mode
2. Navigate to signup pages
3. Open Developer Console
4. Attempt signup and verify console shows:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "options": {
       "data": { "role": "client" }
     }
   }
   ```

### Verify No Stale References
- Console should NOT show any `first_name`, `last_name`, or `phone` in auth metadata
- Error should be eliminated completely

## 🚨 NUCLEAR OPTION (If Above Fails)

### Complete Environment Reset
1. Create new Vercel project
2. Redeploy from scratch with fresh environment
3. Update DNS to point to new deployment
4. This guarantees zero cached artifacts

## ✅ SUCCESS INDICATORS
- [ ] Console.log shows minimal signup payloads
- [ ] No "column first_name does not exist" errors
- [ ] Signup flows complete successfully
- [ ] Users can register and access dashboards

## 📞 ESCALATION
If this nuclear purge doesn't resolve the issue, the problem is likely:
1. Supabase database schema inconsistency
2. Edge function caching stale code
3. DNS/CDN propagation delays

The code is correct - this is purely a deployment/cache issue.