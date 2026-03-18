import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Layers,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Zap,
} from 'lucide-react'

/* ─── Tab Config ─────────────────────────────────────────── */

const TABS = [
  { to: '/admin/operations', label: 'Operations', icon: Layers },
  { to: '/admin/landscapers', label: 'Landscapers', icon: Users },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/performance', label: 'Performance', icon: BarChart3 },
  { to: '/admin/system', label: 'System', icon: Settings },
] as const

/* ═══════════════════════════════════════════════════════════
   AdminConsole — Top-level layout for /admin/*
   ═══════════════════════════════════════════════════════════ */

export default function AdminConsole() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/admin-login', { replace: true })
      return
    }
    if (role === 'client') {
      navigate('/client-dashboard', { replace: true })
      return
    }
    if (role === 'landscaper') {
      navigate('/landscaper-dashboard', { replace: true })
      return
    }
  }, [loading, user, role, navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin-login')
  }

  /* ── Loading state ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-emerald-400/70">Loading console…</span>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── Sticky Header + Segmented Nav ───────────────────── */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-emerald-500/15">
        {/* Top bar — brand + logout */}
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-emerald-300 truncate">
                GreenScape Admin
              </h1>
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                Management Console
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Segmented tab navigation */}
        <nav
          className="flex overflow-x-auto scrollbar-none px-4 lg:px-8 -mb-px"
          aria-label="Admin console tabs"
        >
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/operations'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                  isActive
                    ? 'border-emerald-500 text-emerald-300'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700',
                ].join(' ')
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Page content (child route) ──────────────────────── */}
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
