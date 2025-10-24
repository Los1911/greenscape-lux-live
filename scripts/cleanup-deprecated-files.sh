#!/bin/bash
# GreenScape Lux Repository Cleanup Script
# Removes all deprecated audit, diagnostic, and temporary files

echo "🧹 Starting GreenScape Lux Repository Cleanup..."

# Remove all audit and diagnostic MD files (keep only README.md and CLEANUP_SUMMARY.md)
find . -maxdepth 1 -type f -name "*AUDIT*.md" ! -name "CLEANUP_SUMMARY.md" -delete
find . -maxdepth 1 -type f -name "*DIAGNOSTIC*.md" -delete
find . -maxdepth 1 -type f -name "*FIX*.md" -delete
find . -maxdepth 1 -type f -name "*DEPLOYMENT*.md" -delete
find . -maxdepth 1 -type f -name "*ENVIRONMENT*.md" -delete
find . -maxdepth 1 -type f -name "*STRIPE*.md" -delete
find . -maxdepth 1 -type f -name "*SUPABASE*.md" -delete
find . -maxdepth 1 -type f -name "*VERCEL*.md" -delete
find . -maxdepth 1 -type f -name "*EMAIL*.md" -delete
find . -maxdepth 1 -type f -name "*GITHUB*.md" -delete
find . -maxdepth 1 -type f -name "*PRODUCTION*.md" -delete
find . -maxdepth 1 -type f -name "*VALIDATION*.md" -delete

# Remove deprecated scripts (keep only verified production scripts)
cd scripts
rm -f admin-user-diagnostic*.sql check-admin-user.sql create-admin-user.sql
rm -f audit-ids.ts automated-env-sync.js build-time-env-validator.js
rm -f cleanup-stripe-webhooks.sh deploy-with-cache-bust.sh
rm -f dev-env-checker.js email-deliverability-checker.js email-notification.js
rm -f env-audit.js env-debug.js env-runtime-check.js env-sync-automation.js
rm -f env-sync.js env-validator.js fix-stripe-webhook-config.sh
rm -f force-deploy-with-verification.sh github-actions-env-sync.js
rm -f insert-email-templates.sql manual-deploy.sh multi-env-validator.js
rm -f nuclear-cache-purge.sh nuclear-deploy.sh production-env-verification.js
rm -f profile-cleanup-and-constraints.sql quote-requests-rls-fix.sql
rm -f rls-cleanup.sql rls-simplified.sql security-audit.js slack-webhook.js
rm -f staging-env-sync.js stripe-environment-fix.sh stripe-keys-setup.sh
rm -f stripe-payment-test.js stripe-validation-diagnostic.js
rm -f stripe-webhook-test.js validate-env-build.js validate-stripe-production.js
rm -f vercel-*.js vercel-*.sh stripe-production-deployment-checklist.md
cd ..

echo "✅ Cleanup complete! Repository streamlined for production."
