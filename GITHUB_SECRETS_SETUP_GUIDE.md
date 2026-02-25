# GitHub Secrets Setup Guide - Complete Configuration

## 🎯 Purpose
This guide ensures all GitHub repository secrets are properly configured for GreenScape Lux CI/CD pipelines.

---

## 📋 Required Secrets Checklist

### ✅ Supabase Configuration
- [x] `VITE_SUPABASE_URL` - Your Supabase project URL
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` - **NEW** Supabase publishable key (replaces ANON_KEY)
- [x] `VITE_SUPABASE_FUNCTIONS_URL` - Supabase Edge Functions URL
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Backend service role key (sensitive)

### ✅ Stripe Configuration
- [x] `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key
- [x] `VITE_STRIPE_PUBLISHABLE_KEY` - Alternative Stripe public key
- [x] `STRIPE_SECRET_KEY` - Stripe secret key (sensitive)
- [x] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### ✅ Additional Services
- [x] `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- [x] `VITE_SITE_URL` - Production site URL
- [x] `RESEND_API_KEY` - Email service API key

---

## 🔧 Step-by-Step Setup

### 1. Access GitHub Secrets
```
Repository → Settings → Secrets and variables → Actions
```

### 2. Delete Deprecated Secret
**IMPORTANT:** Remove the old secret name:
- ❌ Delete: `VITE_SUPABASE_ANON_KEY`

### 3. Add/Update Secrets

Click **"New repository secret"** for each:

#### Supabase Secrets
```
Name: VITE_SUPABASE_URL
Value: https://[YOUR-PROJECT].supabase.co
```

```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: sb_publishable_EPF-r4VsfAE13EBn6SNwTQ_QS-5h6ex
```

```
Name: VITE_SUPABASE_FUNCTIONS_URL
Value: https://[YOUR-PROJECT].supabase.co/functions/v1
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Your service role key - DO NOT SHARE]
```

#### Stripe Secrets
```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_[YOUR_KEY] or pk_live_[YOUR_KEY]
```

```
Name: STRIPE_SECRET_KEY
Value: sk_test_[YOUR_KEY] or sk_live_[YOUR_KEY]
```

```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_[YOUR_SECRET]
```

---

## 🔍 Verification

### Check Workflow Files
All workflows correctly reference `VITE_SUPABASE_PUBLISHABLE_KEY`:
- ✅ `.github/workflows/automated-env-sync.yml`
- ✅ `.github/workflows/env-sync-deployment.yml`
- ✅ `.github/workflows/env-validation.yml`
- ✅ `.github/workflows/env-validation-status.yml`
- ✅ `.github/workflows/github-pages-deploy.yml`

### Test Workflows
1. Go to **Actions** tab
2. Select `env-validation.yml`
3. Click **Run workflow**
4. Verify success ✅

---

## 🚨 Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use test keys** for development
4. **Use production keys** only in production environment
5. **Limit access** to repository settings

---

## 📊 Migration Status

| Component | Status |
|-----------|--------|
| Codebase | ✅ Complete |
| Scripts | ✅ Complete |
| Workflows | ✅ Complete |
| GitHub Secrets | ⏳ **Manual Action Required** |

---

## 🆘 Troubleshooting

**Workflow fails with "secret not found":**
- Verify secret name matches exactly (case-sensitive)
- Check secret is set in correct repository
- Ensure workflow has permission to access secrets

**Build fails with "environment variable undefined":**
- Confirm secret value is not empty
- Check workflow syntax: `${{ secrets.SECRET_NAME }}`
- Verify .env files are generated correctly

---

## 📞 Support

For issues with this migration:
1. Check workflow logs in Actions tab
2. Review GLOBAL_ENVIRONMENT_VARIABLE_MIGRATION_COMPLETE.md
3. Verify all secrets are configured correctly
