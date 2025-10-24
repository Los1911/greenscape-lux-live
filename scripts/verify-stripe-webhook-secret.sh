#!/bin/bash

# Verify Stripe Webhook Secret Configuration
# This script tests that the webhook secret is correctly configured

set -e

echo "🔍 Stripe Webhook Secret Verification"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

EXPECTED_SECRET="whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o"
FUNCTION_URL="https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook"

echo "Expected Secret: $EXPECTED_SECRET"
echo "Function URL: $FUNCTION_URL"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install: npm install -g supabase"
    exit 1
fi

# List secrets (won't show values)
echo "📋 Checking Supabase Secrets..."
echo ""
supabase secrets list | grep STRIPE_WEBHOOK_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET is configured${NC}"
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET not found${NC}"
    echo "Run: supabase secrets set STRIPE_WEBHOOK_SECRET=$EXPECTED_SECRET"
    exit 1
fi

echo ""
echo "🧪 Testing Webhook Endpoint..."
echo ""
echo -e "${YELLOW}Manual verification required:${NC}"
echo ""
echo "1. Go to Stripe Dashboard:"
echo "   https://dashboard.stripe.com/webhooks"
echo ""
echo "2. Find endpoint: greenscape-prod-webhook"
echo "   URL should be: $FUNCTION_URL"
echo ""
echo "3. Click 'Send test webhook'"
echo "   - Select event: payment_intent.succeeded"
echo "   - Click 'Send test webhook'"
echo ""
echo "4. Check response:"
echo "   ✅ Should return: 200 OK"
echo "   ✅ Response body: {\"received\":true}"
echo ""
echo "5. View Edge Function logs:"
echo "   https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/functions/stripe-webhook/logs"
echo ""
echo "Expected log output:"
echo "  🔔 Verified Event: payment_intent.succeeded"
echo "  ✅ Response: 200 OK"
echo ""
echo -e "${GREEN}✅ Verification steps provided${NC}"
echo ""
echo "If webhook test succeeds with 200 OK, your secret is correctly configured!"
