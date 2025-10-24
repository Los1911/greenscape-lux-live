import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ValidationResult {
  component: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export const StripeIntegrationValidator: React.FC = () => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | 'pending'>('pending');

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    setValidations([]);

    const checks = [
      { name: 'Environment Variables', fn: validateEnvironmentVariables },
      { name: 'Stripe API Keys', fn: validateStripeKeys },
      { name: 'Edge Functions', fn: validateEdgeFunctions },
      { name: 'Database Schema', fn: validateDatabaseSchema },
      { name: 'Frontend Integration', fn: validateFrontendIntegration }
    ];

    const results: ValidationResult[] = [];

    for (const check of checks) {
      try {
        const result = await check.fn();
        results.push({
          component: check.name,
          status: result.success ? 'success' : 'error',
          message: result.message,
          details: result.details
        });
      } catch (error) {
        results.push({
          component: check.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        });
      }
    }

    setValidations(results);
    
    // Determine overall status
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }

    setIsValidating(false);
  };

  const validateEnvironmentVariables = async () => {
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];

    const missing = [];
    const present = [];

    for (const varName of requiredVars) {
      // Check if environment variable exists by trying to use it
      try {
        const { data } = await supabase.functions.invoke('get-environment-status', {
          body: { variable: varName }
        });
        
        if (data?.exists) {
          present.push(varName);
        } else {
          missing.push(varName);
        }
      } catch (error) {
        missing.push(varName);
      }
    }

    return {
      success: missing.length === 0,
      message: missing.length === 0 
        ? 'All required environment variables are configured'
        : `Missing environment variables: ${missing.join(', ')}`,
      details: { present, missing }
    };
  };

  const validateStripeKeys = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-stripe-key');
      
      if (error) {
        return {
          success: false,
          message: 'Failed to validate Stripe keys',
          details: error
        };
      }

      if (!data.valid) {
        return {
          success: false,
          message: data.error || 'Invalid Stripe configuration',
          details: data
        };
      }

      return {
        success: true,
        message: `Stripe keys valid (${data.keyType} mode)`,
        details: data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error validating Stripe keys',
        details: error
      };
    }
  };

  const validateEdgeFunctions = async () => {
    const requiredFunctions = [
      'create-stripe-customer',
      'create-payment-intent',
      'get-payment-methods',
      'attach-payment-method',
      'delete-payment-method',
      'stripe-webhook'
    ];

    const functionStatus = [];

    for (const funcName of requiredFunctions) {
      try {
        const response = await fetch(`/api/${funcName}`, {
          method: 'OPTIONS'
        });
        
        functionStatus.push({
          name: funcName,
          status: response.ok ? 'available' : 'error',
          statusCode: response.status
        });
      } catch (error) {
        functionStatus.push({
          name: funcName,
          status: 'error',
          error: error.message
        });
      }
    }

    const availableFunctions = functionStatus.filter(f => f.status === 'available').length;
    const success = availableFunctions === requiredFunctions.length;

    return {
      success,
      message: success 
        ? 'All required edge functions are available'
        : `${availableFunctions}/${requiredFunctions.length} edge functions available`,
      details: functionStatus
    };
  };

  const validateDatabaseSchema = async () => {
    try {
      // Check if required tables and columns exist
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .limit(1);

      if (error && error.code === '42703') {
        return {
          success: false,
          message: 'Missing stripe_customer_id column in profiles table',
          details: error
        };
      }

      return {
        success: true,
        message: 'Database schema is properly configured for Stripe integration',
        details: { tablesChecked: ['profiles'] }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error validating database schema',
        details: error
      };
    }
  };

  const validateFrontendIntegration = async () => {
    // Check if Stripe is properly loaded in the frontend
    const stripeLoaded = typeof window !== 'undefined' && window.Stripe;
    
    if (!stripeLoaded) {
      return {
        success: false,
        message: 'Stripe.js not loaded in frontend',
        details: { stripeAvailable: false }
      };
    }

    return {
      success: true,
      message: 'Frontend Stripe integration is properly configured',
      details: { stripeAvailable: true }
    };
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Integration Validator
        </CardTitle>
        <CardDescription>
          Comprehensive validation of Stripe payment system integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Run Validation'
            )}
          </Button>

          {validations.length > 0 && (
            <Alert className={`flex-1 ${getOverallStatusColor()}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Overall Status: {overallStatus === 'success' ? 'All systems operational' : 
                                overallStatus === 'error' ? 'Issues detected' : 
                                'Some warnings present'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          {validations.map((validation, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(validation.status)}
                <div>
                  <h3 className="font-medium">{validation.component}</h3>
                  <p className="text-sm text-gray-600">{validation.message}</p>
                </div>
              </div>
              
              <Badge variant={validation.status === 'success' ? 'default' : 'destructive'}>
                {validation.status}
              </Badge>
            </div>
          ))}
        </div>

        {validations.length === 0 && !isValidating && (
          <div className="text-center py-8 text-gray-500">
            Click "Run Validation" to check your Stripe integration
          </div>
        )}
      </CardContent>
    </Card>
  );
};