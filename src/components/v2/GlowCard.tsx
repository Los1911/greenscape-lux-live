import React from "react";

export default function GlowCard({
  title,
  icon,
  right,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-2xl border border-emerald-500/20 bg-black/60",
        "shadow-[0_0_40px_rgba(16,185,129,0.12)] backdrop-blur p-6",
        className,
      ].join(" ")}
    >
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-emerald-200 font-semibold text-lg">{title}</h3>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}