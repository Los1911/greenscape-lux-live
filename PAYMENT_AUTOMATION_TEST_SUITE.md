# GreenScape Lux Payment Automation Test Suite

## Overview
Comprehensive automated testing suite that validates end-to-end payment flows, subscriptions, webhooks, and commission payouts for the GreenScape Lux platform.

## Test Suite Components

### 1. PaymentTestSuite.ts (Main Orchestrator)
- **Purpose**: Coordinates all payment testing modules
- **Features**:
  - Configurable test environments (test/staging/production)
  - Comprehensive reporting and monitoring
  - Retry logic and timeout handling
  - Test result aggregation and analysis

### 2. OneTimePaymentTests.ts
**Tests Covered**:
- ✅ Successful payment processing
- ❌ Declined card handling
- 💳 Insufficient funds scenarios
- 📅 Expired card validation
- 🔒 Invalid CVC handling
- 📊 Metadata flow verification
- 💰 Commission calculation accuracy
- 🧾 Receipt generation

### 3. SubscriptionTests.ts
**Tests Covered**:
- 🆕 Subscription creation
- ⬆️ Subscription upgrades
- ⬇️ Subscription downgrades
- ❌ Subscription cancellation
- 💸 Failed payment handling
- 💲 Proration calculations
- 🆓 Trial period management
- 🔔 Billing cycle webhooks

### 4. WebhookTests.ts
**Tests Covered**:
- ✅ payment_intent.succeeded
- ❌ payment_intent.failed
- 💰 invoice.payment_succeeded
- 💸 invoice.payment_failed
- 🔄 customer.subscription.updated
- 🗑️ customer.subscription.deleted
- 🔐 Webhook signature validation
- 🔄 Idempotency handling

### 5. CommissionPayoutTests.ts
**Tests Covered**:
- 🧮 Commission calculation (85% to landscaper)
- 💳 Payout creation and processing
- 📅 Payout scheduling
- 💵 Minimum payout threshold ($50)
- ❌ Payout failure handling
- 📄 Tax document generation
- 📊 Multiple job commission aggregation

### 6. RefundTests.ts
**Tests Covered**:
- 🔄 Full refund processing
- ↩️ Partial refund handling
- 💰 Commission adjustment calculations
- 🔔 Refund webhook processing
- 📝 Refund reason tracking

### 7. ErrorScenarioTests.ts
**Tests Covered**:
- ⏱️ Network timeout handling
- 🔑 Invalid API key validation
- 🚦 Rate limiting scenarios
- 💾 Database connection failures
- 🔄 Webhook retry logic
- ⚡ Concurrent payment processing
- 🚫 Malformed request handling

## Usage Instructions

### Running the Full Test Suite
```typescript
import { PaymentTestSuite } from './src/tests/payment-automation/PaymentTestSuite';

const config = {
  environment: 'test',
  stripeTestMode: true,
  maxRetries: 3,
  timeoutMs: 30000,
  reportingEnabled: true
};

const testSuite = new PaymentTestSuite(config);
await testSuite.runFullSuite();
```

### Running Individual Test Modules
```typescript
// One-time payments only
const oneTimeTests = new OneTimePaymentTests(config);
const results = await oneTimeTests.runAllTests();

// Subscriptions only
const subscriptionTests = new SubscriptionTests(config);
const results = await subscriptionTests.runAllTests();
```

## Test Configuration

### Environment Settings
- **test**: Uses mock Stripe responses
- **staging**: Uses Stripe test keys with real API calls
- **production**: Uses live Stripe keys (USE WITH CAUTION)

### Required Environment Variables
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_APP_URL=https://your-app.vercel.app
```

## Test Scenarios Covered

### Payment Success Flows
1. **Standard Payment**: $150 lawn mowing service
2. **High-Value Payment**: $500 landscape design
3. **Low-Value Payment**: $50 hedge trimming
4. **Recurring Payment**: Monthly subscription billing

### Payment Failure Flows
1. **Declined Cards**: Generic decline, insufficient funds
2. **Invalid Cards**: Expired, invalid CVC, invalid number
3. **Network Issues**: Timeouts, connection failures
4. **API Errors**: Invalid keys, rate limiting

### Commission Scenarios
1. **Standard Commission**: 85% to landscaper, 15% platform fee
2. **Multiple Jobs**: Aggregated commissions for single landscaper
3. **Refund Adjustments**: Commission clawback on refunds
4. **Minimum Thresholds**: $50 minimum payout requirement

### Webhook Validation
1. **Signature Verification**: Valid and invalid signatures
2. **Event Processing**: All critical Stripe events
3. **Retry Logic**: Failed webhook endpoint recovery
4. **Idempotency**: Duplicate event handling

## Reporting Features

### Test Results Dashboard
- ✅ Pass/Fail rates by category
- ⏱️ Performance metrics and timing
- 📊 Historical trend analysis
- 🚨 Failure pattern identification

### Monitoring Integration
- 📈 Real-time test execution monitoring
- 🔔 Automated failure notifications
- 📋 Detailed error logging and tracking
- 📊 Performance regression detection

## Continuous Integration

### Automated Test Execution
- **Pre-deployment**: Run full suite before production deployment
- **Scheduled**: Daily health checks of payment systems
- **Triggered**: Run tests after Stripe configuration changes

### Test Data Management
- **Cleanup**: Automatic test data cleanup after execution
- **Isolation**: Each test uses unique identifiers
- **Reproducibility**: Consistent test data generation

## Security Considerations

### API Key Management
- ✅ Separate test/live key validation
- 🔒 Secure key storage and rotation
- 🚫 No hardcoded keys in test files

### Webhook Security
- ✅ Signature validation testing
- 🔐 Endpoint authentication verification
- 🛡️ HTTPS-only webhook endpoints

## Performance Benchmarks

### Expected Test Execution Times
- **One-time Payments**: ~30 seconds (8 tests)
- **Subscriptions**: ~45 seconds (8 tests)
- **Webhooks**: ~25 seconds (8 tests)
- **Commissions**: ~35 seconds (7 tests)
- **Refunds**: ~20 seconds (5 tests)
- **Error Scenarios**: ~40 seconds (7 tests)
- **Full Suite**: ~3-4 minutes (43 total tests)

### Success Rate Targets
- **Production Readiness**: >95% pass rate
- **Staging Environment**: >90% pass rate
- **Development**: >85% pass rate

## Troubleshooting Guide

### Common Test Failures
1. **API Key Issues**: Verify environment variables
2. **Network Timeouts**: Check Stripe API status
3. **Webhook Failures**: Validate endpoint configuration
4. **Commission Errors**: Verify calculation logic

### Debug Mode
Enable detailed logging by setting `DEBUG=true` in test configuration.

## Next Steps for Implementation

1. **Environment Setup**: Configure Stripe test keys
2. **Webhook Endpoints**: Set up webhook URL in Stripe dashboard
3. **Database Integration**: Connect to Supabase for commission tracking
4. **CI/CD Integration**: Add to deployment pipeline
5. **Monitoring Setup**: Configure alerting for test failures

This comprehensive test suite ensures the GreenScape Lux payment system is robust, reliable, and ready for production use.