import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEarnings } from '@/hooks/useEarnings';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export default function EarningsTrend({ className }: Props) {
  const { earnings, loading } = useEarnings();

  const chartData = earnings?.series.map(point => ({
    bucket: point.x,
    total: point.y
  })) || [];

  return (
    <div className={cn(
      "rounded-2xl border border-emerald-500/25 bg-black/60 backdrop-blur shadow-[0_0_40px_rgba(52,211,153,0.08)]",
      className
    )}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-500/20">
        <h3 className="text-emerald-300 font-semibold tracking-wide text-lg">Earnings Trend</h3>
      </div>

      {loading && (
        <div className="px-6 py-4 text-sm text-emerald-200/60">
          Loading…
        </div>
      )}

      <div className="h-64 px-4 py-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(52,211,153,0.1)" strokeDasharray="3 3" />
            <XAxis 
              dataKey="bucket" 
              tick={{ fill: '#6EE7B7', fontSize: 12 }} 
              stroke="rgba(52,211,153,0.3)"
            />
            <YAxis 
              tickFormatter={(v) => `$${v}`} 
              tick={{ fill: '#6EE7B7', fontSize: 12 }}
              stroke="rgba(52,211,153,0.3)"
            />
            <Tooltip
              contentStyle={{ 
                background: 'rgba(0,0,0,0.95)', 
                border: '1px solid rgba(52,211,153,0.3)', 
                borderRadius: 12, 
                color: '#D1FAE5',
                padding: '12px'
              }}
              formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Total']}
              labelStyle={{ color: '#6EE7B7', fontWeight: 600 }}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#34D399" 
              strokeWidth={3} 
              dot={{ fill: '#34D399', r: 4 }}
              activeDot={{ r: 6, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
