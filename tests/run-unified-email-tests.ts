#!/usr/bin/env node

/**
 * Test runner for unified-email edge function
 * Usage: npx ts-node tests/run-unified-email-tests.ts
 */

import { UnifiedEmailTester } from './unified-email-tests-part2';

async function main() {
  // Configuration
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
  
  const functionUrl = `${SUPABASE_URL}/functions/v1/unified-email`;
  
  console.log('🚀 Starting unified-email function tests...');
  console.log(`📡 Testing against: ${functionUrl}`);
  console.log('');

  // Create tester instance
  const tester = new UnifiedEmailTester(functionUrl);
  
  // Update the tester to use the actual anon key
  (tester as any).baseUrl = functionUrl;
  (tester as any).anonKey = SUPABASE_ANON_KEY;

  try {
    // Run all tests
    const results = await tester.runAllTests();
    
    // Print results
    tester.printResults(results);
    
    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { main };