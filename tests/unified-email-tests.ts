/**
 * Test suite for unified-email edge function
 * Tests all email types with success and failure scenarios
 */

interface TestResult {
  testName: string;
  status: number;
  body: any;
  success: boolean;
  error?: string;
}

class UnifiedEmailTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:54321/functions/v1/unified-email') {
    this.baseUrl = baseUrl;
  }

  async runTest(testName: string, payload: any, expectedStatus: number): Promise<TestResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      const success = response.status === expectedStatus;

      return {
        testName,
        status: response.status,
        body,
        success,
        error: success ? undefined : `Expected status ${expectedStatus}, got ${response.status}`
      };
    } catch (error) {
      return {
        testName,
        status: 0,
        body: null,
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Reset Password Tests
    results.push(await this.testResetPasswordSuccess());
    results.push(await this.testResetPasswordMissingToken());
    results.push(await this.testResetPasswordMissingEmail());

    // Quote Confirmation Tests
    results.push(await this.testQuoteConfirmationSuccess());
    results.push(await this.testQuoteConfirmationMissingData());

    // Admin Alert Tests
    results.push(await this.testAdminAlertSuccess());
    results.push(await this.testAdminAlertMissingData());

    // Contact Form Tests
    results.push(await this.testContactFormSuccess());
    results.push(await this.testContactFormMissingData());

    // Invalid Email Type Test
    results.push(await this.testInvalidEmailType());

    // Invalid JSON Test
    results.push(await this.testInvalidJSON());

    return results;
  }

  private async testResetPasswordSuccess(): Promise<TestResult> {
    return this.runTest('Reset Password - Success', {
      emailType: 'reset_password',
      to: 'test@example.com',
      token: 'valid-reset-token-12345',
      userData: {
        email: 'test@example.com',
        firstName: 'John'
      }
    }, 200);
  }

  private async testResetPasswordMissingToken(): Promise<TestResult> {
    return this.runTest('Reset Password - Missing Token', {
      emailType: 'reset_password',
      to: 'test@example.com',
      userData: {
        email: 'test@example.com',
        firstName: 'John'
      }
    }, 400);
  }

  private async testResetPasswordMissingEmail(): Promise<TestResult> {
    return this.runTest('Reset Password - Missing Email', {
      emailType: 'reset_password',
      token: 'valid-reset-token-12345',
      userData: {
        firstName: 'John'
      }
    }, 400);
  }
}