import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DiagnosticResult {
  success: boolean;
  error?: string;
  message?: string;
  hint?: string;
  checks?: {
    stripeKeyValid: boolean;
    connectEnabled: boolean;
    canCreateAccounts: boolean;
  };
  details?: any;
}

export function StripeConnectDiagnostic() {
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-stripe-connect');
      
      if (error) {
        setResult({ error: error.message, success: false });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setResult({ error: err.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Stripe Connect Diagnostic</CardTitle>
        <CardDescription>
          Test your Stripe Connect configuration and identify issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={runDiagnostic} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Diagnostic
          </Button>
          
          <Button variant="outline" asChild>
            <a href="/STRIPE_CONNECT_ENABLE_GUIDE.md" target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Setup Guide
            </a>
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            {result.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            {result.checks && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getStatusIcon(result.checks.stripeKeyValid)}
                  <span className="font-medium">Stripe API Key Valid</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getStatusIcon(result.checks.connectEnabled)}
                  <span className="font-medium">Stripe Connect Enabled</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getStatusIcon(result.checks.canCreateAccounts)}
                  <span className="font-medium">Can Create Connect Accounts</span>
                </div>
              </div>
            )}

            {result.message && (
              <Alert>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {result.hint && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How to Fix:</strong> {result.hint}
                </AlertDescription>
              </Alert>
            )}

            {!result.checks?.connectEnabled && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next Steps:</strong> Follow the{' '}
                  <a 
                    href="/STRIPE_CONNECT_ENABLE_GUIDE.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    Setup Guide
                  </a>
                  {' '}to enable Stripe Connect in your dashboard.
                </AlertDescription>
              </Alert>
            )}

            {result.details && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Technical Details:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
