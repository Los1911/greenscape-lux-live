import React from "react";
import Card, { Skeleton, Empty } from "./Card";

export default function EarningsPanel({ loading, earnings }: { loading: boolean; earnings: any }) {
  if (loading) return <Card title="Earnings Overview"><Skeleton rows={6} /></Card>;

  if (!earnings) return <Card title="Earnings Overview"><Empty label="No earnings yet" /></Card>;

  return (
    <Card title="Earnings Overview" right={<span className="text-xs text-emerald-400/70">Last 30 Days</span>}>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="All Time" value={`$${earnings.all_time_earnings || 0}`} />
        <Stat label="This Month" value={`$${earnings.monthly_earnings || 0}`} />
        <Stat label="Today" value={`$${earnings.daily_earnings || 0}`} />
      </div>
      <div className="h-24 rounded-lg border border-emerald-500/10 bg-black/40" />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-500/10 bg-black/40 p-3">
      <div className="text-xs text-emerald-300/70">{label}</div>
      <div className="text-lg font-semibold text-emerald-200">{value}</div>
    </div>
  );
}