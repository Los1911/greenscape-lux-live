import React, { useState } from "react"

type DayPoint = { date: string; amount: number }

export function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 opacity-90">
      <path fill="currentColor" d="M9 4h6a1 1 0 011 1v2h3a2 2 0 012 2v3h-9v-1H2V9a2 2 0 012-2h3V5a1 1 0 011-1Zm1 2v1h4V6h-4Zm12 7v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5h9v1h6v-1h5Z"/>
    </svg>
  )
}

export function IconDollar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 opacity-90">
      <path fill="currentColor" d="M11 3h2v2.06c2.28.25 4 1.54 4 3.44 0 1.93-1.47 2.96-3.76 3.46L13 12v3.12c1.3-.2 2.2-.75 2.88-1.52l1.77 1c-.98 1.24-2.43 2.03-4.65 2.27V21h-2v-4.1c-2.55-.3-4-1.77-4-3.6 0-2.03 1.64-3.06 4-3.54l0-.01V6.84c-1.05.18-1.84.66-2.48 1.35l-1.7-.98C7.75 5.97 9.1 5.2 11 5.06V3Zm0 8.1c-1.5.33-2.2.86-2.2 1.7 0 .88.74 1.47 2.2 1.65V11.1Zm2-.4c1.48-.3 2.1-.8 2.1-1.58 0-.82-.66-1.38-2.1-1.56V10.7Z"/>
    </svg>
  )
}

export function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 opacity-90">
      <path fill="currentColor" d="M12 2 4 14h6l-1 8 9-13h-6l1-7Z"/>
    </svg>
  )
}

export function Sparkline({ points, onClick }: { points: DayPoint[]; onClick: () => void }) {
  if (!points || points.length === 0) return <div className="h-14 w-full rounded bg-emerald-900/30" />
  const w = 300, h = 56
  const max = Math.max(...points.map(p => p.amount), 1)
  const step = w / Math.max(points.length - 1, 1)
  const d = points.map((p, i) => {
    const x = i * step
    const y = h - (p.amount / max) * (h - 6) - 3
    return `${i === 0 ? "M" : "L"} ${x},${y}`
  }).join(" ")
  return (
    <button onClick={onClick} className="block w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full">
        <path d={d} fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="2" />
      </svg>
    </button>
  )
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const [show, setShow] = useState(open)
  React.useEffect(() => {
    if (open) setShow(true)
    else {
      const t = setTimeout(() => setShow(false), 180)
      return () => clearTimeout(t)
    }
  }, [open])
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative z-10 w-[92vw] max-w-3xl rounded-2xl border border-emerald-800/40 bg-emerald-900/20 p-4 md:p-5 backdrop-blur transition-all duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <div className="mb-2 md:mb-3 flex items-center justify-between">
          <div className="text-base md:text-lg font-semibold text-emerald-100">{title}</div>
          <button onClick={onClose} className="rounded bg-emerald-700 px-3 py-1 text-xs md:text-sm">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Card(props: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-800/40 bg-emerald-900/10 p-4 md:p-5">
      <div className="mb-2 md:mb-3 flex items-center gap-2">
        {props.icon}
        <div className="text-base md:text-lg font-semibold text-emerald-100">{props.title}</div>
      </div>
      {props.children}
    </div>
  )
}