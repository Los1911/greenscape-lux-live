#!/bin/bash

# Stripe Payment Functions Deployment Script
# GreenScape Lux - Project: mwvcbedvnimabfwubazz

echo "=================================================="
echo "🚀 Stripe Payment Functions Deployment"
echo "=================================================="
echo ""

PROJECT_REF="mwvcbedvnimabfwubazz"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "📅 Deployment Time: $TIMESTAMP"
echo "🎯 Project: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Deploy get-payment-methods
echo "📦 Deploying get-payment-methods..."
supabase functions deploy get-payment-methods --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ get-payment-methods deployed successfully"
else
    echo "❌ get-payment-methods deployment failed"
    exit 1
fi

echo ""

# Deploy create-billing-portal-session
echo "📦 Deploying create-billing-portal-session..."
supabase functions deploy create-billing-portal-session --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ create-billing-portal-session deployed successfully"
else
    echo "❌ create-billing-portal-session deployment failed"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ All functions deployed successfully!"
echo "=================================================="
echo ""

# Run verification tests
echo "🧪 Running verification tests..."
echo ""

bash scripts/test-stripe-payment-functions.sh

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "📊 Next Steps:"
echo "1. Check Supabase Dashboard for function logs"
echo "2. Verify STRIPE_SECRET_KEY is set in Edge Function Secrets"
echo "3. Test frontend integration in PaymentMethodManager.tsx"
echo "4. Monitor console for [PAYMENT_METHODS] and [BILLING_PORTAL] logs"
echo ""
