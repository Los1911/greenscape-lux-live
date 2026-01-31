import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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

interface DashboardStats {
  totalUsers: number
  totalRevenue: number
  activeJobs: number
  pendingApprovals: number
  flaggedJobs: number
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0
  })

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/admin-login', { replace: true })
      return
    }

    if (role !== 'admin') {
      navigate('/', { replace: true })
      return
    }

    loadStats()
  }, [authLoading, user, role])

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
      console.error('[ADMIN_DASHBOARD_STATS_ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-300">
        Loading admin dashboard
      </div>
    )
  }

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
        <StatCard title="Users" value={stats.totalUsers} icon={<Users />} />
        <StatCard title="Revenue" value={`$${stats.totalRevenue}`} icon={<DollarSign />} />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={<Activity />} />
        <StatCard title="Pending" value={stats.pendingApprovals} icon={<AlertTriangle />} />
        <StatCard title="Flagged" value={stats.flaggedJobs} icon={<Shield />} />
      </section>

      <div className="space-y-8">
        <AdminJobPricingPanel />
        <AdminJobPhotoReview />
        <AdminPayoutQueue />
        <RemediationQueuePanel />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon
}: {
  title: string
  value: string | number
  icon: JSX.Element
}) {
  return (
    <div className="border border-emerald-500/20 rounded-lg p-4 bg-emerald-500/5">
      <div className="flex items-center gap-3">
        <div className="text-emerald-400">{icon}</div>
        <div>
          <div className="text-sm text-emerald-300">{title}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    </div>
  )
}
