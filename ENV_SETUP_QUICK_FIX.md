# Quick Environment Variable Fix

## Problem
`import.meta.env.VITE_SUPABASE_URL is undefined` error when running the app.

## Immediate Solution

### 1. Create .env.local file (if missing)
```bash
# In your project root, create .env.local with:
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

### 2. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Verify Fix
Open browser console and look for:
- ✅ "Environment validation passed"
- 🔍 Environment debug information
- No "undefined" errors

## For Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the same variables for Production environment
3. Redeploy your app

## Debugging Commands
```bash
# Check if .env.local exists and has correct content
cat .env.local

# Run environment checker
node scripts/env-runtime-check.js

# Check what Vite sees
npm run dev
# Look in browser console for environment debug info
```

## Why This Happens
- Vite requires environment variables to start with `VITE_` for client-side access
- Variables must be defined at build time, not runtime
- `.env.local` is loaded automatically by Vite for local development
- Production environments need variables set in deployment platform

## Verification Checklist
- [ ] `.env.local` file exists in project root
- [ ] Variables start with `VITE_`
- [ ] No spaces around `=` in variable definitions
- [ ] Development server restarted after creating/modifying env file
- [ ] Browser console shows environment validation success
- [ ] Production variables set in Vercel dashboard (if deploying)