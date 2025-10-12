import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export const PaymentFlowTestSuite: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const updateTest = (name: string, result: Partial<TestResult>) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...result } : t);
      }
      return [...prev, { name, status: 'pending', message: '', ...result }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<TestResult>) => {
    setCurrentTest(name);
    updateTest(name, { status: 'pending', message: 'Running...' });
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTest(name, { ...result, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(name, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  const testStripeConnection = async (): Promise<TestResult> => {
    const { data, error } = await supabase.functions.invoke('validate-stripe-key');
    
    if (error) {
      return { name: 'Stripe Connection', status: 'error', message: error.message };
    }
    
    if (data?.valid) {
      return { 
        name: 'Stripe Connection', 
        status: 'success', 
        message: `Connected to Stripe (${data.keyType})`,
        details: data
      };
    }
    
    return { name: 'Stripe Connection', status: 'error', message: 'Invalid Stripe configuration' };
  };

  const testCustomerCreation = async (): Promise<TestResult> => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
      body: { email: testEmail, name: 'Test Customer' }
    });
    
    if (error) {
      return { name: 'Customer Creation', status: 'error', message: error.message };
    }
    
    if (data?.customer?.id) {
      return { 
        name: 'Customer Creation', 
        status: 'success', 
        message: `Customer created: ${data.customer.id}`,
        details: data.customer
      };
    }
    
    return { name: 'Customer Creation', status: 'error', message: 'Failed to create customer' };
  };

  const testPaymentIntentCreation = async (): Promise<TestResult> => {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { 
        amount: 5000, // $50.00
        currency: 'usd',
        description: 'Test payment intent'
      }
    });
    
    if (error) {
      return { name: 'Payment Intent', status: 'error', message: error.message };
    }
    
    if (data?.clientSecret) {
      return { 
        name: 'Payment Intent', 
        status: 'success', 
        message: `Payment intent created: ${data.id}`,
        details: data
      };
    }
    
    return { name: 'Payment Intent', status: 'error', message: 'Failed to create payment intent' };
  };

  const testWebhookEndpoint = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/stripe-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok) {
        return { 
          name: 'Webhook Endpoint', 
          status: 'success', 
          message: 'Webhook endpoint accessible' 
        };
      }
      
      return { 
        name: 'Webhook Endpoint', 
        status: 'warning', 
        message: `Webhook returned ${response.status}` 
      };
    } catch (error) {
      return { 
        name: 'Webhook Endpoint', 
        status: 'error', 
        message: 'Webhook endpoint not accessible' 
      };
    }
  };

  const runFullTestSuite = async () => {
    setIsRunning(true);
    setTests([]);
    
    const testSuite = [
      { name: 'Stripe Connection', fn: testStripeConnection },
      { name: 'Customer Creation', fn: testCustomerCreation },
      { name: 'Payment Intent', fn: testPaymentIntentCreation },
      { name: 'Webhook Endpoint', fn: testWebhookEndpoint }
    ];
    
    for (const test of testSuite) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Flow Test Suite</CardTitle>
          <CardDescription>
            Comprehensive testing of Stripe payment integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runFullTestSuite} 
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
            </Button>
            
            {tests.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  ✓ {successCount} Passed
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    ✗ {errorCount} Failed
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-yellow-600">
                    ⚠ {warningCount} Warnings
                  </Badge>
                )}
              </div>
            )}
          </div>

          {currentTest && (
            <Alert className="mb-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Currently running: {currentTest}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">{test.message}</div>
                  {test.duration && (
                    <div className="text-xs text-gray-400">{test.duration}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlowTestSuite;