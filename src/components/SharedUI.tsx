import React from "react"

export function CardLayout({ title, icon, children }: { 
  title: string
  icon?: React.ReactNode
  children: React.ReactNode 
}) {
  return (
    <div className="rounded-2xl border border-emerald-800/40 bg-emerald-900/10 p-4 md:p-5 backdrop-blur">
      <div className="mb-2 md:mb-3 flex items-center gap-2">
        {icon}
        <div className="text-base md:text-lg font-semibold text-emerald-100">{title}</div>
      </div>
      {children}
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const s = String(status).toLowerCase()
  let color = "bg-gray-500/20 text-gray-300"
  if (s === "scheduled") color = "bg-emerald-500/20 text-emerald-300"
  else if (s === "active" || s === "in progress") color = "bg-yellow-500/20 text-yellow-300"
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {s === "active" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

export function StatusLegend() {
  return (
    <div className="mt-4 md:mt-5 flex items-center gap-3 md:gap-4 text-xs md:text-sm">
      <span className="flex items-center gap-2 text-emerald-200/80">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Scheduled
      </span>
      <span className="flex items-center gap-2 text-emerald-200/80">
        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> In Progress
      </span>
      <span className="flex items-center gap-2 text-emerald-200/80">
        <span className="inline-block h-2 w-2 rounded-full bg-gray-400" /> Completed
      </span>
    </div>
  )
}

export function formatFriendlyDate(dateStr: string | null): string {
  if (!dateStr) return "TBA"
  const dt = new Date(dateStr)
  return dt.toLocaleString(undefined, { 
    month: "short", 
    day: "numeric", 
    hour: "numeric", 
    minute: "2-digit" 
  })
}

export function formatFriendlyTime(dateStr: string | null): string {
  if (!dateStr) return "TBA"
  const dt = new Date(dateStr)
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatMoney(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(amount || 0)
  } catch {
    return `$${(amount || 0).toFixed(2)}`
  }
}
