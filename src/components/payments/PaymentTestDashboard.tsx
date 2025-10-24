import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, CreditCard, Zap, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'error';
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  duration?: number;
}

export const PaymentTestDashboard: React.FC = () => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([
    {
      id: 'stripe-connection',
      name: 'Stripe API Connection',
      description: 'Test basic Stripe API connectivity',
      category: 'basic',
      status: 'pending'
    },
    {
      id: 'customer-creation',
      name: 'Customer Creation',
      description: 'Create test customer in Stripe',
      category: 'basic',
      status: 'pending'
    },
    {
      id: 'payment-intent',
      name: 'Payment Intent Creation',
      description: 'Create payment intent for $50',
      category: 'basic',
      status: 'pending'
    },
    {
      id: 'payment-methods',
      name: 'Payment Methods',
      description: 'Test various card types and scenarios',
      category: 'advanced',
      status: 'pending'
    },
    {
      id: 'webhook-simulation',
      name: 'Webhook Processing',
      description: 'Simulate webhook events',
      category: 'advanced',
      status: 'pending'
    },
    {
      id: 'error-handling',
      name: 'Error Scenarios',
      description: 'Test invalid inputs and error handling',
      category: 'error',
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, warnings: 0 });

  const updateScenario = (id: string, updates: Partial<TestScenario>) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const runScenario = async (scenario: TestScenario) => {
    updateScenario(scenario.id, { status: 'running' });
    const startTime = Date.now();

    try {
      let result;
      
      switch (scenario.id) {
        case 'stripe-connection':
          result = await testStripeConnection();
          break;
        case 'customer-creation':
          result = await testCustomerCreation();
          break;
        case 'payment-intent':
          result = await testPaymentIntent();
          break;
        case 'payment-methods':
          result = await testPaymentMethods();
          break;
        case 'webhook-simulation':
          result = await testWebhooks();
          break;
        case 'error-handling':
          result = await testErrorHandling();
          break;
        default:
          throw new Error('Unknown test scenario');
      }

      const duration = Date.now() - startTime;
      updateScenario(scenario.id, {
        status: result.success ? 'success' : 'error',
        result,
        duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      updateScenario(scenario.id, {
        status: 'error',
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setSummary({ passed: 0, failed: 0, warnings: 0 });

    for (const scenario of scenarios) {
      await runScenario(scenario);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }

    // Calculate summary
    const passed = scenarios.filter(s => s.status === 'success').length;
    const failed = scenarios.filter(s => s.status === 'error').length;
    const warnings = scenarios.filter(s => s.result?.warnings?.length > 0).length;
    
    setSummary({ passed, failed, warnings });
    setIsRunning(false);
  };

  // Test functions
  const testStripeConnection = async () => {
    const { data, error } = await supabase.functions.invoke('validate-stripe-key');
    if (error) throw new Error(error.message);
    return data;
  };

  const testCustomerCreation = async () => {
    const { data, error } = await supabase.functions.invoke('payment-flow-test', {
      body: { testType: 'create_test_customer', email: `test-${Date.now()}@example.com` }
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const testPaymentIntent = async () => {
    const { data, error } = await supabase.functions.invoke('payment-flow-test', {
      body: { testType: 'create_test_payment_intent', amount: 5000 }
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const testPaymentMethods = async () => {
    const { data, error } = await supabase.functions.invoke('payment-flow-test', {
      body: { testType: 'test_payment_method' }
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const testWebhooks = async () => {
    const { data, error } = await supabase.functions.invoke('payment-flow-test', {
      body: { testType: 'simulate_webhook' }
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const testErrorHandling = async () => {
    const { data, error } = await supabase.functions.invoke('payment-flow-test', {
      body: { testType: 'test_error_scenarios' }
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const getStatusIcon = (status: TestScenario['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCategoryIcon = (category: TestScenario['category']) => {
    switch (category) {
      case 'basic': return <CreditCard className="h-4 w-4" />;
      case 'advanced': return <Zap className="h-4 w-4" />;
      case 'error': return <Shield className="h-4 w-4" />;
    }
  };

  const filterByCategory = (category: TestScenario['category']) => 
    scenarios.filter(s => s.category === category);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Flow Test Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for Stripe payment integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            {summary.passed + summary.failed > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  ✓ {summary.passed} Passed
                </Badge>
                {summary.failed > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    ✗ {summary.failed} Failed
                  </Badge>
                )}
                {summary.warnings > 0 && (
                  <Badge variant="outline" className="text-yellow-600">
                    ⚠ {summary.warnings} Warnings
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Tests</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Tests</TabsTrigger>
              <TabsTrigger value="error">Error Handling</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {filterByCategory('basic').map(scenario => (
                <TestScenarioCard key={scenario.id} scenario={scenario} onRun={() => runScenario(scenario)} />
              ))}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {filterByCategory('advanced').map(scenario => (
                <TestScenarioCard key={scenario.id} scenario={scenario} onRun={() => runScenario(scenario)} />
              ))}
            </TabsContent>

            <TabsContent value="error" className="space-y-4">
              {filterByCategory('error').map(scenario => (
                <TestScenarioCard key={scenario.id} scenario={scenario} onRun={() => runScenario(scenario)} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const TestScenarioCard: React.FC<{
  scenario: TestScenario;
  onRun: () => void;
}> = ({ scenario, onRun }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {scenario.status === 'running' ? (
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                scenario.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : scenario.status === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                )
              )}
            </div>
            <div>
              <h3 className="font-medium">{scenario.name}</h3>
              <p className="text-sm text-gray-600">{scenario.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {scenario.duration && (
              <span className="text-xs text-gray-500">{scenario.duration}ms</span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRun}
              disabled={scenario.status === 'running'}
            >
              {scenario.status === 'running' ? 'Running...' : 'Run Test'}
            </Button>
          </div>
        </div>
        
        {scenario.result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(scenario.result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};