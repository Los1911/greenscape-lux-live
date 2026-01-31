import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

import { AdminSectionGroup } from '@/components/admin/layout/AdminSectionGroup'

import { AdminJobsPanel } from '@/components/admin/AdminJobsPanel'
import { AdminJobPricingPanel } from '@/components/admin/AdminJobPricingPanel'
import AdminJobPhotoReview from '@/components/admin/AdminJobPhotoReview'
import AdminPayoutQueue from '@/components/admin/AdminPayoutQueue'
import RemediationQueuePanel from '@/components/admin/RemediationQueuePanel'

import {
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Shield,
  Layers,
  LogOut
} from 'lucide-react'

/* =========================================================
   SAFE SECTION WRAPPER
========================================================= */

function SafeAdminSection({
  name,
  children
}: {
  name: string
  children: ReactNode
}) {
  try {
    return <>{children}</>
  } catch (err) {
    console.error('[ADMIN_SECTION_FAILED]', name, err)
    return (
      <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-sm text-red-300">
        ⚠️ {name} failed to load. Check console for details.
      </div>
    )
  }
}

/* =========================================================
   TYPES
========================================================= */

interface DashboardStats {
  totalUsers: number
  totalRevenue: number
  activeJobs: number
  pendingApprovals: number
  flaggedJobs: number
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0
  })

  /* -----------------------------
     AUTH GATE
  ----------------------------- */
  useEffect(() => {
    if (authLoading) return

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
  }, [authLoading, user, role, navigate])

  /* -----------------------------
     LOAD STATS
  ----------------------------- */
  useEffect(() => {
    if (authLoading || role !== 'admin') return
    loadStats()
  }, [authLoading, role])

  async function loadStats() {
    try {
      const [users, jobs, payments, approvals, flagged] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('landscapers').select('id', { count: 'exact' }).eq('approved', false),
        supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'flagged_review')
      ])

      const totalRevenue =
        payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      setStats({
        totalUsers: users.count || 0,
        totalRevenue,
        activeJobs: jobs.count || 0,
        pendingApprovals: approvals.count || 0,
        flaggedJobs: flagged.count || 0
      })
    } catch (err) {
      console.error('[ADMIN_STATS_FAILED]', err)
      setLoadError('Dashboard stats failed to load')
    } finally {
      setLoading(false)
    }
  }

  /* -----------------------------
     LOADING / ERROR
  ----------------------------- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-300">
        Loading admin dashboard
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-300">
        {loadError}
      </div>
    )
  }

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-300">
          Admin Dashboard
        </h1>

        <Button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/admin-login')
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* INLINE STAT CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Stat title="Users" value={stats.totalUsers} icon={<Users />} />
        <Stat title="Revenue" value={`$${stats.totalRevenue}`} icon={<DollarSign />} />
        <Stat title="Active Jobs" value={stats.activeJobs} icon={<Activity />} />
        <Stat title="Pending" value={stats.pendingApprovals} icon={<AlertTriangle />} />
        <Stat title="Flagged" value={stats.flaggedJobs} icon={<Shield />} />
      </section>

      <AdminSectionGroup title="Operations" icon={Layers}>
        <SafeAdminSection name="Admin Job Pricing">
          <AdminJobPricingPanel />
        </SafeAdminSection>

        <SafeAdminSection name="Admin Jobs Panel">
          <AdminJobsPanel />
        </SafeAdminSection>

        <SafeAdminSection name="Photo Review">
          <AdminJobPhotoReview />
        </SafeAdminSection>

        <SafeAdminSection name="Payout Queue">
          <AdminPayoutQueue />
        </SafeAdminSection>

        <SafeAdminSection name="Remediation Queue">
          <RemediationQueuePanel />
        </SafeAdminSection>
      </AdminSectionGroup>
    </div>
  )
}

/* =========================================================
   INLINE STAT CARD
========================================================= */

function Stat({
  title,
  value,
  icon
}: {
  title: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <div className="border border-emerald-500/20 rounded-lg p-4 bg-black/40">
      <div className="flex items-center gap-2 text-emerald-400 mb-1">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
