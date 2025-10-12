#!/bin/bash

# Stripe Webhook Cleanup Script
# Removes old/test webhooks and configures production endpoint only

set -e

echo "🧹 Stripe Webhook Cleanup Script"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_SECRET="whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI not found. You'll need to manually delete endpoints.${NC}"
    STRIPE_CLI_AVAILABLE=false
else
    STRIPE_CLI_AVAILABLE=true
fi

# Get Supabase project ref if not set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${YELLOW}Enter your Supabase project ref:${NC}"
    read -r SUPABASE_PROJECT_REF
fi

echo ""
echo "📋 Cleanup Plan:"
echo "1. Update Supabase secret to production value"
echo "2. List Stripe webhook endpoints (manual cleanup required)"
echo "3. Verify configuration"
echo ""

# Step 1: Update Supabase Secret
echo "🔐 Step 1: Updating Supabase Secret..."
supabase secrets set STRIPE_WEBHOOK_SECRET="$PRODUCTION_SECRET" \
    --project-ref "$SUPABASE_PROJECT_REF"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Supabase secret updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update Supabase secret${NC}"
    exit 1
fi

echo ""

# Step 2: List Stripe Webhooks
echo "🔍 Step 2: Listing Stripe Webhook Endpoints..."
echo ""

if [ "$STRIPE_CLI_AVAILABLE" = true ]; then
    echo "Current webhook endpoints:"
    stripe webhooks list
    
    echo ""
    echo -e "${YELLOW}⚠️  Manual Action Required:${NC}"
    echo "Please delete all endpoints EXCEPT 'greenscape-prod-webhook'"
    echo ""
    echo "To delete an endpoint:"
    echo "  stripe webhooks delete <endpoint_id>"
    echo ""
    echo "Or delete via Stripe Dashboard:"
    echo "  https://dashboard.stripe.com/webhooks"
else
    echo -e "${YELLOW}Manual cleanup required:${NC}"
    echo "1. Go to: https://dashboard.stripe.com/webhooks"
    echo "2. Delete all endpoints except 'greenscape-prod-webhook'"
    echo "3. Confirm greenscape-prod-webhook uses signing secret:"
    echo "   $PRODUCTION_SECRET"
fi

echo ""

# Step 3: Verify Configuration
echo "✅ Step 3: Verifying Configuration..."
echo ""

echo "Checking Supabase secrets..."
supabase secrets list --project-ref "$SUPABASE_PROJECT_REF" | grep STRIPE_WEBHOOK_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET is set in Supabase${NC}"
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET not found in Supabase${NC}"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Verify only greenscape-prod-webhook exists in Stripe Dashboard"
echo "2. Test webhook: Stripe Dashboard > Webhooks > Send test webhook"
echo "3. Check logs: supabase functions logs stripe-webhook --project-ref $SUPABASE_PROJECT_REF"
echo ""
echo -e "${GREEN}✅ Cleanup script completed${NC}"
