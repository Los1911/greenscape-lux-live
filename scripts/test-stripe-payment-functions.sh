#!/bin/bash
# Stripe Payment Function Test Suite for GreenScape Lux
# Tests both get-payment-methods and create-billing-portal-session endpoints

PROJECT_REF="mwvcbedvnimabfwubazz"
BASE_URL="https://$PROJECT_REF.supabase.co/functions/v1"

echo "🔍 Testing Stripe payment functions for GreenScape Lux..."
echo ""

# Test 1: get-payment-methods
echo "🧾 Testing get-payment-methods..."
curl -i -X GET "$BASE_URL/get-payment-methods"
echo ""

# Test 2: create-billing-portal-session
echo "💳 Testing create-billing-portal-session..."
curl -i -X POST "$BASE_URL/create-billing-portal-session" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"cus_test_123"}'
echo ""

echo "✅ Test suite completed. Check above responses for HTTP 200 and valid JSON structure."
