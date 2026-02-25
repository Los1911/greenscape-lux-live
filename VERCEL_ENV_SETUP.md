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
VITE_STRIPE_PUBLIC_KEY
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
