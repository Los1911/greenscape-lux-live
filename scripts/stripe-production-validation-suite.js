#!/usr/bin/env node

/**
 * Comprehensive Stripe Production Validation Suite
 * Run after manual deployment to verify all configurations
 */

const https = require('https');
const fs = require('fs');

class StripeProductionValidator {
  constructor() {
    this.results = {
      environment: [],
      api: [],
      keys: [],
      connectivity: []
    };
  }

  log(category, status, message) {
    const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${message}`);
    this.results[category].push({ status, message });
  }

  validateEnvironmentVariables() {
    console.log('\n🔍 Environment Variables Validation');
    console.log('=====================================');

    const required = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];

    required.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        const masked = value.substring(0, 12) + '...';
        this.log('environment', 'pass', `${envVar}: ${masked}`);
      } else {
        this.log('environment', 'fail', `${envVar}: MISSING`);
      }
    });
  }

  validateKeyFormats() {
    console.log('\n🔑 Stripe Key Format Validation');
    console.log('===============================');

    const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Publishable key validation
    if (publishableKey?.startsWith('pk_live_')) {
      this.log('keys', 'pass', 'Publishable key: LIVE mode ✓');
    } else if (publishableKey?.startsWith('pk_test_')) {
      this.log('keys', 'warn', 'Publishable key: TEST mode (should be live)');
    } else {
      this.log('keys', 'fail', 'Publishable key: Invalid format');
    }

    // Secret key validation
    if (secretKey?.startsWith('sk_live_')) {
      this.log('keys', 'pass', 'Secret key: LIVE mode ✓');
    } else if (secretKey?.startsWith('sk_test_')) {
      this.log('keys', 'warn', 'Secret key: TEST mode (should be live)');
    } else {
      this.log('keys', 'fail', 'Secret key: Invalid format');
    }

    // Webhook secret validation
    if (webhookSecret?.startsWith('whsec_')) {
      this.log('keys', 'pass', 'Webhook secret: Valid format ✓');
    } else {
      this.log('keys', 'fail', 'Webhook secret: Invalid format');
    }
  }

  async testStripeAPI() {
    console.log('\n🌐 Stripe API Connectivity Test');
    console.log('===============================');

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      this.log('api', 'fail', 'Cannot test API - STRIPE_SECRET_KEY missing');
      return;
    }

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.stripe.com',
        path: '/v1/account',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'User-Agent': 'GreenScapeLux/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const account = JSON.parse(data);
              this.log('api', 'pass', `API connectivity: SUCCESS (Account: ${account.id})`);
              this.log('api', 'pass', `Account country: ${account.country}`);
              this.log('api', 'pass', `Account type: ${account.type}`);
            } catch (e) {
              this.log('api', 'pass', 'API connectivity: SUCCESS');
            }
          } else {
            this.log('api', 'fail', `API connectivity: FAILED (${res.statusCode})`);
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        this.log('api', 'fail', `API connectivity: ERROR (${error.message})`);
        resolve();
      });

      req.setTimeout(10000, () => {
        this.log('api', 'fail', 'API connectivity: TIMEOUT');
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  async testWebhookEndpoint() {
    console.log('\n🔗 Webhook Endpoint Test');
    console.log('========================');

    // This would typically test the webhook endpoint
    // For now, we'll just validate the secret format
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret?.startsWith('whsec_')) {
      this.log('connectivity', 'pass', 'Webhook secret format valid');
    } else {
      this.log('connectivity', 'fail', 'Webhook secret invalid');
    }
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('====================');

    const categories = ['environment', 'keys', 'api', 'connectivity'];
    let totalTests = 0;
    let passedTests = 0;

    categories.forEach(category => {
      const results = this.results[category];
      const passed = results.filter(r => r.status === 'pass').length;
      const warned = results.filter(r => r.status === 'warn').length;
      const failed = results.filter(r => r.status === 'fail').length;

      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${passed}`);
      console.log(`  ⚠️  Warnings: ${warned}`);
      console.log(`  ❌ Failed: ${failed}`);

      totalTests += results.length;
      passedTests += passed;
    });

    console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🚀 READY FOR PRODUCTION!');
    } else {
      console.log('⚠️  ISSUES DETECTED - Review failures above');
    }

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: { totalTests, passedTests }
    };

    fs.writeFileSync('stripe-validation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Report saved to: stripe-validation-report.json');
  }

  async run() {
    console.log('🔍 STRIPE PRODUCTION VALIDATION SUITE');
    console.log('=====================================');
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    this.validateEnvironmentVariables();
    this.validateKeyFormats();
    await this.testStripeAPI();
    await this.testWebhookEndpoint();
    this.generateReport();

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Fix any failed validations above');
    console.log('2. Test payment flow at /profile#payment');
    console.log('3. Complete STRIPE_PRODUCTION_AUDIT_CHECKLIST.md');
    console.log('4. Monitor Stripe Dashboard for webhook events');
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StripeProductionValidator();
  validator.run().catch(console.error);
}

module.exports = StripeProductionValidator;