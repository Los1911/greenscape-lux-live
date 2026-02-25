# GitHub Secrets Update Guide - VITE_SUPABASE_PUBLISHABLE_KEY Migration

## ⚠️ CRITICAL: Manual Action Required

This guide provides step-by-step instructions to update GitHub repository secrets from the old `VITE_SUPABASE_ANON_KEY` to the new `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## Step 1: Access GitHub Repository Settings

1. Navigate to your GitHub repository: `https://github.com/[YOUR_USERNAME]/greenscape-lux`
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, expand **Secrets and variables**
4. Click on **Actions**

---

## Step 2: Delete Old Secret

1. Locate `VITE_SUPABASE_ANON_KEY` in the secrets list
2. Click the **Delete** button next to it
3. Confirm deletion when prompted

---

## Step 3: Add New Secret

1. Click **New repository secret** (green button)
2. Enter the following details:
   - **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** `sb_publishable_EPF-r4VsfAE13EBn6SNwTQ_QS-5h6ex`
3. Click **Add secret**

---

## Step 4: Verify Workflow Access

All GitHub Actions workflows have been updated to reference `VITE_SUPABASE_PUBLISHABLE_KEY`. The following workflows will automatically use the new secret:

- ✅ `automated-env-sync.yml`
- ✅ `env-sync-deployment.yml`
- ✅ `env-validation.yml`
- ✅ `github-pages-deploy.yml`
- ✅ `vercel-stripe-deployment.yml`

---

## Step 5: Test Workflows

1. Go to **Actions** tab in your repository
2. Select any workflow (e.g., `env-validation.yml`)
3. Click **Run workflow** to trigger a manual test
4. Verify the workflow completes successfully

---

## Additional Secrets to Verify

Ensure these related secrets are also configured:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## Troubleshooting

**If workflows fail after update:**
1. Check that secret name matches exactly: `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Verify the secret value was copied correctly
3. Re-run the failed workflow
4. Check workflow logs for specific error messages

---

## Migration Status

✅ All codebase references updated
✅ All workflow files updated
✅ All scripts updated
⏳ **GitHub Secrets update (MANUAL ACTION REQUIRED)**

---

## Security Note

The Supabase publishable key is safe to expose in client-side code, but should still be stored as a secret in GitHub Actions for centralized management and rotation capabilities.
