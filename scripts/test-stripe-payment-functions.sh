#!/bin/bash

# GreenScape Lux Stripe Payment Functions Test Suite
# Tests both get-payment-methods and create-billing-portal-session edge functions

echo "🧪 GreenScape Lux Stripe Payment Integration Test Suite"
echo "========================================================"
echo ""

# Configuration
BASE_URL="https://mwvcbedvnimabfwubazz.supabase.co/functions/v1"
TEST_CUSTOMER_ID="cus_test123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "📋 Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Test Customer ID: $TEST_CUSTOMER_ID"
echo ""

# Test 1: get-payment-methods
echo "Test 1: get-payment-methods"
echo "----------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/get-payment-methods" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$TEST_CUSTOMER_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200 OK${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  # Check for payment_methods field (snake_case)
  if echo "$BODY" | grep -q "payment_methods"; then
    echo -e "${GREEN}✅ Response contains 'payment_methods' field${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ Response missing 'payment_methods' field${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  # Check for success field
  if echo "$BODY" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✅ Response indicates success${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  Response may indicate error (check logs)${NC}"
  fi
else
  echo -e "${RED}❌ HTTP $HTTP_CODE (Expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 2: create-billing-portal-session
echo "Test 2: create-billing-portal-session"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/create-billing-portal-session" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$TEST_CUSTOMER_ID\",\"returnUrl\":\"https://greenscapelux.com/dashboard\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200 OK${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  # Check for url field
  if echo "$BODY" | grep -q "\"url\""; then
    echo -e "${GREEN}✅ Response contains 'url' field${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ Response missing 'url' field${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ HTTP $HTTP_CODE (Expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 3: CORS preflight (OPTIONS)
echo "Test 3: CORS Preflight (get-payment-methods)"
echo "---------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "$BASE_URL/get-payment-methods" \
  -H "Origin: https://greenscapelux.deploypad.app" \
  -H "Access-Control-Request-Method: POST")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ CORS preflight successful${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ CORS preflight failed (HTTP $HTTP_CODE)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Summary
echo "========================================================"
echo "📊 Test Summary"
echo "========================================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Test in browser console"
  echo "2. Click 'Manage Payment Methods' button"
  echo "3. Look for [PAYMENT_METHODS] logs"
  echo "4. Click 'Open Stripe Billing Portal' button"
  echo "5. Look for [BILLING_PORTAL] logs"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Verify STRIPE_SECRET_KEY is configured"
  echo "2. Check Supabase function logs"
  echo "3. Ensure functions are deployed"
  echo "4. Review STRIPE_INTEGRATION_DEPLOYMENT_GUIDE.md"
  exit 1
fi
