/**
 * Manual test script for unified-email function
 * Can be run with: node tests/unified-email-manual-test.js
 */

const fetch = require('node-fetch');

// Configuration - Update these with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

async function testUnifiedEmail(testName, payload, expectedStatus = 200) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseBody;
    
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Response:`, responseBody);
    
    const success = response.status === expectedStatus;
    console.log(`${success ? '✅' : '❌'} Expected ${expectedStatus}, got ${response.status}`);
    
    return { success, status: response.status, body: responseBody };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting unified-email manual tests...\n');

  const tests = [
    // Reset Password Success
    {
      name: 'Reset Password - Success',
      payload: {
        emailType: 'reset_password',
        to: 'test@example.com',
        token: 'test-reset-token-12345',
        userData: {
          email: 'test@example.com',
          firstName: 'John'
        }
      },
      expectedStatus: 200
    },
    
    // Reset Password Missing Token
    {
      name: 'Reset Password - Missing Token',
      payload: {
        emailType: 'reset_password',
        to: 'test@example.com',
        userData: {
          email: 'test@example.com',
          firstName: 'John'
        }
      },
      expectedStatus: 400
    },

    // Quote Confirmation Success
    {
      name: 'Quote Confirmation - Success',
      payload: {
        emailType: 'quote_confirmation',
        to: 'client@example.com',
        quoteData: {
          clientName: 'Jane Smith',
          services: ['Lawn Mowing'],
          estimatedCost: '$150'
        }
      },
      expectedStatus: 200
    },

    // Admin Alert Success
    {
      name: 'Admin Alert - Success',
      payload: {
        emailType: 'admin_alert',
        to: 'admin@example.com',
        alertData: {
          type: 'new_quote',
          clientName: 'Bob Johnson'
        }
      },
      expectedStatus: 200
    },

    // Contact Form Success
    {
      name: 'Contact Form - Success',
      payload: {
        emailType: 'contact_form',
        to: 'contact@example.com',
        contactData: {
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          message: 'Test message'
        }
      },
      expectedStatus: 200
    },

    // Invalid Email Type
    {
      name: 'Invalid Email Type',
      payload: {
        emailType: 'invalid_type',
        to: 'test@example.com'
      },
      expectedStatus: 400
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testUnifiedEmail(test.name, test.payload, test.expectedStatus);
    results.push({ ...test, result });
  }

  // Summary
  const passed = results.filter(r => r.result.success).length;
  const failed = results.length - passed;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testUnifiedEmail, runAllTests };