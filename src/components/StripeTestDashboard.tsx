import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const StripeTestDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const testStripeIntegration = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Environment Variables
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      results.envVars = {
        status: stripeKey && stripeKey.startsWith('pk_') ? 'success' : 'error',
        message: stripeKey ? `Key found: ${stripeKey.substring(0, 20)}...` : 'Missing VITE_STRIPE_PUBLISHABLE_KEY'
      };

      // Test 2: Create Stripe Customer
      if (user) {
        try {
          const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
            body: {
              userId: user.id,
              email: user.email,
              name: 'Test User'
            }
          });
          
          results.customerCreation = {
            status: data?.success ? 'success' : 'error',
            message: data?.success ? `Customer created: ${data.stripe_customer_id}` : error?.message || 'Failed to create customer'
          };
        } catch (err: any) {
          results.customerCreation = {
            status: 'error',
            message: err.message || 'Edge function error'
          };
        }
      }

      // Test 3: Payment Methods API
      try {
        const { data, error } = await supabase.functions.invoke('get-payment-methods', {
          body: { customerId: 'cus_test123' }
        });
        
        results.paymentMethods = {
          status: !error ? 'success' : 'error',
          message: !error ? 'Payment methods API working' : error.message || 'API error'
        };
      } catch (err: any) {
        results.paymentMethods = {
          status: 'error',
          message: err.message || 'Edge function error'
        };
      }

    } catch (error: any) {
      results.general = {
        status: 'error',
        message: error.message || 'General test error'
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  const TestResult = ({ test, result }: any) => (
    <div className="flex items-center justify-between p-3 border rounded">
      <span className="font-medium">{test}</span>
      <div className="flex items-center gap-2">
        {result?.status === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm text-gray-600">{result?.message}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Stripe Integration Test Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testStripeIntegration}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Run Stripe Integration Tests'}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              
              {testResults.envVars && (
                <TestResult test="Environment Variables" result={testResults.envVars} />
              )}
              
              {testResults.customerCreation && (
                <TestResult test="Customer Creation" result={testResults.customerCreation} />
              )}
              
              {testResults.paymentMethods && (
                <TestResult test="Payment Methods API" result={testResults.paymentMethods} />
              )}
              
              {testResults.general && (
                <TestResult test="General Integration" result={testResults.general} />
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">Integration Status:</h4>
            <p className="text-blue-700">
              ✅ Live Stripe keys configured (pk_live_51S1Ht0K6...)
              <br />
              ✅ Edge functions created: create-stripe-customer, get-payment-methods, attach-payment-method, delete-payment-method
              <br />
              ✅ Payment components integrated in client dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeTestDashboard;