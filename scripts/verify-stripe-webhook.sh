#!/bin/bash

# 🔍 Stripe Webhook Verification Script for GreenScape Lux
# This script verifies that Stripe webhook is properly configured

echo "🔍 Stripe Webhook Verification for GreenScape Lux"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Verify Supabase secret exists
echo "📋 Step 1: Checking Supabase secrets..."
if supabase secrets list | grep -q "STRIPE_WEBHOOK_SECRET"; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET is configured${NC}"
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET is NOT configured${NC}"
    echo "   Fix: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret"
    exit 1
fi
echo ""

# Check 2: Verify webhook endpoint is accessible
echo "📋 Step 2: Testing webhook endpoint..."
WEBHOOK_URL="https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $WEBHOOK_URL)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Webhook endpoint returned HTTP $HTTP_CODE${NC}"
    echo "   Expected: 200 or 400"
    exit 1
fi
echo ""

# Check 3: View recent webhook logs
echo "📋 Step 3: Checking recent webhook logs..."
echo "Recent webhook activity:"
supabase functions logs stripe-webhook --tail 10
echo ""

# Check 4: Verify Stripe webhook configuration
echo "📋 Step 4: Manual verification steps..."
echo -e "${YELLOW}⚠️  Please verify manually in Stripe Dashboard:${NC}"
echo "   1. Go to: https://dashboard.stripe.com/webhooks"
echo "   2. Verify endpoint exists: $WEBHOOK_URL"
echo "   3. Verify events are enabled:"
echo "      - payment_intent.succeeded"
echo "      - payment_intent.payment_failed"
echo "      - charge.refunded"
echo ""

# Summary
echo "=================================================="
echo "✅ Webhook verification complete!"
echo ""
echo "Next steps:"
echo "1. Test webhook from Stripe Dashboard"
echo "2. Make a test payment at https://greenscapelux.com"
echo "3. Verify events appear in Stripe Dashboard → Events"
echo ""
