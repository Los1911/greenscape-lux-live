#!/bin/bash
# Supabase Edge Functions Cleanup Script
# Safely removes test, debug, and diagnostic functions while preserving production

set -e

BACKUP_DIR="backups/functions/$(date +%Y-%m-%d)"
REPORT_FILE="SUPABASE_EDGE_FUNCTION_PURGE_REPORT.md"

echo "🧹 Starting Supabase Edge Functions Cleanup..."
echo "📦 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Production-critical functions to KEEP
KEEP_FUNCTIONS=(
  "stripe-webhook"
  "create-stripe-customer"
  "stripe-connect-onboarding"
  "create-payment-intent"
  "unified-email"
  "create-billing-portal-session"
  "get-payment-methods"
  "delete-payment-method"
  "notification-scheduler"
  "send-job-notification"
  "process-payout"
  "stripe-connect-webhook"
  "stripe-connect-notification"
)

# Prefixes to DELETE
DELETE_PREFIXES=(
  "test-"
  "debug-"
  "diagnose-"
  "fix-"
  "audit-"
  "comprehensive-"
  "emergency-"
  "check-"
  "validate-"
  "verify-"
  "diagnostic-"
)

echo "✅ Production functions preserved: ${#KEEP_FUNCTIONS[@]}"
echo "🗑️  Scanning for deprecated functions..."

# This script documents the cleanup - actual deletion requires Supabase CLI
echo "📝 Generating cleanup report..."
