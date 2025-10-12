import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Brain, Target, AlertTriangle, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PredictionData {
  period: string;
  actual?: number;
  predicted: number;
  confidence: number;
  lower: number;
  upper: number;
}

interface ModelMetrics {
  accuracy: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  lastUpdated: string;
}

export function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('6m');
  const [model, setModel] = useState<'arima' | 'prophet' | 'lstm'>('prophet');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, [timeframe, model]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Mock prediction data - replace with actual ML model API
      const mockPredictions: PredictionData[] = [
        { period: '2024-01', actual: 125000, predicted: 124500, confidence: 95, lower: 118000, upper: 131000 },
        { period: '2024-02', actual: 132000, predicted: 130000, confidence: 94, lower: 123500, upper: 136500 },
        { period: '2024-03', actual: 128000, predicted: 129500, confidence: 93, lower: 122000, upper: 137000 },
        { period: '2024-04', predicted: 135000, confidence: 92, lower: 127000, upper: 143000 },
        { period: '2024-05', predicted: 142000, confidence: 90, lower: 133000, upper: 151000 },
        { period: '2024-06', predicted: 148000, confidence: 88, lower: 138000, upper: 158000 },
        { period: '2024-07', predicted: 155000, confidence: 85, lower: 144000, upper: 166000 },
        { period: '2024-08', predicted: 162000, confidence: 82, lower: 149000, upper: 175000 },
        { period: '2024-09', predicted: 168000, confidence: 80, lower: 154000, upper: 182000 }
      ];

      const mockMetrics: ModelMetrics = {
        accuracy: 94.2,
        mape: 5.8,
        rmse: 8420,
        lastUpdated: '2024-03-15T10:30:00Z'
      };

      setPredictions(mockPredictions);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalPredictedRevenue = predictions
    .filter(p => !p.actual)
    .reduce((sum, p) => sum + p.predicted, 0);

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
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Revenue Forecasting</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered revenue predictions with confidence intervals
              </p>
            </div>
            <div className="flex space-x-3">
              <Select value={model} onValueChange={(value: 'arima' | 'prophet' | 'lstm') => setModel(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prophet">Prophet</SelectItem>
                  <SelectItem value="arima">ARIMA</SelectItem>
                  <SelectItem value="lstm">LSTM</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={(value: '3m' | '6m' | '12m') => setTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="12m">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Predicted Revenue</p>
                <p className="text-2xl font-bold">${totalPredictedRevenue.toLocaleString()}</p>
                <Badge variant="default" className="mt-1">Next 6 months</Badge>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                <p className="text-2xl font-bold">{metrics?.accuracy}%</p>
                <Badge variant="default" className="mt-1">High confidence</Badge>
              </div>
              <Brain className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">+12.5%</p>
                <Badge variant="default" className="mt-1">Monthly avg</Badge>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prediction Error</p>
                <p className="text-2xl font-bold">{metrics?.mape}%</p>
                <Badge variant="default" className="mt-1">MAPE</Badge>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast with Confidence Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'actual' ? 'Actual' : name === 'predicted' ? 'Predicted' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#e5e7eb" 
                  strokeDasharray="5 5"
                  dot={false}
                  name="Upper Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#e5e7eb" 
                  strokeDasharray="5 5"
                  dot={false}
                  name="Lower Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Period</th>
                  <th className="text-right p-3">Actual</th>
                  <th className="text-right p-3">Predicted</th>
                  <th className="text-right p-3">Confidence</th>
                  <th className="text-right p-3">Range</th>
                  <th className="text-right p-3">Variance</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, index) => {
                  const variance = pred.actual ? 
                    ((pred.predicted - pred.actual) / pred.actual * 100).toFixed(1) : 
                    null;
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{pred.period}</td>
                      <td className="p-3 text-right">
                        {pred.actual ? `$${pred.actual.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-medium">
                        ${pred.predicted.toLocaleString()}
                      </td>
                      <td className={`p-3 text-right ${getConfidenceColor(pred.confidence)}`}>
                        {pred.confidence}%
                      </td>
                      <td className="p-3 text-right text-sm text-gray-600">
                        ${pred.lower.toLocaleString()} - ${pred.upper.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {variance ? (
                          <span className={variance.startsWith('-') ? 'text-red-600' : 'text-green-600'}>
                            {variance}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{metrics?.accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-xs text-gray-500 mt-1">Predictions within 10% of actual</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{metrics?.mape}%</p>
              <p className="text-sm text-gray-600">MAPE</p>
              <p className="text-xs text-gray-500 mt-1">Mean Absolute Percentage Error</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">${metrics?.rmse.toLocaleString()}</p>
              <p className="text-sm text-gray-600">RMSE</p>
              <p className="text-xs text-gray-500 mt-1">Root Mean Square Error</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'N/A'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}