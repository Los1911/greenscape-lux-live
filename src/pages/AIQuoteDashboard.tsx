import React from 'react';
import { AIQuoteEstimator } from '@/components/quotes/AIQuoteEstimator';
import { SeasonalPricingEngine } from '@/components/quotes/SeasonalPricingEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, BarChart3, Zap } from 'lucide-react';

export const AIQuoteDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Quote Estimation Dashboard
          </h1>
          <p className="text-gray-600">
            Leverage machine learning and computer vision for accurate landscaping quotes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-1">GPT-4 Vision</div>
              <p className="text-sm text-gray-600">
                Advanced image analysis for property assessment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
                ML Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-1">Historical Data</div>
              <p className="text-sm text-gray-600">
                Continuous learning from completed jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-600" />
                Instant Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-1">Real-time</div>
              <p className="text-sm text-gray-600">
                Generate accurate quotes in seconds
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <AIQuoteEstimator />
          </div>
          <div>
            <SeasonalPricingEngine />
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            How AI Quote Estimation Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📸</span>
              </div>
              <h4 className="font-medium mb-2">Image Analysis</h4>
              <p className="text-sm text-gray-600">
                AI analyzes property photos to identify lawn area, landscaping complexity, and maintenance needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🗺️</span>
              </div>
              <h4 className="font-medium mb-2">Location Data</h4>
              <p className="text-sm text-gray-600">
                Google Maps integration provides climate data, accessibility, and regional pricing factors
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🧠</span>
              </div>
              <h4 className="font-medium mb-2">Smart Pricing</h4>
              <p className="text-sm text-gray-600">
                Machine learning models trained on historical data provide accurate, competitive quotes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuoteDashboard;