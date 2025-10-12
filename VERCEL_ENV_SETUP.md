# Vercel Environment Variables Setup

## CRITICAL: Your build is failing because environment variables are missing

### Step 1: Add Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **EXACT** variables:

```
Name: VITE_SUPABASE_URL
Value: https://mwvcbedvnimabfwubazz.supabase.co
Environment: Production, Preview, Development
```

```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
Environment: Production, Preview, Development
```

### Step 2: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Select "Use existing Build Cache" = **NO**

### Step 3: Verify

After deployment, visit your site and check console for:
- ✅ VITE_SUPABASE_URL — Injected at build time
- ✅ VITE_SUPABASE_ANON_KEY — Injected at build time

## Quick Fix for Immediate Testing

If you need to test immediately without waiting for Vercel setup:

1. Open browser console on your site
2. Run: `localStorage.setItem("GSL_SUPABASE_URL", "https://mwvcbedvnimabfwubazz.supabase.co")`
3. Run: `localStorage.setItem("GSL_SUPABASE_ANON", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY")`
4. Refresh the page

## Why This Happens

Vite only injects environment variables that:
1. Start with `VITE_`
2. Are available at **build time**
3. Are set in the deployment environment

The fallback in `runtimeConfig.ts` works but shows "Missing" because the actual env vars aren't injected during build.