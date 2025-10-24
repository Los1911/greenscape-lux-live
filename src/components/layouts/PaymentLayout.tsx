import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Receipt, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PaymentLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function PaymentLayout({ children, activeTab = 'overview' }: PaymentLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/client-dashboard')}
            className="text-white hover:text-green-400 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Payment Management
            </h1>
            <p className="text-lg text-gray-300">
              Manage your payment methods, subscriptions, and billing
            </p>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => navigate('/payments/overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Overview
              </button>
              <button
                onClick={() => navigate('/payments/methods')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'methods'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Methods
              </button>
              <button
                onClick={() => navigate('/payments/subscriptions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'subscriptions'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Receipt className="h-4 w-4" />
                Subscriptions
              </button>
              <button
                onClick={() => navigate('/payments/security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'security'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Shield className="h-4 w-4" />
                Security
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}