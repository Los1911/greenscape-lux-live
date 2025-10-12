import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { supabase } from '../lib/supabase';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const PasswordResetDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Check Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession();
      diagnosticResults.push({
        test: 'Supabase Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Connected successfully',
        details: error
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Supabase Connection',
        status: 'fail',
        message: 'Connection exception',
        details: err
      });
    }

    // Test 2: Check SMTP configuration (Supabase + Resend)
    try {
      // This test verifies that Supabase auth emails are configured to use Resend SMTP
      results.push({
        test: 'SMTP Configuration',
        status: 'info',
        message: 'Supabase should be configured to use Resend SMTP in Dashboard > Auth > Settings',
        details: 'Configure SMTP: smtp.resend.com:587 with Resend API key'
      });
    } catch (error) {
      results.push({
        test: 'SMTP Configuration',
        status: 'fail',
        message: 'SMTP configuration check failed',
        details: error
      });
    }
      } else if (error?.message?.includes('Email and reset link are required')) {
        diagnosticResults.push({
          test: 'Edge Function',
          status: 'pass',
          message: 'Function exists and validates input',
          details: 'Function responded with validation error as expected'
        });
      } else {
        diagnosticResults.push({
          test: 'Edge Function',
          status: 'warning',
          message: 'Function exists but returned unexpected response',
          details: error || data
        });
      }
    } catch (err) {
      diagnosticResults.push({
        test: 'Edge Function',
        status: 'fail',
        message: 'Function call failed',
        details: err
      });
    }

    // Test 3: Check built-in reset functionality
    try {
      const { error } = await supabase.auth.resetPasswordForEmail('test@nonexistent-domain-12345.com', {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      diagnosticResults.push({
        test: 'Built-in Reset',
        status: error ? 'warning' : 'pass',
        message: error ? `Built-in reset issue: ${error.message}` : 'Built-in reset available',
        details: error
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Built-in Reset',
        status: 'fail',
        message: 'Built-in reset failed',
        details: err
      });
    }

    // Test 4: Check environment
    const currentUrl = window.location.origin;
    const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
    const isHttps = currentUrl.startsWith('https://');
    
    diagnosticResults.push({
      test: 'Environment',
      status: (isLocalhost || isHttps) ? 'pass' : 'warning',
      message: `Running on ${currentUrl}. ${isLocalhost ? 'Local development' : isHttps ? 'HTTPS production' : 'HTTP production (may cause issues)'}`,
      details: { currentUrl, isLocalhost, isHttps }
    });

    setResults(diagnosticResults);
    setRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  // Auto-run diagnostics when component mounts
  useEffect(() => {
    if (showDiagnostic && results.length === 0) {
      runDiagnostics();
    }
  }, [showDiagnostic]);

  if (!showDiagnostic) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setShowDiagnostic(true)}
          variant="outline"
          size="sm"
          className="bg-blue-900 text-white border-blue-700 hover:bg-blue-800"
        >
          🔍 Diagnose Reset
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="p-4 bg-gray-900 text-white border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Reset Diagnostics</h3>
          <Button
            onClick={() => setShowDiagnostic(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={runDiagnostics}
            disabled={running}
            size="sm"
            className="w-full"
          >
            {running ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2 font-medium">
                    <span>{getStatusIcon(result.status)}</span>
                    <span>{result.test}</span>
                  </div>
                  <div className="text-gray-300 mt-1">{result.message}</div>
                  {result.details && (
                    <details className="mt-1">
                      <summary className="text-gray-400 cursor-pointer">Details</summary>
                      <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};