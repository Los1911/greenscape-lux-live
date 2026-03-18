import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { waitForSupabaseSession } from '@/lib/supabaseHydration'
import { useAuth } from '@/contexts/AuthContext'

import { AdminMobileAccordion } from '@/components/admin/layout/AdminMobileAccordion'

import {
  Activity,
  AlertTriangle,
  Shield,
  RefreshCw,
  Search,
  Zap,
  FileWarning,
} from 'lucide-react'

/* ─── Helpers ──────────────────────────────────────────────── */

const log = (msg: string, data?: any) => {
  console.log('[ADMIN_OPERATIONS]', msg, data ?? '')
}

/* ─── Types ────────────────────────────────────────────────── */

interface DashboardStats {
  totalUsers: number
  totalRevenue: number
  activeJobs: number
  pendingApprovals: number
  flaggedJobs: number
}

/* ═══════════════════════════════════════════════════════════
   AdminOperations
   ═══════════════════════════════════════════════════════════ */

export default function AdminOperations() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0,
  })

  /* ── Auth guards ─────────────────────────────────────────── */

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/admin-login', { replace: true })
    if (role === 'client') navigate('/client-dashboard', { replace: true })
    if (role === 'landscaper')
      navigate('/landscaper-dashboard', { replace: true })
  }, [authLoading, user, role, navigate])

  useEffect(() => {
    if (authLoading || role !== 'admin') return
    loadStats()
  }, [authLoading, role])

  /* ── Data loading ────────────────────────────────────────── */

  const loadStats = useCallback(async () => {
    try {
      await waitForSupabaseSession()

      const [users, jobs, paidJobs, approvals, flagged] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase
          .from('jobs')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),
        // SCHEMA ALIGNMENT: jobs table uses 'payout_status', NOT 'payment_status'
        supabase.from('jobs').select('price').neq('payout_status', 'not_ready'),

        supabase
          .from('landscapers')
          .select('id', { count: 'exact' })
          .eq('approved', false),
        supabase
          .from('jobs')
          .select('id', { count: 'exact' })
          .eq('status', 'flagged_review'),
      ])

      const totalRevenue =
        paidJobs.data?.reduce((sum, j) => sum + (Number(j.price) || 0), 0) || 0

      setStats({
        totalUsers: users.count || 0,
        totalRevenue,
        activeJobs: jobs.count || 0,
        pendingApprovals: approvals.count || 0,
        flaggedJobs: flagged.count || 0,
      })
    } catch (e) {
      console.error('[ADMIN_OPERATIONS_STATS_FAILED]', e)
      setLoadError('Operations stats failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Derived ─────────────────────────────────────────────── */

  const attentionCount = stats.pendingApprovals + stats.flaggedJobs
  const hasAttentionItems = attentionCount > 0

  /* ── Loading / Error states ──────────────────────────────── */

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-black text-emerald-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm">Loading operations</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-black text-red-300 px-4">
        <p className="mb-4 text-center">{loadError}</p>
        <Button
          onClick={() => {
            setLoadError(null)
            setLoading(true)
            loadStats()
          }}
          variant="outline"
          className="w-full sm:w-auto border-red-500/30 text-red-300 hover:bg-red-500/10"
        >
          Retry
        </Button>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 lg:space-y-8">

      {/* ── Desktop Header (lg+ only) ──────────────────────── */}
      <div className="hidden lg:flex justify-between items-center">
        <h1 className="text-2xl font-bold text-emerald-300">
          Operations
        </h1>
        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search operations..."
              className="pl-9 pr-4 py-2 w-64 rounded-lg border border-emerald-500/20 bg-black/50 text-sm text-white placeholder:text-emerald-500/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <Button
            size="sm"
            onClick={() => loadStats()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Run Check
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadStats()}
            className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — NEEDS ATTENTION
          ═══════════════════════════════════════════════════════ */}
      <AdminMobileAccordion
        id="attention"
        title="Needs Attention"
        icon={AlertTriangle}
        badgeCount={attentionCount}
        badgeVariant={hasAttentionItems ? 'danger' : 'default'}
        forceExpandWhenNonZero
        defaultCollapsedMobile={!hasAttentionItems}
      >
        {hasAttentionItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pending Approvals */}
            {stats.pendingApprovals > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('[data-section-id="landscapers"]')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/25 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-yellow-300">
                    {stats.pendingApprovals} Pending Review
                  </p>
                  <p className="text-xs text-yellow-300/60 mt-0.5">
                    Landscapers awaiting approval
                  </p>
                </div>
                <span className="text-lg font-bold text-yellow-400 shrink-0">
                  {stats.pendingApprovals}
                </span>
              </button>
            )}

            {/* Flagged Jobs */}
            {stats.flaggedJobs > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('[data-section-id="operations"]')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="flex items-start gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left w-full"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <FileWarning className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-300">
                    {stats.flaggedJobs} Flagged Jobs
                  </p>
                  <p className="text-xs text-red-300/60 mt-0.5">
                    Jobs requiring manual review
                  </p>
                </div>
                <span className="text-lg font-bold text-red-400 shrink-0">
                  {stats.flaggedJobs}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-300">
                All clear
              </p>
              <p className="text-xs text-emerald-300/50 mt-0.5">
                No pending reviews or flagged items
              </p>
            </div>
          </div>
        )}
      </AdminMobileAccordion>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — QUICK ACTIONS
          ═══════════════════════════════════════════════════════ */}
      <section
        data-section-id="quick-actions"
        className="space-y-3 lg:hidden"
      >
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide px-1">
          Quick Actions
        </h2>

        {/* Mobile search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dashboard..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-emerald-500/20 bg-black/50 text-sm text-white placeholder:text-emerald-500/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 h-12"
          />
        </div>

        {/* Action buttons — stacked full-width on mobile */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => loadStats()}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Run Check
          </Button>
          <Button
            variant="outline"
            onClick={() => loadStats()}
            className="w-full h-10 border-emerald-500/25 text-emerald-300/70 hover:bg-emerald-500/10 text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Dashboard
          </Button>
        </div>
      </section>

    </div>
  )
}
