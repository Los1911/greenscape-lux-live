import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { waitForSupabaseSession } from '@/lib/supabaseHydration'
import { useAuth } from '@/contexts/AuthContext'

import { AdminMobileAccordion } from '@/components/admin/layout/AdminMobileAccordion'
import { AdminMobileSectionNav } from '@/components/admin/layout/AdminMobileSectionNav'

import { LandscaperApprovalPanel } from '@/components/admin/LandscaperApprovalPanel'
import TierManagementPanel from '@/components/admin/TierManagementPanel'
import PromotionQueuePanel from '@/components/admin/PromotionQueuePanel'
import BadgeManagementPanel from '@/components/admin/BadgeManagementPanel'

import {
  UserCheck,
  Trophy,
  Layers,
  Award,
  RefreshCw,
  Search,
} from 'lucide-react'

/* ─── Helpers ──────────────────────────────────────────────── */

const log = (msg: string, data?: any) => {
  console.log('[ADMIN_LANDSCAPERS]', msg, data ?? '')
}

function SafeAdminSection({
  name,
  children,
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
        {name} failed to load. Check console for details.
      </div>
    )
  }
}

/* ─── Types ────────────────────────────────────────────────── */

interface LandscaperStats {
  pendingApprovals: number
}

/* ─── Mobile Section Config ────────────────────────────────── */
const MOBILE_SECTIONS = [
  { id: 'approvals', label: 'Approvals', icon: UserCheck },
  { id: 'tiers', label: 'Tier Management', icon: Layers },
  { id: 'promotions', label: 'Promotions', icon: Trophy },
  { id: 'badges', label: 'Badges', icon: Award },
]

/* ═══════════════════════════════════════════════════════════
   AdminLandscapers
   ═══════════════════════════════════════════════════════════ */

export default function AdminLandscapers() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSection, setMobileSection] = useState('approvals')

  const [stats, setStats] = useState<LandscaperStats>({
    pendingApprovals: 0,
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

      const [approvals] = await Promise.all([
        supabase
          .from('landscapers')
          .select('id', { count: 'exact' })
          .eq('approved', false),
      ])

      setStats({
        pendingApprovals: approvals.count || 0,
      })
    } catch (e) {
      console.error('[ADMIN_LANDSCAPERS_STATS_FAILED]', e)
      setLoadError('Landscaper stats failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Loading / Error states ──────────────────────────────── */

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-black text-emerald-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm">Loading landscaper management</span>
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
          Landscapers
        </h1>
        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landscapers..."
              className="pl-9 pr-4 py-2 w-64 rounded-lg border border-emerald-500/20 bg-black/50 text-sm text-white placeholder:text-emerald-500/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <Button
            size="sm"
            onClick={() => loadStats()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Mobile Section Navigator (dropdown, <lg only) ──── */}
      <AdminMobileSectionNav
        sections={MOBILE_SECTIONS}
        activeSection={mobileSection}
        onSectionChange={setMobileSection}
      />

      {/* ═══════════════════════════════════════════════════════
          SECTION — LANDSCAPER APPROVALS
          ═══════════════════════════════════════════════════════ */}
      <AdminMobileAccordion
        id="approvals"
        title="Landscaper List"
        icon={UserCheck}
        badgeCount={stats.pendingApprovals}
        badgeVariant={stats.pendingApprovals > 0 ? 'warning' : 'default'}
        subtitle="Approvals, documents, and status"
      >
        <SafeAdminSection name="Landscaper Approvals">
          <LandscaperApprovalPanel />
        </SafeAdminSection>
      </AdminMobileAccordion>

      {/* ═══════════════════════════════════════════════════════
          SECTION — TIER MANAGEMENT
          ═══════════════════════════════════════════════════════ */}
      <AdminMobileAccordion
        id="tiers"
        title="Tier Management"
        icon={Layers}
        subtitle="Manage landscaper tier levels"
        defaultCollapsedMobile
      >
        <SafeAdminSection name="Tier Management">
          <TierManagementPanel />
        </SafeAdminSection>
      </AdminMobileAccordion>

      {/* ═══════════════════════════════════════════════════════
          SECTION — PROMOTION QUEUE
          ═══════════════════════════════════════════════════════ */}
      <AdminMobileAccordion
        id="promotions"
        title="Promotion Queue"
        icon={Trophy}
        subtitle="Review and approve tier promotions"
        defaultCollapsedMobile
      >
        <SafeAdminSection name="Promotion Queue">
          <PromotionQueuePanel />
        </SafeAdminSection>
      </AdminMobileAccordion>

      {/* ═══════════════════════════════════════════════════════
          SECTION — BADGE MANAGEMENT
          ═══════════════════════════════════════════════════════ */}
      <AdminMobileAccordion
        id="badges"
        title="Badge Management"
        icon={Award}
        subtitle="Assign and manage landscaper badges"
        defaultCollapsedMobile
      >
        <SafeAdminSection name="Badge Management">
          <BadgeManagementPanel />
        </SafeAdminSection>
      </AdminMobileAccordion>

    </div>
  )
}
