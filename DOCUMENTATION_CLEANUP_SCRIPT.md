# 🧹 Documentation Cleanup Script

## PROBLEM IDENTIFIED
Multiple audit files contain **OUTDATED INFORMATION** claiming completed tasks are still incomplete.

## FILES TO UPDATE/REMOVE

### OUTDATED AUDIT FILES (Remove or Archive)
```bash
# These files claim Stripe/Resend keys are missing (they're not):
rm GREENSCAPE_LUX_CURRENT_STATUS_REVIEW.md
rm PRODUCTION_READINESS_AUDIT_2025.md  
rm PRODUCTION_READINESS_AUDIT_2025_v2.md
rm ENVIRONMENT_AUDIT_REPORT.md
rm CRITICAL_ISSUES_RESOLUTION_PLAN.md
```

### TEMPLATE FILES (Update Comments)
```bash
# Update .env.local.template to clarify these are examples:
# Line 20: STRIPE_SECRET_KEY=sk_live_your_secret_key_here
# Add comment: "# EXAMPLE ONLY - Real keys configured in Supabase secrets"
```

### VALIDATION SCRIPTS (Update Logic)
```bash
# Update scripts to check Supabase secrets, not local files:
scripts/env-validator.js
scripts/stripe-setup-checker.js
src/components/setup/EnvironmentValidator.tsx
```

## QUICK CLEANUP COMMANDS

### 1. Remove Outdated Audits
```bash
mv GREENSCAPE_LUX_CURRENT_STATUS_REVIEW.md archive/
mv PRODUCTION_READINESS_AUDIT_2025.md archive/
mv ENVIRONMENT_AUDIT_REPORT.md archive/
```

### 2. Update Template Comments
```bash
# Add to .env.local.template:
# NOTE: Real production keys are configured in Supabase secrets
# These are template examples only
```

### 3. Update Validation Scripts
```bash
# Modify to check Supabase instead of local env files
# Or add flag to skip validation in production
```

## RESULT
- Remove confusion about "missing" keys that are actually configured
- Clean documentation reflects actual production status
- Future developers see accurate current state

**Estimated cleanup time: 30 minutes**