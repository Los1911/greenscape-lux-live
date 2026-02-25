# 🔐 Manual GitHub Secrets Update - Action Required

## ⚠️ CRITICAL: This Requires Manual Intervention

I cannot directly access or modify GitHub repository secrets. You must complete this step manually.

---

## 🎯 What Needs To Be Done

Replace the old `VITE_SUPABASE_ANON_KEY` secret with `VITE_SUPABASE_PUBLISHABLE_KEY` in your GitHub repository.

---

## 📝 Step-by-Step Instructions

### Step 1: Navigate to Repository Settings
1. Go to: `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/secrets/actions`
2. Or: Repository → **Settings** → **Secrets and variables** → **Actions**

### Step 2: Delete Old Secret
1. Find `VITE_SUPABASE_ANON_KEY` in the list
2. Click the **🗑️ Delete** button
3. Confirm deletion

### Step 3: Add New Secret
1. Click **"New repository secret"** (green button)
2. Fill in:
   - **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Secret:** `sb_publishable_EPF-r4VsfAE13EBn6SNwTQ_QS-5h6ex`
3. Click **"Add secret"**

---

## ✅ Verification

After adding the secret, verify it works:

1. Go to **Actions** tab
2. Select any workflow (e.g., `env-validation.yml`)
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for completion
5. Check for ✅ green checkmark

---

## 🔍 What Has Been Updated Automatically

✅ **All codebase files** now reference `VITE_SUPABASE_PUBLISHABLE_KEY`
✅ **All GitHub workflows** now reference `VITE_SUPABASE_PUBLISHABLE_KEY`
✅ **All scripts** now reference `VITE_SUPABASE_PUBLISHABLE_KEY`
✅ **All configuration files** now reference `VITE_SUPABASE_PUBLISHABLE_KEY`

⏳ **GitHub Secrets** - Requires your manual update (this step)

---

## 🚨 Why This Matters

- GitHub Actions workflows will **fail** if the old secret name is used
- Deployments will **not work** without the correct secret
- Environment validation will **fail** during CI/CD

---

## 📊 Complete Migration Checklist

- [x] Update all source code files
- [x] Update all workflow files
- [x] Update all scripts
- [x] Update environment templates
- [x] Create migration documentation
- [ ] **Update GitHub Secrets (YOU MUST DO THIS)**
- [ ] Test workflow execution
- [ ] Verify deployment success

---

## 🆘 Need Help?

**Can't find the secrets page?**
- You need **Admin** or **Maintainer** access to the repository
- Contact repository owner if you don't have access

**Secret not working after update?**
- Verify the secret name is exactly: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Check there are no extra spaces in the name or value
- Re-run the workflow to test

**Workflow still failing?**
- Check workflow logs for specific error message
- Verify all other required secrets are also set
- See GITHUB_SECRETS_SETUP_GUIDE.md for complete list

---

## 📧 Contact

If you encounter issues after following these steps, check:
1. Workflow run logs in Actions tab
2. GLOBAL_ENVIRONMENT_VARIABLE_MIGRATION_COMPLETE.md
3. GITHUB_SECRETS_SETUP_GUIDE.md
