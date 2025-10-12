import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Key, RefreshCw, Settings } from 'lucide-react';

interface StripeKeyValidation {
  key: string;
  isValid: boolean;
  environment: 'test' | 'live' | 'unknown';
  source: 'environment' | 'fallback';
  error?: string;
}

export const StripeEnvironmentValidator: React.FC = () => {
  const [validation, setValidation] = useState<StripeKeyValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const validateStripeKey = async () => {
    setLoading(true);
    try {
      const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      const fallbackKey = 'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK';
      
      const activeKey = envKey || fallbackKey;
      const source = envKey ? 'environment' : 'fallback';
      
      let environment: 'test' | 'live' | 'unknown' = 'unknown';
      let isValid = false;
      let error: string | undefined;

      if (activeKey.startsWith('pk_test_')) {
        environment = 'test';
        isValid = true;
      } else if (activeKey.startsWith('pk_live_')) {
        environment = 'live';
        isValid = true;
      } else {
        error = 'Invalid key format - must start with pk_test_ or pk_live_';
      }

      // Test the key by attempting to load Stripe
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(activeKey);
        if (!stripe) {
          isValid = false;
          error = 'Failed to initialize Stripe with provided key';
        }
      } catch (stripeError: any) {
        isValid = false;
        error = `Stripe initialization error: ${stripeError.message}`;
      }

      setValidation({
        key: activeKey,
        isValid,
        environment,
        source,
        error
      });
      setLastChecked(new Date());
    } catch (err: any) {
      setValidation({
        key: 'Error loading key',
        isValid: false,
        environment: 'unknown',
        source: 'environment',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateStripeKey();
  }, []);

  const getEnvironmentBadge = () => {
    if (!validation) return null;
    
    const { environment, isValid } = validation;
    
    if (!isValid) {
      return <Badge variant="destructive">Invalid</Badge>;
    }
    
    switch (environment) {
      case 'test':
        return <Badge variant="secondary">Test Mode</Badge>;
      case 'live':
        return <Badge variant="default" className="bg-green-600">Live Mode</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSourceBadge = () => {
    if (!validation) return null;
    
    const { source } = validation;
    
    return source === 'environment' 
      ? <Badge variant="outline" className="bg-blue-50">Environment Variable</Badge>
      : <Badge variant="outline" className="bg-orange-50">Fallback Key</Badge>;
  };

  const maskKey = (key: string) => {
    if (key.length <= 20) return key;
    return `${key.substring(0, 15)}...${key.substring(key.length - 8)}`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Stripe Environment Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Current Configuration</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={validateStripeKey}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </Button>
        </div>

        {validation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {validation.isValid ? 'Valid Configuration' : 'Configuration Issues'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Environment</label>
                <div className="mt-1">{getEnvironmentBadge()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Source</label>
                <div className="mt-1">{getSourceBadge()}</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Publishable Key</label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono">
                {maskKey(validation.key)}
              </div>
            </div>

            {validation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validation.error}</AlertDescription>
              </Alert>
            )}

            {validation.source === 'fallback' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Using fallback key. Set VITE_STRIPE_PUBLISHABLE_KEY environment variable.
                </AlertDescription>
              </Alert>
            )}

            {lastChecked && (
              <div className="text-xs text-gray-500">
                Last validated: {lastChecked.toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Environment Setup Instructions</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>1. Go to Vercel Dashboard → Settings → Environment Variables</p>
            <p>2. Add VITE_STRIPE_PUBLISHABLE_KEY with your live key</p>
            <p>3. Redeploy your application</p>
            <p>4. Run validation to confirm setup</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};