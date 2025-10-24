import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, TrendingUp, Users, Target, AlertCircle } from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  variants: {
    name: string;
    traffic: number;
    conversions: number;
    revenue: number;
    visitors: number;
    conversionRate: number;
    confidence: number;
  }[];
  metric: string;
  winner?: string;
  significance: number;
}

export function ABTestingResults() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchABTests();
  }, []);

  const fetchABTests = async () => {
    setLoading(true);
    try {
      // Mock A/B test data - replace with actual API call
      const mockTests: ABTest[] = [
        {
          id: 'test-1',
          name: 'Checkout Button Color',
          status: 'completed',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          metric: 'Conversion Rate',
          winner: 'Variant B',
          significance: 95.2,
          variants: [
            {
              name: 'Control (Blue)',
              traffic: 50,
              conversions: 145,
              revenue: 14500,
              visitors: 2890,
              conversionRate: 5.02,
              confidence: 95.2
            },
            {
              name: 'Variant B (Green)',
              traffic: 50,
              conversions: 168,
              revenue: 16800,
              visitors: 2910,
              conversionRate: 5.77,
              confidence: 95.2
            }
          ]
        },
        {
          id: 'test-2',
          name: 'Landing Page Hero',
          status: 'running',
          startDate: '2024-02-01',
          metric: 'Sign-up Rate',
          significance: 78.5,
          variants: [
            {
              name: 'Control',
              traffic: 33,
              conversions: 89,
              revenue: 8900,
              visitors: 1450,
              conversionRate: 6.14,
              confidence: 78.5
            },
            {
              name: 'Variant A',
              traffic: 33,
              conversions: 95,
              revenue: 9500,
              visitors: 1420,
              conversionRate: 6.69,
              confidence: 78.5
            },
            {
              name: 'Variant B',
              traffic: 34,
              conversions: 102,
              revenue: 10200,
              visitors: 1480,
              conversionRate: 6.89,
              confidence: 78.5
            }
          ]
        }
      ];
      setTests(mockTests);
      setSelectedTest(mockTests[0].id);
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selectedTestData = tests.find(t => t.id === selectedTest);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>A/B Testing Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTest === test.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedTest(test.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.metric}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(test.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                    {test.winner && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Winner: {test.winner}
                      </p>
                    )}
                    <p className={`text-sm font-medium ${getConfidenceColor(test.significance)}`}>
                      {test.significance}% confidence
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {selectedTestData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTestData.name} - Detailed Results</CardTitle>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(selectedTestData.status)}>
                {selectedTestData.status}
              </Badge>
              {selectedTestData.significance < 95 && (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Results not yet significant</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4">
                  {selectedTestData.variants.map((variant, index) => (
                    <Card key={index} className={variant.name === selectedTestData.winner ? 'border-green-500' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">{variant.name}</h4>
                            {variant.name === selectedTestData.winner && (
                              <Badge className="bg-green-100 text-green-800 mt-1">Winner</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{variant.conversionRate.toFixed(2)}%</p>
                            <p className="text-sm text-gray-600">Conversion Rate</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Visitors</p>
                            <p className="font-semibold">{variant.visitors.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Conversions</p>
                            <p className="font-semibold">{variant.conversions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="font-semibold">${variant.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Traffic Split</p>
                            <p className="font-semibold">{variant.traffic}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confidence Level</span>
                            <span className={getConfidenceColor(variant.confidence)}>
                              {variant.confidence}%
                            </span>
                          </div>
                          <Progress value={variant.confidence} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Variant</th>
                        <th className="text-right p-3">Visitors</th>
                        <th className="text-right p-3">Conversions</th>
                        <th className="text-right p-3">Conv. Rate</th>
                        <th className="text-right p-3">Revenue</th>
                        <th className="text-right p-3">Rev/Visitor</th>
                        <th className="text-right p-3">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTestData.variants.map((variant, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{variant.name}</td>
                          <td className="p-3 text-right">{variant.visitors.toLocaleString()}</td>
                          <td className="p-3 text-right">{variant.conversions}</td>
                          <td className="p-3 text-right">{variant.conversionRate.toFixed(2)}%</td>
                          <td className="p-3 text-right">${variant.revenue.toLocaleString()}</td>
                          <td className="p-3 text-right">${(variant.revenue / variant.visitors).toFixed(2)}</td>
                          <td className={`p-3 text-right font-medium ${getConfidenceColor(variant.confidence)}`}>
                            {variant.confidence}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <div className="text-center py-8">
                  <p className="text-gray-600">Timeline data will be available soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}