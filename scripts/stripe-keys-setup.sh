#!/bin/bash

# 🚨 CRITICAL: Stripe Production Keys Setup Script
# This script helps set up Stripe production keys safely

echo "🚨 STRIPE PRODUCTION KEYS SETUP"
echo "================================"
echo ""

# Check if running in production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  WARNING: Not in production environment"
    echo "Set NODE_ENV=production before running this script"
    echo ""
fi

echo "📋 CHECKLIST - Complete these steps:"
echo ""

echo "1. 🔑 GET STRIPE LIVE KEYS"
echo "   ✅ Go to: https://dashboard.stripe.com/apikeys"
echo "   ✅ Switch to LIVE mode (top-left toggle)"
echo "   ✅ Copy Secret key (sk_live_...)"
echo ""

echo "2. 🔗 CREATE WEBHOOK ENDPOINT"
echo "   ✅ Go to: https://dashboard.stripe.com/webhooks"
echo "   ✅ Click '+ Add endpoint'"
echo "   ✅ URL: https://mwvcbedvnimabfwubazz.functions.supabase.co/stripe-webhook-handler"
echo "   ✅ Events: payment_intent.succeeded, payment_intent.payment_failed"
echo "   ✅ Copy Signing secret (whsec_...)"
echo ""

echo "3. 🔧 UPDATE VERCEL ENVIRONMENT"
echo "   ✅ Go to: https://vercel.com/settings/environment-variables"
echo "   ✅ Set: STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]"
echo "   ✅ Set: VITE_STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]"
echo ""

echo "4. 🗄️  UPDATE SUPABASE SECRETS"
echo "   ✅ Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/secrets"
echo "   ✅ Add: STRIPE_SECRET_KEY"
echo "   ✅ Add: STRIPE_WEBHOOK_SECRET"
echo ""

echo "5. 🚀 DEPLOY CHANGES"
echo "   ✅ git commit --allow-empty -m 'Deploy with live Stripe keys'"
echo "   ✅ git push origin main"
echo ""

echo "6. 🧪 TEST PAYMENT FLOW"
echo "   ✅ Use test card: 4242 4242 4242 4242"
echo "   ✅ Verify webhook receives events"
echo "   ✅ Check payment processing works"
echo ""

echo "⏰ TIMELINE: Complete within 2 hours"
echo "🚨 STATUS: CRITICAL - BLOCKING PRODUCTION"
echo ""

# Validate current environment
echo "🔍 CURRENT ENVIRONMENT STATUS:"
echo "=============================="

if [ -n "$STRIPE_SECRET_KEY" ]; then
    if [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
        echo "✅ STRIPE_SECRET_KEY: Live key detected"
    elif [[ $STRIPE_SECRET_KEY == *"your_secret_key_here"* ]]; then
        echo "❌ STRIPE_SECRET_KEY: PLACEHOLDER - MUST REPLACE"
    else
        echo "⚠️  STRIPE_SECRET_KEY: Test key (not production ready)"
    fi
else
    echo "❌ STRIPE_SECRET_KEY: Missing"
fi

if [ -n "$VITE_STRIPE_WEBHOOK_SECRET" ]; then
    if [[ $VITE_STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
        echo "✅ VITE_STRIPE_WEBHOOK_SECRET: Valid format"
    elif [[ $VITE_STRIPE_WEBHOOK_SECRET == *"your_webhook_secret_here"* ]]; then
        echo "❌ VITE_STRIPE_WEBHOOK_SECRET: PLACEHOLDER - MUST REPLACE"
    else
        echo "⚠️  VITE_STRIPE_WEBHOOK_SECRET: Invalid format"
    fi
else
    echo "❌ VITE_STRIPE_WEBHOOK_SECRET: Missing"
fi

if [ -n "$VITE_STRIPE_PUBLISHABLE_KEY" ]; then
    if [[ $VITE_STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
        echo "✅ VITE_STRIPE_PUBLISHABLE_KEY: Live key ready"
    else
        echo "⚠️  VITE_STRIPE_PUBLISHABLE_KEY: Test key"
    fi
else
    echo "❌ VITE_STRIPE_PUBLISHABLE_KEY: Missing"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Replace placeholder keys with actual Stripe live keys"
echo "2. Configure webhook endpoint in Stripe dashboard"
echo "3. Deploy and test payment processing"
echo ""