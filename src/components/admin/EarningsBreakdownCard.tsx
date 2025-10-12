import React, { useState } from 'react';
import { DollarSign, Download, TrendingUp, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EarningsData {
  platformEarnings: number;
  landscaperPayouts: number;
  upcomingPayouts: number;
  weeklyEarnings: number[];
  rebookingRate: number;
}

interface Props {
  data: EarningsData;
}

export default function EarningsBreakdownCard({ data }: Props) {
  const [showGraph, setShowGraph] = useState(false);

  const maxWeekly = Math.max(...data.weeklyEarnings);

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_-5px_rgba(34,197,94,0.35)] transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-green-300">Earnings Breakdown</h2>
          </div>
          <Button 
            onClick={() => setShowGraph(!showGraph)}
            className="p-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/40"
          >
            <BarChart3 className="w-4 h-4 text-green-300" />
          </Button>
        </div>

        {!showGraph ? (
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-green-400 animate-pulse">${data.platformEarnings.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Platform Earnings (30 days)</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-300">${data.landscaperPayouts.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Paid to Landscapers (30 days)</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-300">${data.upcomingPayouts.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Estimated Upcoming Payouts</div>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rebooking Rate:</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-300 font-semibold">{data.rebookingRate}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-2">Weekly Earnings (Last 4 weeks)</div>
            <div className="flex items-end justify-between h-24 gap-1">
              {data.weeklyEarnings.map((amount, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-300"
                    style={{ height: `${(amount / maxWeekly) * 80}px` }}
                  ></div>
                  <div className="text-xs text-gray-400 mt-1">W{index + 1}</div>
                  <div className="text-xs text-green-300">${amount.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 text-sm mt-4 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <Download className="w-4 h-4 mr-2" />
          Export Financial Report
        </Button>
      </div>
    </Card>
  );
}