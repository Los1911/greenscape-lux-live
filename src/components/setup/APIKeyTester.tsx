import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, TestTube, AlertTriangle } from 'lucide-react';
import { APIKeyValidator } from '../../lib/apiKeyValidator';
import { config } from '../../lib/config';

interface APITestResult {
  service: string;
  success: boolean;
  message: string;
  details?: string;
  isPlaceholder?: boolean;
}

export const APIKeyTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<APITestResult[]>([]);

  const testAllServices = async (): Promise<APITestResult[]> => {
    const testResults: APITestResult[] = [];

    // Test Supabase
    const supabaseUrlResult = APIKeyValidator.validateSupabaseUrl(config.supabase.url);
    const supabaseKeyResult = APIKeyValidator.validateSupabaseAnonKey(config.supabase.anonKey);
    
    testResults.push({
      service: 'Supabase URL',
      success: supabaseUrlResult.isValid,
      message: supabaseUrlResult.error || 'Configuration valid',
      isPlaceholder: supabaseUrlResult.isPlaceholder
    });

    testResults.push({
      service: 'Supabase Anon Key',
      success: supabaseKeyResult.isValid,
      message: supabaseKeyResult.error || 'Configuration valid',
      isPlaceholder: supabaseKeyResult.isPlaceholder
    });

    // Test Stripe
    const stripeResult = APIKeyValidator.validateStripePublishableKey(config.stripe.publishableKey);
    testResults.push({
      service: 'Stripe',
      success: stripeResult.isValid,
      message: stripeResult.error || 'Configuration valid',
      details: stripeResult.isValid ? 'Publishable key format correct' : undefined,
      isPlaceholder: stripeResult.isPlaceholder
    });

    // Test Google Maps
    const googleMapsResult = APIKeyValidator.validateGoogleMapsKey(config.googleMaps.apiKey);
    testResults.push({
      service: 'Google Maps',
      success: googleMapsResult.isValid,
      message: googleMapsResult.error || 'Configuration valid',
      details: googleMapsResult.isValid ? 'API key format correct' : undefined,
      isPlaceholder: googleMapsResult.isPlaceholder
    });

    // Test Resend
    const resendResult = APIKeyValidator.validateResendKey(config.resend.apiKey);
    testResults.push({
      service: 'Resend',
      success: resendResult.isValid,
      message: resendResult.error || (config.resend.apiKey ? 'Configuration valid' : 'Optional service - not configured'),
      details: resendResult.isValid ? 'API key format correct' : 'Email notifications will be limited',
      isPlaceholder: resendResult.isPlaceholder
    });

    return testResults;
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      const testResults = await testAllServices();
      setResults(testResults);
    } catch (error) {
      console.error('API testing failed:', error);
      setResults([{
        service: 'System',
        success: false,
        message: 'Failed to run API tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const getResultIcon = (result: APITestResult) => {
    if (result.isPlaceholder) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getResultBadge = (result: APITestResult) => {
    if (result.isPlaceholder) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Placeholder</Badge>;
    }
    return <Badge variant={result.success ? 'default' : 'destructive'}>
      {result.success ? 'Valid' : 'Invalid'}
    </Badge>;
  };

  const getAlertClass = (result: APITestResult) => {
    if (result.isPlaceholder) return 'border-yellow-500 bg-yellow-50';
    return result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  };

  const hasPlaceholders = results.some(r => r.isPlaceholder);
  const hasCriticalErrors = results.some(r => !r.success && !r.isPlaceholder && r.service !== 'Resend');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          API Configuration Validator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runAllTests} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating Configuration...
              </>
            ) : (
              'Validate All API Keys'
            )}
          </Button>

          {results.length > 0 && (
            <>
              {/* Summary */}
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="text-sm">
                  {hasCriticalErrors && (
                    <p className="text-red-700 font-medium">❌ Critical configuration errors detected</p>
                  )}
                  {hasPlaceholders && (
                    <p className="text-yellow-700 font-medium">⚠️ Placeholder values need replacement</p>
                  )}
                  {!hasCriticalErrors && !hasPlaceholders && (
                    <p className="text-green-700 font-medium">✅ All API keys properly configured</p>
                  )}
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Alert key={index} className={getAlertClass(result)}>
                    <div className="flex items-center gap-2">
                      {getResultIcon(result)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.service}</span>
                          {getResultBadge(result)}
                        </div>
                        <AlertDescription className="mt-1">
                          {result.message}
                          {result.details && (
                            <div className="text-xs text-gray-600 mt-1">
                              {result.details}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>

              {/* Production Warning */}
              {(hasPlaceholders || hasCriticalErrors) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <strong>Production Deployment Blocked:</strong> Fix the above issues before deploying to production.
                    Replace placeholder values with real API keys from your service providers.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};