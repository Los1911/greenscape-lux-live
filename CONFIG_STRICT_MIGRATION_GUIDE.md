# Config Strict Migration Guide

## Overview

This guide explains how to migrate from the fallback-based configuration system (`config.ts`) to the strict validation system (`configStrict.ts`).

---

## Why Migrate?

### Current System (`config.ts` + `environmentFallback.ts`)
- ❌ Uses hardcoded fallbacks when env vars are missing
- ❌ App continues working even with misconfigured environment
- ❌ Silent failures - hard to debug production issues
- ❌ Security risk: hardcoded keys in source code

### Strict System (`configStrict.ts`)
- ✅ Fails fast if critical env vars are missing
- ✅ Forces proper Vercel configuration
- ✅ Clear error messages for debugging
- ✅ No hardcoded secrets in source code
- ✅ Build-time validation prevents bad deployments

---

## Migration Steps

### Step 1: Verify Vercel Env Vars Are Working

Before migrating, confirm that Vercel is injecting env vars correctly:

```bash
# Deploy current code and check browser console
# You should see:
# ✅ Using standard environment configuration
```

If you see `⚠️ Using fallback configuration`, **DO NOT MIGRATE YET**. Fix Vercel env vars first (see `VERCEL_ENV_FIX_INSTRUCTIONS.md`).

---

### Step 2: Update Import Statements

Find all files that import `config`:

```bash
# Search for config imports
grep -r "from '@/lib/config'" src/
```

**Current files using config:**
- `src/utils/paymentTestSuite.ts`
- `src/utils/rlsAuditSystem.ts`
- `src/pages/ClientQuoteForm.tsx` (imports `fn` - may be typo)

**Update each file:**

```typescript
// BEFORE
import { config } from '@/lib/config';

// AFTER
import { strictConfig as config } from '@/lib/configStrict';
```

---

### Step 3: Update Supabase Client Initialization

If you're initializing Supabase clients manually:

```typescript
// BEFORE
import { config } from '@/lib/config';
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// AFTER
import { strictConfig } from '@/lib/configStrict';
const supabase = createClient(strictConfig.supabase.url, strictConfig.supabase.anonKey);
```

---

### Step 4: Test Locally

```bash
# Ensure .env.local has all required variables
npm run dev

# You should see in console:
# ✅ All critical environment variables present
```

If you see an error, add missing variables to `.env.local`.

---

### Step 5: Deploy to Vercel

```bash
git add .
git commit -m "Migrate to strict config validation"
git push origin main
```

**Expected behavior:**
- ✅ If Vercel env vars are configured: Build succeeds
- ❌ If Vercel env vars are missing: Build fails with clear error message

---

### Step 6: (Optional) Remove Old Fallback System

Once strict config is working in production:

```bash
# Remove fallback files
rm src/lib/environmentFallback.ts
rm src/lib/config.ts

# Update any remaining imports to use configStrict.ts
```

---

## Rollback Plan

If something goes wrong, you can quickly rollback:

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

Or manually revert imports:

```typescript
// Rollback to fallback system
import { config } from '@/lib/config';
```

---

## Testing Checklist

- [ ] Local development works with `.env.local`
- [ ] Browser console shows: `✅ All critical environment variables present`
- [ ] No console warnings about missing env vars
- [ ] Supabase authentication works
- [ ] Stripe payment forms load correctly
- [ ] Google Maps (if used) displays correctly
- [ ] Production deployment succeeds
- [ ] Production site works without fallback warnings

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Cause:** `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not set

**Solution:**
1. Add variables to Vercel Dashboard (see `VERCEL_ENV_FIX_INSTRUCTIONS.md`)
2. Redeploy with cache cleared

### Warning: "VITE_STRIPE_PUBLISHABLE_KEY is missing"

**Cause:** Stripe key not configured (non-critical)

**Solution:**
- Add `VITE_STRIPE_PUBLISHABLE_KEY` to Vercel Dashboard if you need payment features
- Or ignore warning if payments are not used

### Build succeeds but runtime errors occur

**Cause:** Environment variables are set but have incorrect values

**Solution:**
1. Check browser console for actual values
2. Verify values in Vercel Dashboard match `.env.example`
3. Run `npm run sync:env` to validate

---

## Benefits After Migration

1. **Immediate Feedback**: Build fails if env vars are missing (no silent failures)
2. **Easier Debugging**: Clear error messages in console
3. **Better Security**: No hardcoded secrets in source code
4. **Confidence**: Know that production deployments have correct configuration
5. **Automation**: Pre-build validation prevents misconfigured deployments

---

## Related Documentation

- `ENVIRONMENT_FALLBACK_AUDIT_REPORT.md` - Why fallbacks are problematic
- `VERCEL_ENV_FIX_INSTRUCTIONS.md` - How to configure Vercel env vars
- `AUTOMATED_ENV_SYNC_SYSTEM_COMPLETE.md` - Automated validation system
- `scripts/validate-env-build.js` - Pre-build validation script
