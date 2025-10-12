import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { calculateCommission } from '@/utils/commissionCalculator';

interface EarningsCardProps {
  totalEarnings: number;
  pendingEarnings: number;
  jobCount: number;
  showBreakdown?: boolean;
}

export function EarningsCard({ totalEarnings, pendingEarnings, jobCount, showBreakdown = false }: EarningsCardProps) {
  // Calculate average job value and commission breakdown
  const avgJobValue = jobCount > 0 ? (totalEarnings + pendingEarnings) / jobCount : 0;
  const sampleBreakdown = calculateCommission(Math.round(avgJobValue * 100));
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {showBreakdown ? 'Earnings Breakdown' : 'Total Earnings'}
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          ${totalEarnings.toFixed(2)}
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completed Jobs</span>
            <span className="font-medium">{jobCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium">${pendingEarnings.toFixed(2)}</span>
          </div>
          {showBreakdown && avgJobValue > 0 && (
            <>
              <hr className="my-2" />
              <div className="text-xs text-muted-foreground mb-2">
                Avg Job Breakdown (${avgJobValue.toFixed(0)}):
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Gross Amount:</span>
                  <span>${sampleBreakdown.jobAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Platform Fee ({(sampleBreakdown.platformRate * 100).toFixed(0)}%):</span>
                  <span>-${sampleBreakdown.platformCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Stripe Fee:</span>
                  <span>-${sampleBreakdown.stripeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-green-600 border-t pt-1">
                  <span>Your Payout:</span>
                  <span>${sampleBreakdown.landscaperPayout.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
