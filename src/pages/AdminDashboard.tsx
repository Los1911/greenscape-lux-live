import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { waitForSupabaseSession } from '@/lib/supabaseHydration'
import { useAuth } from '@/contexts/AuthContext'

import { AdminStatCard } from '@/components/admin/layout/AdminStatCard'
import { AdminCollapsibleSection } from '@/components/admin/layout/AdminCollapsibleSection'
import { AdminSectionGroup } from '@/components/admin/layout/AdminSectionGroup'

import { LandscaperApprovalPanel } from '@/components/admin/LandscaperApprovalPanel'
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor'
import { JobMatchingDashboard } from '@/components/admin/JobMatchingDashboard'
import { RouteOptimizationDashboard } from '@/components/admin/RouteOptimizationDashboard'
import { LiveGPSMapView } from '@/components/admin/LiveGPSMapView'
import { AdminJobsPanel } from '@/components/admin/AdminJobsPanel'
import { AdminJobPricingPanel } from '@/components/admin/AdminJobPricingPanel'
import { AdminMessageViewer } from '@/components/admin/AdminMessageViewer'
import RemediationQueuePanel from '@/components/admin/RemediationQueuePanel'
import TierManagementPanel from '@/components/admin/TierManagementPanel'
import PromotionQueuePanel from '@/components/admin/PromotionQueuePanel'
import BadgeManagementPanel from '@/components/admin/BadgeManagementPanel'
import EarningsGoalsAnalytics from '@/components/admin/EarningsGoalsAnalytics'
import { PerformanceAnalyticsDashboard } from '@/components/admin/PerformanceAnalyticsDashboard'
import AdminJobPhotoReview from '@/components/admin/AdminJobPhotoReview'
import AdminJobCompletionReview from '@/components/admin/AdminJobCompletionReview'
import AdminPayoutQueue from '@/components/admin/AdminPayoutQueue'
import { GeofenceMonitoringDashboard } from '@/components/admin/GeofenceMonitoringDashboard'
import { ExpansionWaitlistManager } from '@/components/admin/ExpansionWaitlistManager'
import { EnvironmentVariablesDashboard } from '@/components/admin/EnvironmentVariablesDashboard'
import { AdminServiceAreaManager } from '@/components/admin/AdminServiceAreaManager'
import TestUserManager from '@/components/admin/TestUserManager'



import {
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  LogOut,
  Sparkles,
  Navigation,
  MapPin,
  Radio,
  TrendingUp,
  UserPlus,
  Settings,
  Briefcase,
  MessageCircle,
  Shield,
  Award,
  Trophy,
  Target,
  BarChart3,
  Camera,
  ArrowUpCircle,
  Globe,
  Layers,
  Zap,
  Map,
  Wrench,
  UserX,
  Receipt,
  ClipboardCheck,
  Wallet
} from 'lucide-react'

const log = (msg: string, data?: any) => {
  console.log('[ADMIN_DASHBOARD]', msg, data ?? '')
}

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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    flaggedJobs: 0
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/admin-login', { replace: true })
    if (role === 'client') navigate('/client-dashboard', { replace: true })
    if (role === 'landscaper') navigate('/landscaper-dashboard', { replace: true })
  }, [authLoading, user, role, navigate])

  useEffect(() => {
    if (authLoading || role !== 'admin') return
    loadStats()
  }, [authLoading, role])

  async function loadStats() {
    try {
      await waitForSupabaseSession()

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
      console.error('[ADMIN_STATS_FAILED]', e)
      setLoadError('Dashboard stats failed to load')
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

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-300">
        {loadError}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-emerald-300">Admin Dashboard</h1>
          <Button onClick={async () => {
            await supabase.auth.signOut()
            navigate('/admin-login')
          }}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <AdminStatCard title="Users" value={stats.totalUsers} icon={Users} />
          <AdminStatCard title="Revenue" value={`$${stats.totalRevenue}`} icon={DollarSign} />
          <AdminStatCard title="Active Jobs" value={stats.activeJobs} icon={Activity} />
          <AdminStatCard title="Pending" value={stats.pendingApprovals} icon={AlertTriangle} />
          <AdminStatCard title="Flagged" value={stats.flaggedJobs} icon={Shield} />
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
    </div>
  )
}
