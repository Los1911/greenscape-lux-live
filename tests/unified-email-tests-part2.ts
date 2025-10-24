/**
 * Continuation of unified-email test methods
 */

// Continuing the UnifiedEmailTester class methods...

  private async testQuoteConfirmationSuccess(): Promise<TestResult> {
    return this.runTest('Quote Confirmation - Success', {
      emailType: 'quote_confirmation',
      to: 'client@example.com',
      quoteData: {
        clientName: 'Jane Smith',
        clientEmail: 'client@example.com',
        services: ['Lawn Mowing', 'Hedge Trimming'],
        propertySize: '1/4 acre',
        estimatedCost: '$150',
        quoteId: 'Q-12345'
      }
    }, 200);
  }

  private async testQuoteConfirmationMissingData(): Promise<TestResult> {
    return this.runTest('Quote Confirmation - Missing Data', {
      emailType: 'quote_confirmation',
      to: 'client@example.com'
      // Missing quoteData
    }, 500);
  }

  private async testAdminAlertSuccess(): Promise<TestResult> {
    return this.runTest('Admin Alert - Success', {
      emailType: 'admin_alert',
      to: 'admin@example.com',
      alertData: {
        type: 'new_quote_request',
        clientName: 'Bob Johnson',
        clientEmail: 'bob@example.com',
        services: ['Tree Removal'],
        urgency: 'high',
        timestamp: new Date().toISOString()
      }
    }, 200);
  }

  private async testAdminAlertMissingData(): Promise<TestResult> {
    return this.runTest('Admin Alert - Missing Data', {
      emailType: 'admin_alert',
      to: 'admin@example.com'
      // Missing alertData
    }, 500);
  }

  private async testContactFormSuccess(): Promise<TestResult> {
    return this.runTest('Contact Form - Success', {
      emailType: 'contact_form',
      to: 'contact@example.com',
      contactData: {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        phone: '555-0123',
        message: 'I need landscaping services for my backyard.',
        subject: 'Landscaping Inquiry'
      }
    }, 200);
  }

  private async testContactFormMissingData(): Promise<TestResult> {
    return this.runTest('Contact Form - Missing Data', {
      emailType: 'contact_form',
      to: 'contact@example.com'
      // Missing contactData
    }, 500);
  }

  private async testInvalidEmailType(): Promise<TestResult> {
    return this.runTest('Invalid Email Type', {
      emailType: 'invalid_type',
      to: 'test@example.com'
    }, 400);
  }

  private async testInvalidJSON(): Promise<TestResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
        },
        body: 'invalid json string'
      });

      const body = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
      
      return {
        testName: 'Invalid JSON Payload',
        status: response.status,
        body,
        success: response.status === 400,
        error: response.status !== 400 ? `Expected status 400, got ${response.status}` : undefined
      };
    } catch (error) {
      return {
        testName: 'Invalid JSON Payload',
        status: 0,
        body: null,
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  }

  printResults(results: TestResult[]): void {
    console.log('\n=== UNIFIED EMAIL FUNCTION TEST RESULTS ===\n');
    
    let passed = 0;
    let failed = 0;

    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.testName}`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Body: ${JSON.stringify(result.body, null, 2)}`);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      
      console.log('');
      
      if (result.success) passed++;
      else failed++;
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  }
}

// Export for use in other files
export { UnifiedEmailTester, TestResult };