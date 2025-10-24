import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateCommission, formatCommissionDisplay } from '@/utils/commissionCalculator';

interface Payment {
  id: string;
  amount_cents: number;
  stripe_fee_cents?: number;
  platform_commission_cents?: number;
  landscaper_payout_cents?: number;
  commission_rate?: number;
  status: string;
  created_at: string;
  job?: {
    title: string;
    customer_name: string;
  };
}

interface EarningsBreakdownTableProps {
  payments: Payment[];
  showPlatformRevenue?: boolean;
}

export function EarningsBreakdownTable({ payments, showPlatformRevenue = false }: EarningsBreakdownTableProps) {
  const getCommissionBreakdown = (payment: Payment) => {
    // Use stored values if available, otherwise calculate
    if (payment.platform_commission_cents && payment.landscaper_payout_cents) {
      return {
        jobAmount: payment.amount_cents / 100,
        platformCommission: payment.platform_commission_cents / 100,
        platformRate: payment.commission_rate || 0,
        stripeFee: (payment.stripe_fee_cents || 0) / 100,
        landscaperPayout: payment.landscaper_payout_cents / 100,
        platformNet: (payment.platform_commission_cents - (payment.stripe_fee_cents || 0)) / 100
      };
    }
    
    // Fallback to calculation
    return calculateCommission(payment.amount_cents);
  };

  const totals = payments.reduce((acc, payment) => {
    const breakdown = getCommissionBreakdown(payment);
    return {
      jobAmount: acc.jobAmount + breakdown.jobAmount,
      platformCommission: acc.platformCommission + breakdown.platformCommission,
      stripeFee: acc.stripeFee + breakdown.stripeFee,
      landscaperPayout: acc.landscaperPayout + breakdown.landscaperPayout,
      platformNet: acc.platformNet + breakdown.platformNet
    };
  }, { jobAmount: 0, platformCommission: 0, stripeFee: 0, landscaperPayout: 0, platformNet: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Job</th>
                <th className="text-right p-2">Gross Amount</th>
                <th className="text-right p-2">Platform Fee</th>
                <th className="text-right p-2">Stripe Fee</th>
                <th className="text-right p-2">
                  {showPlatformRevenue ? 'Platform Net' : 'Landscaper Net'}
                </th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const breakdown = getCommissionBreakdown(payment);
                const ratePercent = Math.round(breakdown.platformRate * 100);
                
                return (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{payment.job?.title || 'Job'}</div>
                        <div className="text-gray-500 text-xs">{payment.job?.customer_name}</div>
                      </div>
                    </td>
                    <td className="text-right p-2 font-medium">
                      ${breakdown.jobAmount.toFixed(2)}
                    </td>
                    <td className="text-right p-2">
                      <div>${breakdown.platformCommission.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">({ratePercent}%)</div>
                    </td>
                    <td className="text-right p-2">
                      <div>${breakdown.stripeFee.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">(2.9% + $0.30)</div>
                    </td>
                    <td className="text-right p-2 font-medium text-green-600">
                      ${showPlatformRevenue ? breakdown.platformNet.toFixed(2) : breakdown.landscaperPayout.toFixed(2)}
                    </td>
                    <td className="text-center p-2">
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 font-medium">
              <tr>
                <td className="p-2">Totals</td>
                <td className="text-right p-2">${totals.jobAmount.toFixed(2)}</td>
                <td className="text-right p-2">${totals.platformCommission.toFixed(2)}</td>
                <td className="text-right p-2">${totals.stripeFee.toFixed(2)}</td>
                <td className="text-right p-2 text-green-600">
                  ${showPlatformRevenue ? totals.platformNet.toFixed(2) : totals.landscaperPayout.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}