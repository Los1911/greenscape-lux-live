import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateCommission } from '@/utils/commissionCalculator';

interface PlatformMetrics {
  totalRevenue: number;
  platformCommission: number;
  platformNet: number;
  stripeFees: number;
  jobCount: number;
  avgJobValue: number;
  tierBreakdown: {
    tier1: { count: number; revenue: number; commission: number }; // Under $100 (15%)
    tier2: { count: number; revenue: number; commission: number }; // $100-$499 (12%)
    tier3: { count: number; revenue: number; commission: number }; // $500+ (10%)
  };
}

export function PlatformRevenueOverview() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalRevenue: 0,
    platformCommission: 0,
    platformNet: 0,
    stripeFees: 0,
    jobCount: 0,
    avgJobValue: 0,
    tierBreakdown: {
      tier1: { count: 0, revenue: 0, commission: 0 },
      tier2: { count: 0, revenue: 0, commission: 0 },
      tier3: { count: 0, revenue: 0, commission: 0 }
    }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  const fetchPlatformMetrics = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount_cents, stripe_fee_cents, platform_commission_cents, landscaper_payout_cents, commission_rate, status')
        .eq('status', 'completed');

      if (error) throw error;

      const calculated = payments.reduce((acc, payment) => {
        let breakdown;
        
        // Use stored values if available
        if (payment.platform_commission_cents && payment.landscaper_payout_cents) {
          breakdown = {
            jobAmount: payment.amount_cents / 100,
            platformCommission: payment.platform_commission_cents / 100,
            stripeFee: (payment.stripe_fee_cents || 0) / 100,
            landscaperPayout: payment.landscaper_payout_cents / 100,
            platformRate: payment.commission_rate || 0
          };
        } else {
          // Fallback to calculation
          breakdown = calculateCommission(payment.amount_cents);
        }

        // Determine tier
        let tier: 'tier1' | 'tier2' | 'tier3';
        if (breakdown.jobAmount < 100) tier = 'tier1';
        else if (breakdown.jobAmount < 500) tier = 'tier2';
        else tier = 'tier3';

        // Platform net = commission - stripe fees on commission
        const platformNet = breakdown.platformCommission - (breakdown.platformCommission * 0.029 + 0.30);

        return {
          totalRevenue: acc.totalRevenue + breakdown.jobAmount,
          platformCommission: acc.platformCommission + breakdown.platformCommission,
          platformNet: acc.platformNet + Math.max(0, platformNet),
          stripeFees: acc.stripeFees + breakdown.stripeFee,
          jobCount: acc.jobCount + 1,
          tierBreakdown: {
            ...acc.tierBreakdown,
            [tier]: {
              count: acc.tierBreakdown[tier].count + 1,
              revenue: acc.tierBreakdown[tier].revenue + breakdown.jobAmount,
              commission: acc.tierBreakdown[tier].commission + breakdown.platformCommission
            }
          }
        };
      }, {
        totalRevenue: 0,
        platformCommission: 0,
        platformNet: 0,
        stripeFees: 0,
        jobCount: 0,
        tierBreakdown: {
          tier1: { count: 0, revenue: 0, commission: 0 },
          tier2: { count: 0, revenue: 0, commission: 0 },
          tier3: { count: 0, revenue: 0, commission: 0 }
        }
      });

      setMetrics({
        ...calculated,
        avgJobValue: calculated.jobCount > 0 ? calculated.totalRevenue / calculated.jobCount : 0
      });
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const commissionRate = metrics.totalRevenue > 0 ? (metrics.platformCommission / metrics.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Platform Net Revenue</p>
                <p className="text-2xl font-bold text-green-900">${metrics.platformNet.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-green-700 mt-1">After Stripe fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Gross Commission</p>
                <p className="text-2xl font-bold">${metrics.platformCommission.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{commissionRate.toFixed(1)}% avg rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Jobs</p>
                <p className="text-2xl font-bold">{metrics.jobCount}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">${metrics.avgJobValue.toFixed(0)} avg value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Processing Fees</p>
                <p className="text-2xl font-bold">${metrics.stripeFees.toFixed(2)}</p>
              </div>
              <Percent className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Stripe 2.9% + $0.30</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Tier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-800">Under $100</h4>
                  <Badge variant="destructive">15%</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Jobs:</span>
                    <span className="font-medium">{metrics.tierBreakdown.tier1.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier1.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier1.commission.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-800">$100 - $499</h4>
                  <Badge variant="secondary">12%</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Jobs:</span>
                    <span className="font-medium">{metrics.tierBreakdown.tier2.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier2.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier2.commission.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800">$500+</h4>
                  <Badge variant="default">10%</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Jobs:</span>
                    <span className="font-medium">{metrics.tierBreakdown.tier3.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier3.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">${metrics.tierBreakdown.tier3.commission.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Total Job Revenue</span>
              <span className="text-lg font-bold">${metrics.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-blue-600">
              <span>- GreenScape Commission ({commissionRate.toFixed(1)}%)</span>
              <span>-${metrics.platformCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-red-600">
              <span>- Stripe Processing Fees</span>
              <span>-${metrics.stripeFees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t font-medium text-green-600">
              <span>Platform Net Revenue</span>
              <span className="text-xl">${metrics.platformNet.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}