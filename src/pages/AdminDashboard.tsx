import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { waitForSupabaseSession } from '@/lib/supabaseHydration'
import { useAuth } from '@/contexts/AuthContext'

import { AdminStatCard } from '@/components/admin/layout/AdminStatCard'
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
  LogOut,
  Layers,
  Shield
} from 'lucide-react'

/* ===============================
   TYPES
=============================== */

interface Job {
  id: string
  price?: number | null
  priced_at?: string | null
  assigned_to?: string | null
  landscaper_id?: string | null
  completed_at?: string | null
  flagged_at?: string | null
}

type LifecycleStage =
  | 'pricing'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'unclassified'

/* ===============================
   LIFECYCLE AUTHORITY
=============================== */

function deriveLifecycle(job: Job): LifecycleStage {
  if (job.completed_at) return 'completed'
  if ((job.assigned_to || job.landscaper_id) && !job.completed_at) return 'active'
  if (job.priced_at && !job.assigned_to) return 'scheduled'
  if (job.price == null || job.priced_at == null) return 'pricing'
  return 'unclassified'
}

/* ===============================
   SAFE WRAPPER
=============================== */

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
        ⚠️ {name} failed to load
      </div>
    )
  }
}

/* ===============================
   COMPONENT
=============================== */

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0
  })

  /* ---------------------------
     AUTH GATE
  ---------------------------- */
  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/admin-login', { replace: true })
    if (role !== 'admin') navigate('/', { replace: true })
  }, [authLoading, user, role, navigate])

  /* ---------------------------
     LOAD DASHBOARD DATA
  ---------------------------- */
  useEffect(() => {
    if (authLoading || role !== 'admin') return
    loadDashboard()
  }, [authLoading, role])

  async function loadDashboard() {
    try {
      setLoading(true)
      await waitForSupabaseSession()

      const [
        usersRes,
        jobsRes,
        paymentsRes,
        pendingApprovalsRes
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('jobs').select(`
          id,
          price,
          priced_at,
          assigned_to,
          landscaper_id,
          completed_at,
          flagged_at
        `),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('landscapers').select('id', { count: 'exact' }).eq('approved', false)
      ])

      if (jobsRes.error) throw jobsRes.error

      const jobs = jobsRes.data || []

      const lifecycleCounts = jobs.reduce(
        (acc, job) => {
          const stage = deriveLifecycle(job)
          acc[stage]++
          if (job.flagged_at) acc.flagged++
          return acc
        },
        {
          pricing: 0,
          scheduled: 0,
          active: 0,
          completed: 0,
          unclassified: 0,
          flagged: 0
        }
      )

      const totalRevenue =
        paymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      setStats({
        totalUsers: usersRes.count || 0,
        totalRevenue,
        activeJobs: lifecycleCounts.active,
        pendingApprovals: pendingApprovalsRes.count || 0,
        flaggedJobs: lifecycleCounts.flagged
      })
    } catch (err) {
      console.error('[ADMIN_DASHBOARD_FAILED]', err)
      setError('Admin dashboard failed to load')
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------
     STATES
  ---------------------------- */

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

  /* ---------------------------
     RENDER
  ---------------------------- */

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-300">Admin Dashboard</h1>
        <Button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/admin-login')
          }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <AdminStatCard title="Users" value={stats.totalUsers} icon={Users} />
        <AdminStatCard title="Revenue" value={`$${stats.totalRevenue}`} icon={DollarSign} />
        <AdminStatCard title="Active Jobs" value={stats.activeJobs} icon={Activity} />
        <AdminStatCard title="Pending" value={stats.pendingApprovals} icon={AlertTriangle} />
        <AdminStatCard title="Flagged" value={stats.flaggedJobs} icon={Shield} />
      </section>

      <AdminSectionGroup title="Operations" icon={Layers}>
        <SafeAdminSection name="Pricing">
          <AdminJobPricingPanel />
        </SafeAdminSection>

        <SafeAdminSection name="Jobs">
          <AdminJobsPanel />
        </SafeAdminSection>

        <SafeAdminSection name="Photos">
          <AdminJobPhotoReview />
        </SafeAdminSection>

        <SafeAdminSection name="Payouts">
          <AdminPayoutQueue />
        </SafeAdminSection>

        <SafeAdminSection name="Remediation">
          <RemediationQueuePanel />
        </SafeAdminSection>
      </AdminSectionGroup>
    </div>
  )
}
