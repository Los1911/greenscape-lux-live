export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-zinc-950/70 p-4">
      <div className="text-xs text-emerald-300/70 mb-1">{label}</div>
      <div className="text-xl font-semibold text-emerald-100">{value}</div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="h-24 grid place-items-center text-emerald-300/70 text-sm">{text}</div>;
}