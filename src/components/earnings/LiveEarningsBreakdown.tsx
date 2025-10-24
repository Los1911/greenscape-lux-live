import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, CreditCard, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateCommission } from '@/utils/commissionCalculator';

interface EarningsData {
  totalRevenue: number;
  platformCommission: number;
  stripeFees: number;
  landscaperPayouts: number;
  platformNet: number;
  jobCount: number;
  avgCommissionRate: number;
}

export function LiveEarningsBreakdown() {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalRevenue: 0,
    platformCommission: 0,
    stripeFees: 0,
    landscaperPayouts: 0,
    platformNet: 0,
    jobCount: 0,
    avgCommissionRate: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('earnings-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchEarningsData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchEarningsData = async () => {
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

        return {
          totalRevenue: acc.totalRevenue + breakdown.jobAmount,
          platformCommission: acc.platformCommission + breakdown.platformCommission,
          stripeFees: acc.stripeFees + breakdown.stripeFee,
          landscaperPayouts: acc.landscaperPayouts + breakdown.landscaperPayout,
          platformNet: acc.platformNet + (breakdown.platformCommission - breakdown.stripeFee * 0.5), // Approximate platform net
          jobCount: acc.jobCount + 1,
          totalRate: acc.totalRate + breakdown.platformRate
        };
      }, { 
        totalRevenue: 0, 
        platformCommission: 0, 
        stripeFees: 0, 
        landscaperPayouts: 0, 
        platformNet: 0, 
        jobCount: 0, 
        totalRate: 0 
      });

      setEarnings({
        ...calculated,
        avgCommissionRate: calculated.jobCount > 0 ? calculated.totalRate / calculated.jobCount : 0
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const commissionBreakdown = [
    { label: 'Under $100 (15%)', color: 'bg-red-500' },
    { label: '$100-$499 (12%)', color: 'bg-yellow-500' },
    { label: '$500+ (10%)', color: 'bg-green-500' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold">${earnings.totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-gray-500">{earnings.jobCount} jobs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Platform Commission</span>
            </div>
            <div className="text-2xl font-bold">${earnings.platformCommission.toFixed(2)}</div>
            <div className="text-xs text-gray-500">
              Avg {(earnings.avgCommissionRate * 100).toFixed(1)}% rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Stripe Fees</span>
            </div>
            <div className="text-2xl font-bold">${earnings.stripeFees.toFixed(2)}</div>
            <div className="text-xs text-gray-500">2.9% + $0.30 per transaction</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Landscaper Payouts</span>
            </div>
            <div className="text-2xl font-bold">${earnings.landscaperPayouts.toFixed(2)}</div>
            <div className="text-xs text-gray-500">After all fees</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Platform Commission</span>
              <span className="font-medium">${earnings.platformCommission.toFixed(2)}</span>
            </div>
            <Progress 
              value={(earnings.platformCommission / earnings.totalRevenue) * 100} 
              className="h-2"
            />
            
            <div className="flex justify-between items-center">
              <span>Stripe Processing Fees</span>
              <span className="font-medium">${earnings.stripeFees.toFixed(2)}</span>
            </div>
            <Progress 
              value={(earnings.stripeFees / earnings.totalRevenue) * 100} 
              className="h-2"
            />
            
            <div className="flex justify-between items-center">
              <span>Landscaper Payouts</span>
              <span className="font-medium">${earnings.landscaperPayouts.toFixed(2)}</span>
            </div>
            <Progress 
              value={(earnings.landscaperPayouts / earnings.totalRevenue) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Tier Legend */}
      <Card>
        <CardHeader>
          <CardTitle>GreenScape Lux Tiered Commission Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {commissionBreakdown.map((tier, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${tier.color}`}></div>
                <span className="text-sm">{tier.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Commission rates are applied before Stripe processing fees (2.9% + $0.30 per transaction).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}