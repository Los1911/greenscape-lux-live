#!/usr/bin/env node

/**
 * Email Deliverability Checker Script
 * Tests various aspects of email delivery through Resend API
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = process.argv[2] || 'test@example.com';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable not set');
  process.exit(1);
}

async function testEmailDeliverability() {
  console.log('🔍 Email Deliverability Diagnostic');
  console.log('=====================================');
  console.log(`Target Email: ${TEST_EMAIL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    basicTest: null,
    authenticationTest: null,
    contentTest: null,
    spamTest: null
  };

  // Test 1: Basic Email
  console.log('📧 Test 1: Basic Email Delivery');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@greenscapelux.com',
        to: [TEST_EMAIL],
        subject: 'Deliverability Test - Basic',
        html: '<p>Basic test email. If received, basic delivery works.</p>',
        text: 'Basic test email. If received, basic delivery works.'
      })
    });

    const result = await response.json();
    results.basicTest = { status: response.status, result };
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${result.id || 'N/A'}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}\n`);
  } catch (error) {
    results.basicTest = { error: error.message };
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 2: Authentication Check
  console.log('🔐 Test 2: Domain Authentication');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'support@greenscapelux.com', // Different from address
        to: [TEST_EMAIL],
        subject: 'Authentication Test',
        html: '<p>Testing domain authentication with different from address.</p>'
      })
    });

    const result = await response.json();
    results.authenticationTest = { status: response.status, result };
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${result.id || 'N/A'}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}\n`);
  } catch (error) {
    results.authenticationTest = { error: error.message };
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Rich Content
  console.log('🎨 Test 3: Rich HTML Content');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@greenscapelux.com',
        to: [TEST_EMAIL],
        subject: 'Rich Content Test',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>GreenScape Lux</h1>
              <p>Premium Landscaping Services</p>
            </div>
            <div style="padding: 20px;">
              <h2>Rich Content Test</h2>
              <p>This email contains:</p>
              <ul>
                <li>HTML styling</li>
                <li>Images and colors</li>
                <li>Structured layout</li>
              </ul>
              <a href="https://greenscapelux.com" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Website</a>
            </div>
          </div>
        `
      })
    });

    const result = await response.json();
    results.contentTest = { status: response.status, result };
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${result.id || 'N/A'}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}\n`);
  } catch (error) {
    results.contentTest = { error: error.message };
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 4: Potential Spam Triggers
  console.log('🚨 Test 4: Spam Filter Test');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@greenscapelux.com',
        to: [TEST_EMAIL],
        subject: 'URGENT: Free Money - Act Now!!!',
        html: '<p>FREE MONEY! CLICK HERE NOW! Limited time offer! Act fast!</p>'
      })
    });

    const result = await response.json();
    results.spamTest = { status: response.status, result };
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${result.id || 'N/A'}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}\n`);
  } catch (error) {
    results.spamTest = { error: error.message };
    console.log(`   Error: ${error.message}\n`);
  }

  // Summary
  console.log('📊 Summary & Recommendations');
  console.log('===============================');
  
  const successCount = Object.values(results).filter(r => r && r.status === 200).length;
  console.log(`✅ Successful sends: ${successCount}/4`);
  
  if (successCount === 4) {
    console.log('\n🎉 All tests passed! If emails still not reaching inbox:');
    console.log('   • Check spam/junk folders');
    console.log('   • Verify domain authentication (SPF, DKIM, DMARC)');
    console.log('   • Test with different email providers');
    console.log('   • Monitor Resend dashboard for delivery status');
  } else {
    console.log('\n⚠️  Some tests failed. Check:');
    console.log('   • Domain verification in Resend dashboard');
    console.log('   • From address authentication');
    console.log('   • API key permissions');
  }

  return results;
}

// Run the test
testEmailDeliverability().catch(console.error);