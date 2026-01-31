import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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
  LogOut
} from 'lucide-react'

/* =========================================================
   SAFE SECTION
========================================================= */
function SafeAdminSection({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  try {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-emerald-300 mb-4">
          {title}
        </h2>
        {children}
      </section>
    )
  } catch (err) {
    console.error('[ADMIN_SECTION_FAILED]', title, err)
    return (
      <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-sm text-red-300 mb-8">
        ⚠️ {title} failed to load. Check console.
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
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0
  })

  /* -----------------------------
     AUTH GUARD
  ----------------------------- */
  useEffect(() => {
    if (authLoading) return

    if (!user) navigate('/admin-login', { replace: true })
    if (role === 'client') navigate('/client-dashboard', { replace: true })
    if (role === 'landscaper') navigate('/landscaper-dashboard', { replace: true })
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
    } catch (e) {
      console.error(e)
      setError('Failed to load admin stats')
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-300">
        {error}
      </div>
    )
  }

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-8">
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

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <Stat title="Users" value={stats.totalUsers} icon={<Users />} />
        <Stat title="Revenue" value={`$${stats.totalRevenue}`} icon={<DollarSign />} />
        <Stat title="Active Jobs" value={stats.activeJobs} icon={<Activity />} />
        <Stat title="Pending" value={stats.pendingApprovals} icon={<AlertTriangle />} />
        <Stat title="Flagged" value={stats.flaggedJobs} icon={<Shield />} />
      </div>

      {/* OPERATIONS */}
      <SafeAdminSection title="Job Pricing">
        <AdminJobPricingPanel />
      </SafeAdminSection>

      <SafeAdminSection title="Jobs">
        <AdminJobsPanel />
      </SafeAdminSection>

      <SafeAdminSection title="Photo Review">
        <AdminJobPhotoReview />
      </SafeAdminSection>

      <SafeAdminSection title="Payout Queue">
        <AdminPayoutQueue />
      </SafeAdminSection>

      <SafeAdminSection title="Remediation Queue">
        <RemediationQueuePanel />
      </SafeAdminSection>
    </div>
  )
}

/* =========================================================
   STAT CARD
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
