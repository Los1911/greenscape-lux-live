import GlowCard from "@/components/v2/GlowCard";

export default function Notifications() {
  return (
    <GlowCard 
      title="Notifications" 
      icon={
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
      }
    >
      <div className="rounded-xl border border-emerald-500/15 bg-zinc-950/60 p-3 text-sm text-emerald-200">
        You are all set. Keep an eye out for new offers.
      </div>
    </GlowCard>
  );
}