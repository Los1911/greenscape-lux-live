import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Percent, Hash, CreditCard, Wallet } from 'lucide-react';

type ViewMode = 'lifetime' | 'mtd';

interface RevenueData {
  gross: number;
  netRevenue: number;
  stripeFeeEstimate: number;
  trueNet: number;
  trueProfitPercent: number;
  paidJobs: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="w-full min-w-0 bg-gray-900/80 border border-gray-800 rounded-xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
      <div
        className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-gray-500 truncate">
          {label}
        </p>
        <p className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminRevenueSnapshot() {
  const [viewMode, setViewMode] = useState<ViewMode>('lifetime');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData>({
    gross: 0,
    netRevenue: 0,
    stripeFeeEstimate: 0,
    trueNet: 0,
    trueProfitPercent: 0,
    paidJobs: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchRevenue() {
      setLoading(true);

      try {
        // REVENUE FILTER: Only include finalized payments where payment_status = 'paid'.
        // This excludes unpaid, pending, and incomplete payment intents from revenue totals.
        let query = supabase
          .from('jobs')
          .select('payment_amount_cents, payout_amount, paid_at')
          .eq('payment_status', 'paid');



        if (viewMode === 'mtd') {
          const now = new Date();
          const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          query = query.gte('paid_at', firstOfMonth);
        }

        const { data: rows, error } = await query;

        if (error) {
          console.error('Revenue snapshot query error:', error);
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) {
          const jobs = rows || [];
          let grossCents = 0;
          let payoutTotal = 0;

          for (const job of jobs) {
            grossCents += job.payment_amount_cents || 0;
            payoutTotal += Number(job.payout_amount) || 0;
          }

          const paidJobs = jobs.length;

          const gross = Math.round((grossCents / 100) * 100) / 100;
          const net = Math.round((gross - payoutTotal) * 100) / 100;
          const stripeFeeEstimate = Math.round(((gross * 0.029) + (paidJobs * 0.30)) * 100) / 100;
          const trueNet = Math.round((net - stripeFeeEstimate) * 100) / 100;
          const trueProfitPercent = gross > 0
            ? Math.round(((trueNet / gross) * 100) * 100) / 100
            : 0;

          setData({
            gross,
            netRevenue: net,
            stripeFeeEstimate,
            trueNet,
            trueProfitPercent,
            paidJobs,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Revenue snapshot fetch error:', err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchRevenue();

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 pt-4 sm:pt-5 pb-2 lg:pt-6 lg:pb-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h2 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wide truncate">
          Revenue Snapshot
        </h2>

        {/* Toggle */}
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('lifetime')}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors ${
              viewMode === 'lifetime'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Lifetime
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mtd')}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors ${
              viewMode === 'mtd'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            MTD
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-3 sm:p-4 animate-pulse"
            >
              <div className="h-3 w-16 bg-gray-800 rounded mb-3" />
              <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Gross Revenue"
            value={formatCurrency(data.gross)}
            icon={DollarSign}
            color="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            label="Net Revenue"
            value={formatCurrency(data.netRevenue)}
            icon={TrendingUp}
            color="bg-blue-500/15 text-blue-400"
          />
          <StatCard
            label="Stripe Fees (Est.)"
            value={formatCurrency(data.stripeFeeEstimate)}
            icon={CreditCard}
            color="bg-rose-500/15 text-rose-400"
          />
          <StatCard
            label="True Net"
            value={formatCurrency(data.trueNet)}
            icon={Wallet}
            color="bg-cyan-500/15 text-cyan-400"
          />
          <StatCard
            label="True Profit %"
            value={`${data.trueProfitPercent.toFixed(2)}%`}
            icon={Percent}
            color="bg-purple-500/15 text-purple-400"
          />
          <StatCard
            label="Paid Jobs"
            value={data.paidJobs.toLocaleString()}
            icon={Hash}
            color="bg-amber-500/15 text-amber-400"
          />
        </div>
      )}
    </div>
  );
}
