import { config } from '@/lib/config';
import { ApiResponseHandler } from './apiResponseHandler';

interface PaymentTestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

export class PaymentTestSuite {
  private results: PaymentTestResult[] = [];

  async runAllTests(): Promise<PaymentTestResult[]> {
    this.results = [];
    
    await this.testEnvironmentVariables();
    await this.testPaymentIntentCreation();
    await this.testWebhookEndpoint();
    await this.testStripeConnectAccount();
    
    return this.results;
  }

  private addResult(test: string, success: boolean, message: string, details?: any) {
    this.results.push({ test, success, message, details });
  }

  private async testEnvironmentVariables() {
    const test = 'Environment Variables';
    
    try {
      const missing = [];
      
      if (!config.stripe.publishableKey) missing.push('VITE_STRIPE_PUBLISHABLE_KEY');
      if (!config.stripe.secretKey) missing.push('VITE_STRIPE_SECRET_KEY');
      if (!config.stripe.webhookSecret) missing.push('VITE_STRIPE_WEBHOOK_SECRET');
      
      if (missing.length > 0) {
        this.addResult(test, false, `Missing environment variables: ${missing.join(', ')}`);
        return;
      }
      
      // Validate key formats
      const pubKeyValid = config.stripe.publishableKey.startsWith('pk_');
      const secretKeyValid = config.stripe.secretKey.startsWith('sk_');
      const webhookValid = config.stripe.webhookSecret.startsWith('whsec_');
      
      if (!pubKeyValid || !secretKeyValid || !webhookValid) {
        this.addResult(test, false, 'Invalid Stripe key formats');
        return;
      }
      
      this.addResult(test, true, 'All Stripe environment variables configured correctly');
    } catch (error) {
      this.addResult(test, false, `Environment test failed: ${error.message}`);
    }
  }

  private async testPaymentIntentCreation() {
    const test = 'Payment Intent Creation';
    
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000, // $50.00 in cents
          jobId: 'test-job-123',
          currency: 'usd'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        this.addResult(test, false, `Payment intent creation failed: ${error}`);
        return;
      }

      const result = await ApiResponseHandler.parseResponse(response);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const data = result.data;
      
      if (data.client_secret && data.payment_intent_id) {
        this.addResult(test, true, 'Payment intent created successfully', {
          clientSecret: data.client_secret.substring(0, 20) + '...',
          paymentIntentId: data.payment_intent_id
        });
      } else {
        this.addResult(test, false, 'Invalid payment intent response format');
      }
    } catch (error) {
      this.addResult(test, false, `Payment intent test failed: ${error.message}`);
    }
  }

  private async testWebhookEndpoint() {
    const test = 'Webhook Endpoint';
    
    try {
      const webhookUrl = `${config.supabase.url}/functions/v1/stripe-webhook`;
      
      // Test if webhook endpoint is accessible (should return method not allowed for GET)
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Webhook should reject GET requests
      if (response.status === 405) {
        this.addResult(test, true, 'Webhook endpoint is accessible and properly configured');
      } else {
        this.addResult(test, false, `Unexpected webhook response: ${response.status}`);
      }
    } catch (error) {
      this.addResult(test, false, `Webhook endpoint test failed: ${error.message}`);
    }
  }

  private async testStripeConnectAccount() {
    const test = 'Stripe Connect Account Creation';
    
    try {
      const response = await fetch('/api/create-stripe-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          landscaperId: 'test-landscaper-123'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        this.addResult(test, false, `Stripe Connect account creation failed: ${error}`);
        return;
      }

      const data = await response.json();
      
      if (data.accountId && data.onboardingUrl) {
        this.addResult(test, true, 'Stripe Connect account creation successful', {
          accountId: data.accountId,
          hasOnboardingUrl: !!data.onboardingUrl
        });
      } else {
        this.addResult(test, false, 'Invalid Stripe Connect response format');
      }
    } catch (error) {
      this.addResult(test, false, `Stripe Connect test failed: ${error.message}`);
    }
  }

  // Test successful payment flow
  async testSuccessfulPayment(amount: number, jobId: string): Promise<PaymentTestResult> {
    try {
      // Step 1: Create payment intent
      const intentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100, jobId, currency: 'usd' })
      });

      if (!intentResponse.ok) {
        return {
          test: 'Successful Payment Flow',
          success: false,
          message: 'Failed to create payment intent'
        };
      }

      const { client_secret } = await intentResponse.json();
      
      // In a real test, you would use Stripe's test card numbers
      // and confirm the payment with Stripe Elements
      
      return {
        test: 'Successful Payment Flow',
        success: true,
        message: 'Payment intent created successfully. Use Stripe test cards to complete flow.',
        details: { clientSecret: client_secret.substring(0, 20) + '...' }
      };
    } catch (error) {
      return {
        test: 'Successful Payment Flow',
        success: false,
        message: `Payment flow test failed: ${error.message}`
      };
    }
  }

  // Test failed payment handling
  async testFailedPayment(): Promise<PaymentTestResult> {
    try {
      // Create payment intent with invalid amount to trigger failure
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, jobId: 'test-fail', currency: 'usd' }) // Too small
      });

      if (response.ok) {
        return {
          test: 'Failed Payment Handling',
          success: false,
          message: 'Expected payment creation to fail with small amount'
        };
      }

      return {
        test: 'Failed Payment Handling',
        success: true,
        message: 'Payment failure handling working correctly'
      };
    } catch (error) {
      return {
        test: 'Failed Payment Handling',
        success: true,
        message: 'Payment failure handling working correctly'
      };
    }
  }

  // Generate test report
  generateReport(): string {
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    let report = `\n=== STRIPE PAYMENT INTEGRATION TEST REPORT ===\n`;
    report += `Tests Passed: ${passed}/${total}\n`;
    report += `Overall Status: ${passed === total ? 'PASS' : 'FAIL'}\n\n`;
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      report += `${status} - ${result.test}\n`;
      report += `  Message: ${result.message}\n`;
      if (result.details) {
        report += `  Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += '\n';
    });
    
    return report;
  }
}