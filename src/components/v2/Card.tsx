import React from "react";

export default function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-zinc-950/70 shadow-[0_0_30px_rgba(16,185,129,0.08)] backdrop-blur p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-emerald-300">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-emerald-400/10" />
      ))}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center text-sm text-emerald-300/70">
      {label}
    </div>
  );
}