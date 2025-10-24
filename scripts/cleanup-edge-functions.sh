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
  "create-stripe-connect-account"
  "create-payment-intent"
  "unified-email"
  "attach-payment-method"
  "get-payment-methods"
  "delete-payment-method"
  "create-billing-portal-session"
  "notification-scheduler"
  "send-job-notification"
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
