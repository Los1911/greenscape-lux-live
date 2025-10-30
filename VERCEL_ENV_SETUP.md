<<<<<<< HEAD
# 🚀 Vercel Environment Variables Setup

## Quick Copy-Paste for Vercel Dashboard

Go to: **Vercel Dashboard** → **greenscape-lux-live** → **Settings** → **Environment Variables**

### Add These Variables (One at a Time)

```
VITE_SUPABASE_URL
https://mwvcbedvnimabfwubazz.supabase.co
```

```
VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

```
VITE_SUPABASE_FUNCTIONS_URL
https://mwvcbedvnimabfwubazz.functions.supabase.co
```

```
VITE_SITE_URL
https://greenscapelux.com
```

```
VITE_ADMIN_EMAIL
cmatthews@greenscapelux.com
```

```
VITE_APP_ENV
production
```

```
VITE_PLATFORM_NAME
GreenScape Lux
```

```
VITE_RESEND_API_KEY
re_dTWTSNo5_L2o9dFGw2mwyy8VFvvXxTC6A
```

```
VITE_GOOGLE_MAPS_API_KEY
AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4
```

### ⏳ To Be Added Later (When You Have Stripe Keys)

```
VITE_STRIPE_PUBLISHABLE_KEY
pk_live_[YOUR_STRIPE_PUBLISHABLE_KEY]
```

---

## 📝 Instructions

1. **For each variable above:**
   - Click "Add New" in Vercel
   - Copy the variable name (e.g., `VITE_SUPABASE_URL`)
   - Paste the value
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

2. **After adding all variables:**
   - Trigger a new deployment: `git push origin main`
   - Or manually redeploy in Vercel Dashboard

3. **Verify:**
   - Check deployment logs for any missing variables
   - Test the live site to ensure everything loads

---

## 🔐 Security Reminder

✅ **Safe to add to Vercel (client-side):**
- All variables with `VITE_` prefix
- These are bundled into the frontend code

❌ **NEVER add to Vercel:**
- `STRIPE_SECRET_KEY` (add to Supabase Secrets instead)
- `STRIPE_WEBHOOK_SECRET` (add to Supabase Secrets instead)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

---

## Next Steps

After adding these to Vercel, configure server-side secrets in Supabase.
See: `ENVIRONMENT_SETUP_COMPLETE.md` → Step 4
=======
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
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
