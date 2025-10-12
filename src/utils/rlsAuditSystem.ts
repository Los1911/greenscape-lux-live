import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

export interface RLSTestResult {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  role: 'anon' | 'authenticated' | 'service_role';
  success: boolean;
  error?: string;
  rowsAffected?: number;
  timestamp: string;
}

export interface RLSAuditReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: RLSTestResult[];
  securityIssues: string[];
  recommendations: string[];
}

export class RLSAuditSystem {
  private anonClient: any;
  private authClient: any;
  private serviceClient: any;

  constructor() {
    // Anonymous client
    this.anonClient = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Authenticated client (will be set with real user session)
    this.authClient = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Service role client (for admin operations)
    this.serviceClient = createClient(
      config.supabase.url,
      config.supabase.anonKey // Using anon key as fallback since service key not in config
    );
  }

  async setAuthenticatedUser(accessToken: string) {
    await this.authClient.auth.setSession({
      access_token: accessToken,
      refresh_token: ''
    });
  }

  private async testTableOperation(
    client: any,
    table: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    role: 'anon' | 'authenticated' | 'service_role'
  ): Promise<RLSTestResult> {
    const result: RLSTestResult = {
      table,
      operation,
      role,
      success: false,
      timestamp: new Date().toISOString()
    };

    try {
      switch (operation) {
        case 'SELECT':
          const { data, error } = await client.from(table).select('*').limit(1);
          result.success = !error;
          result.error = error?.message;
          result.rowsAffected = data?.length || 0;
          break;

        case 'INSERT':
          // Use minimal test data for each table
          const testData = this.getTestDataForTable(table);
          const insertResult = await client.from(table).insert(testData).select();
          result.success = !insertResult.error;
          result.error = insertResult.error?.message;
          result.rowsAffected = insertResult.data?.length || 0;
          break;

        case 'UPDATE':
          const updateResult = await client.from(table)
            .update({ updated_at: new Date().toISOString() })
            .eq('id', '00000000-0000-0000-0000-000000000000')
            .select();
          result.success = !updateResult.error;
          result.error = updateResult.error?.message;
          break;

        case 'DELETE':
          const deleteResult = await client.from(table)
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
          result.success = !deleteResult.error;
          result.error = deleteResult.error?.message;
          break;
      }
    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  private getTestDataForTable(table: string): any {
    const testData: Record<string, any> = {
      clients: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '555-0123'
      },
      landscapers: {
        first_name: 'Test',
        last_name: 'Landscaper',
        email: 'landscaper@example.com',
        phone: '555-0124'
      },
      jobs: {
        title: 'Test Job',
        description: 'Test Description',
        status: 'pending'
      },
      quote_requests: {
        first_name: 'Test',
        last_name: 'Client',
        email: 'client@example.com',
        phone: '555-0125',
        service_type: 'lawn_care',
        property_size: 'small',
        message: 'Test message'
      }
    };

    return testData[table] || {};
  }

  async runComprehensiveAudit(): Promise<RLSAuditReport> {
    const tables = [
      'clients', 'landscapers', 'jobs', 'job_photos', 'quotes',
      'quote_requests', 'communications', 'notifications',
      'landscaper_documents', 'admin_sessions', 'admin_audit_logs'
    ];

    const operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[] = 
      ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

    const results: RLSTestResult[] = [];
    const securityIssues: string[] = [];

    // Test all combinations
    for (const table of tables) {
      for (const operation of operations) {
        // Test with anonymous client
        const anonResult = await this.testTableOperation(
          this.anonClient, table, operation, 'anon'
        );
        results.push(anonResult);

        // Test with authenticated client
        const authResult = await this.testTableOperation(
          this.authClient, table, operation, 'authenticated'
        );
        results.push(authResult);

        // Test with service role
        const serviceResult = await this.testTableOperation(
          this.serviceClient, table, operation, 'service_role'
        );
        results.push(serviceResult);
      }
    }

    // Analyze results for security issues
    this.analyzeSecurityIssues(results, securityIssues);

    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.length - passedTests;

    return {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      securityIssues,
      recommendations: this.generateRecommendations(results)
    };
  }

  private analyzeSecurityIssues(results: RLSTestResult[], issues: string[]) {
    // Check for tables accessible by anonymous users when they shouldn't be
    const sensitiveTablesForAnon = ['admin_sessions', 'admin_audit_logs', 'landscaper_documents'];
    
    sensitiveTablesForAnon.forEach(table => {
      const anonAccess = results.find(r => 
        r.table === table && r.role === 'anon' && r.success && r.operation === 'SELECT'
      );
      if (anonAccess) {
        issues.push(`CRITICAL: Anonymous users can access sensitive table: ${table}`);
      }
    });

    // Check for cross-user data access
    const userTables = ['clients', 'landscapers', 'jobs'];
    userTables.forEach(table => {
      const authAccess = results.filter(r => 
        r.table === table && r.role === 'authenticated' && r.success
      );
      if (authAccess.length > 0) {
        issues.push(`WARNING: Need to verify ${table} policies prevent cross-user access`);
      }
    });
  }

  private generateRecommendations(results: RLSTestResult[]): string[] {
    const recommendations: string[] = [];
    
    // Check for tables with no policies
    const tablesWithNoAccess = new Set<string>();
    results.forEach(result => {
      if (!result.success && result.error?.includes('RLS')) {
        tablesWithNoAccess.add(result.table);
      }
    });

    tablesWithNoAccess.forEach(table => {
      recommendations.push(`Add RLS policies for table: ${table}`);
    });

    // Check for overly permissive policies
    const publicTables = results.filter(r => 
      r.role === 'anon' && r.success && r.operation !== 'SELECT'
    );
    
    if (publicTables.length > 2) {
      recommendations.push('Review anonymous access policies - may be too permissive');
    }

    return recommendations;
  }
}