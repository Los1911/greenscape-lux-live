import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Key, RefreshCw } from 'lucide-react';

export const StripeKeyValidator: React.FC = () => {
  const [keyStatus, setKeyStatus] = useState<{
    isValid: boolean;
    message: string;
    keyPreview?: string;
    environment?: string;
  }>({ isValid: false, message: 'Checking...' });
  const [loading, setLoading] = useState(true);

  const validateStripeKey = async () => {
    setLoading(true);
    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripeKey) {
        setKeyStatus({
          isValid: false,
          message: 'VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set'
        });
        return;
      }

      if (!stripeKey.startsWith('pk_')) {
        setKeyStatus({
          isValid: false,
          message: 'Invalid Stripe key format. Must start with "pk_"',
          keyPreview: stripeKey.substring(0, 20) + '...'
        });
        return;
      }

      const environment = stripeKey.startsWith('pk_live_') ? 'Live' : 'Test';
      const keyPreview = stripeKey.substring(0, 20) + '...';

      // Test the key by trying to load Stripe
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(stripeKey);
        
        if (stripe) {
          setKeyStatus({
            isValid: true,
            message: `Stripe key is valid and loaded successfully`,
            keyPreview,
            environment
          });
        } else {
          setKeyStatus({
            isValid: false,
            message: 'Failed to initialize Stripe with provided key',
            keyPreview,
            environment
          });
        }
      } catch (error: any) {
        setKeyStatus({
          isValid: false,
          message: `Stripe initialization error: ${error.message}`,
          keyPreview,
          environment
        });
      }
    } catch (error: any) {
      setKeyStatus({
        isValid: false,
        message: `Validation error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateStripeKey();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Stripe Key Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Validating Stripe configuration...
          </div>
        ) : (
          <>
            <Alert variant={keyStatus.isValid ? "default" : "destructive"}>
              {keyStatus.isValid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{keyStatus.message}</p>
                  {keyStatus.keyPreview && (
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      Key: {keyStatus.keyPreview}
                    </p>
                  )}
                  {keyStatus.environment && (
                    <p className="text-sm">
                      Environment: <span className="font-semibold">{keyStatus.environment}</span>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={validateStripeKey} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-validate
              </Button>
            </div>

            {!keyStatus.isValid && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>To fix this issue:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Get your Stripe publishable key from the Stripe Dashboard</li>
                  <li>Set the VITE_STRIPE_PUBLISHABLE_KEY environment variable</li>
                  <li>Ensure the key starts with "pk_test_" or "pk_live_"</li>
                  <li>Restart your development server or redeploy</li>
                </ol>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};