import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ─── Types ──────────────────────────────────────────────── */

interface DayBucket {
  date: string;   // YYYY-MM-DD
  gross: number;
  trueNet: number;
}

/* ─── Helpers ────────────────────────────────────────────── */

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function formatCurrencyShort(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${month}/${day}`;
}

/* ─── Custom Tooltip ─────────────────────────────────────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-gray-400 mb-1.5 font-medium">
        {label ? formatDateLabel(label) : ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">
            {entry.dataKey === 'gross' ? 'Gross' : 'True Net'}:
          </span>
          <span className="font-semibold text-white">
            {formatCurrencyFull(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */

export default function AdminRevenueTrend() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<DayBucket[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrend() {
      setLoading(true);

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 30
        );
        const cutoff = thirtyDaysAgo.toISOString();

        // REVENUE FILTER: Only include finalized payments where payment_status = 'paid'.
        // This excludes unpaid, pending, and incomplete payment intents from trend data.
        const { data: rows, error } = await supabase
          .from('jobs')
          .select('paid_at, payment_amount_cents, payout_amount')
          .eq('payment_status', 'paid')
          .gte('paid_at', cutoff);



        if (error) {
          console.error('Revenue trend query error:', error);
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) {
          const jobs = rows || [];

          /* ── Group by date ────────────────────────────── */
          const buckets: Record<
            string,
            { grossCents: number; payoutTotal: number; count: number }
          > = {};

          for (const job of jobs) {
            if (!job.paid_at) continue;

            const dateKey = job.paid_at.slice(0, 10); // YYYY-MM-DD

            if (!buckets[dateKey]) {
              buckets[dateKey] = { grossCents: 0, payoutTotal: 0, count: 0 };
            }

            buckets[dateKey].grossCents += job.payment_amount_cents || 0;
            buckets[dateKey].payoutTotal += Number(job.payout_amount) || 0;
            buckets[dateKey].count += 1;
          }

          /* ── Build sorted array with calculations ───── */
          const result: DayBucket[] = Object.keys(buckets)
            .sort()
            .map((date) => {
              const b = buckets[date];
              const gross = round2(b.grossCents / 100);
              const payout = round2(b.payoutTotal);
              const net = round2(gross - payout);
              const stripeFeeEstimate = round2(
                gross * 0.029 + b.count * 0.3
              );
              const trueNet = round2(net - stripeFeeEstimate);

              return { date, gross, trueNet };
            });

          setChartData(result);
          setLoading(false);
        }
      } catch (err) {
        console.error('Revenue trend fetch error:', err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrend();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── Loading skeleton ───────────────────────────────── */
  if (loading) {
    return (
      <div className="w-full px-3 sm:px-4 pb-2 lg:px-6 lg:pb-3">
        <div className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-4 sm:p-5">
          <div className="h-4 w-48 bg-gray-800 rounded mb-1 animate-pulse" />
          <div className="h-3 w-32 bg-gray-800/60 rounded mb-4 sm:mb-5 animate-pulse" />
          <div className="h-48 sm:h-64 bg-gray-800/40 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  /* ─── Empty state ────────────────────────────────────── */
  if (chartData.length === 0) {
    return (
      <div className="w-full px-3 sm:px-4 pb-2 lg:px-6 lg:pb-3">
        <div className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wide">
            30-Day Revenue Trend
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Gross vs True Net</p>
          <div className="flex items-center justify-center h-36 sm:h-48 text-gray-600 text-sm">
            No paid jobs in the last 30 days.
          </div>
        </div>
      </div>
    );
  }

  /* ─── Chart ──────────────────────────────────────────── */
  return (
    <div className="w-full px-3 sm:px-4 pb-2 lg:px-6 lg:pb-3">
      <div className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-3 sm:p-5">
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wide">
            30-Day Revenue Trend
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Gross vs True Net</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 sm:gap-5 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
              Gross Revenue
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
              True Net
            </span>
          </div>
        </div>

        {/* Chart — responsive height */}
        <div className="h-48 sm:h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: 'rgba(255,255,255,0.08)',
                  strokeWidth: 1,
                }}
              />
              <Line
                type="monotone"
                dataKey="gross"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#34d399',
                  stroke: '#064e3b',
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="trueNet"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#60a5fa',
                  stroke: '#1e3a5f',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
