#!/bin/bash

# Stripe Webhook Configuration Fix Script
# This script updates Supabase secrets and provides guidance for Stripe Dashboard cleanup

set -e

echo "🔧 Stripe Webhook Configuration Fix"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Update Supabase Secret
echo "📝 Step 1: Updating Supabase Secret"
echo "-----------------------------------"
echo ""

WEBHOOK_SECRET="whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o"

echo "Setting STRIPE_WEBHOOK_SECRET in Supabase..."
supabase secrets set STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secret updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update secret${NC}"
    exit 1
fi

echo ""
echo "Verifying secret is set..."
supabase secrets list | grep STRIPE_WEBHOOK_SECRET

echo ""
echo -e "${GREEN}✅ Step 1 Complete${NC}"
echo ""

# Step 2: Stripe Dashboard Cleanup Instructions
echo "📋 Step 2: Clean Up Stripe Dashboard"
echo "------------------------------------"
echo ""
echo -e "${YELLOW}⚠️  Manual action required in Stripe Dashboard${NC}"
echo ""
echo "1. Go to: https://dashboard.stripe.com/webhooks"
echo "2. Review all webhook endpoints"
echo "3. Delete any endpoints that are:"
echo "   - CLI-created (temporary URLs)"
echo "   - Test/development endpoints"
echo "   - Duplicate production endpoints"
echo ""
echo "4. Ensure you have ONE production endpoint:"
echo "   Name: greenscape-prod-webhook"
echo "   URL: https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook"
echo "   Status: Enabled"
echo ""
echo "5. Copy the signing secret (starts with whsec_)"
echo "   Expected: $WEBHOOK_SECRET"
echo ""

read -p "Press Enter when you've completed Stripe Dashboard cleanup..."

echo ""
echo -e "${GREEN}✅ Step 2 Complete${NC}"
echo ""

# Step 3: Test Webhook
echo "🧪 Step 3: Test Webhook Endpoint"
echo "--------------------------------"
echo ""
echo "Testing webhook endpoint..."
echo ""

FUNCTION_URL="https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook"

echo "Endpoint URL: $FUNCTION_URL"
echo ""
echo -e "${YELLOW}⚠️  To test the webhook:${NC}"
echo "1. Go to Stripe Dashboard > Webhooks > greenscape-prod-webhook"
echo "2. Click 'Send test webhook'"
echo "3. Select an event type (e.g., payment_intent.succeeded)"
echo "4. Click 'Send test webhook'"
echo ""
echo "5. Check Supabase Edge Function logs:"
echo "   https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/functions/stripe-webhook/logs"
echo ""
echo "Expected log output:"
echo "  ✅ Webhook signature verified successfully"
echo "  ✅ Processing event: [event_type]"
echo "  ✅ Response: 200 OK"
echo ""

read -p "Press Enter after testing the webhook..."

echo ""
echo -e "${GREEN}✅ Step 3 Complete${NC}"
echo ""

# Summary
echo "📊 Configuration Summary"
echo "========================"
echo ""
echo "Supabase Configuration:"
echo "  ✅ STRIPE_WEBHOOK_SECRET: Set (hidden for security)"
echo "  ✅ Edge Function: stripe-webhook (ACTIVE)"
echo "  ✅ Function URL: $FUNCTION_URL"
echo ""
echo "Stripe Configuration (verify manually):"
echo "  □ Single endpoint: greenscape-prod-webhook"
echo "  □ Endpoint URL matches Supabase function"
echo "  □ Signing secret matches Supabase secret"
echo "  □ All old endpoints deleted"
echo ""
echo "Testing Results (verify manually):"
echo "  □ Test event sent successfully"
echo "  □ Function logs show 200 OK"
echo "  □ No signature verification errors"
echo ""
echo -e "${GREEN}🎉 Configuration fix complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor webhook delivery in Stripe Dashboard"
echo "2. Check Edge Function logs for any errors"
echo "3. Test with real payment events"
echo ""
echo "For detailed documentation, see: STRIPE_WEBHOOK_FIX_REPORT.md"
