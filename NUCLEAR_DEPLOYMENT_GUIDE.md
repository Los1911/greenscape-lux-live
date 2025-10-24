# 🚀 NUCLEAR DEPLOYMENT GUIDE
## Complete Environment Variable Fix & Cache Purge

### CRITICAL ISSUE DIAGNOSIS
Your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are undefined because:

1. **Missing .env.local file** (now created)
2. **Hosting provider environment variables not set**
3. **Cache issues preventing new variables from loading**
4. **Build-time vs runtime variable mismatch**

### IMMEDIATE FIXES REQUIRED

#### 1. LOCAL DEVELOPMENT FIX
```bash
# Your .env.local file has been created with placeholder values
# REPLACE these with your actual Supabase values:

VITE_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ACTUAL-ANON-KEY-HERE
```

#### 2. VERCEL DEPLOYMENT FIX
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these EXACT variables:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_actual_anon_key`
3. Set for: Production, Preview, Development
4. **CRITICAL**: Redeploy after adding variables

#### 3. DEPLOYPAD FIX
1. Go to Deploypad Dashboard → Environment Variables
2. Add the same VITE_ prefixed variables
3. Force redeploy

### NUCLEAR CACHE PURGE PROCESS

```bash
# Run the nuclear cache purge script
chmod +x scripts/nuclear-cache-purge.sh
./scripts/nuclear-cache-purge.sh

# Or manual steps:
rm -rf node_modules/.cache dist .vercel
npm cache clean --force
npm install
npm run build
```

### VERIFICATION STEPS

1. **Check Local Environment**:
   ```bash
   node scripts/env-runtime-check.js
   ```

2. **Check Build Output**:
   Look for environment variables in build logs

3. **Check Runtime**:
   Open browser console and check if variables are defined

### GET YOUR ACTUAL SUPABASE VALUES

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/public key → `VITE_SUPABASE_ANON_KEY`

### HOSTING PROVIDER SPECIFIC FIXES

#### Vercel:
- Environment Variables must be set in dashboard
- Redeploy required after adding variables
- Check Functions tab for edge function variables

#### Deploypad:
- Set variables in project settings
- May require cache invalidation
- Check deployment logs for variable loading

### TROUBLESHOOTING

If still undefined after all fixes:
1. Check browser Network tab for failed requests
2. Verify Supabase project is active
3. Check CORS settings in Supabase
4. Ensure no typos in variable names (case sensitive)

**Remember**: VITE_ prefix is REQUIRED for Vite to expose variables to the browser!