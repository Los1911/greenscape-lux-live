import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { useAdminLifecycleToasts } from '@/hooks/useAdminLifecycleToasts';

import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Briefcase,
  Camera,
  Wallet,
  Shield,
  Award,
  Trophy,
  Target,
  BarChart3,
  Map,
  Globe,
  Layers,
  Settings,
  Zap,
  UserX,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


/* ─── Admin module imports ────────────────────────────────── */

import AdminRevenueSnapshot from '@/components/admin/AdminRevenueSnapshot';
import AdminRevenueTrend from '@/components/admin/AdminRevenueTrend';
import { LifecycleOperationsPanel } from '@/components/admin/LifecycleOperationsPanel';
import { PaymentNotificationsFeed } from '@/components/admin/PaymentNotificationsFeed';

import { LandscaperApprovalPanel } from '@/components/admin/LandscaperApprovalPanel';
// DEPRECATED: AdminJobPricingPanel — all pricing is now handled by LifecycleOperationsPanel (Operations Control Center)
// import { AdminJobPricingPanel } from '@/components/admin/AdminJobPricingPanel';
import { AdminJobsPanel } from '@/components/admin/AdminJobsPanel';

import AdminJobPhotoReview from '@/components/admin/AdminJobPhotoReview';
import AdminPayoutQueue from '@/components/admin/AdminPayoutQueue';
import RemediationQueuePanel from '@/components/admin/RemediationQueuePanel';
import TierManagementPanel from '@/components/admin/TierManagementPanel';
import BadgeManagementPanel from '@/components/admin/BadgeManagementPanel';
import EarningsGoalsAnalytics from '@/components/admin/EarningsGoalsAnalytics';
import { PerformanceAnalyticsDashboard } from '@/components/admin/PerformanceAnalyticsDashboard';
import { AdminServiceAreaManager } from '@/components/admin/AdminServiceAreaManager';
import { GeofenceMonitoringDashboard } from '@/components/admin/GeofenceMonitoringDashboard';
import { ExpansionWaitlistManager } from '@/components/admin/ExpansionWaitlistManager';
import { EnvironmentVariablesDashboard } from '@/components/admin/EnvironmentVariablesDashboard';
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor';
import TestUserManager from '@/components/admin/TestUserManager';


/* ─── Types ──────────────────────────────────────────────── */

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/* ─── Navigation Config ──────────────────────────────────── */

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { id: 'lifecycle-ops', label: 'Operations', icon: Activity },
      { id: 'performance', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'landscapers',
    label: 'Landscapers',
    icon: UserX,
    items: [
      { id: 'landscaper-list', label: 'Landscaper List', icon: UserX },
    ],
  },
  {
    id: 'operations',
    label: 'Job Management',
    icon: Briefcase,
    items: [
      // DEPRECATED: Job Pricing removed — pricing is now handled in Operations Control Center
      { id: 'jobs', label: 'Jobs Panel', icon: Briefcase },
      { id: 'photos', label: 'Photo Review', icon: Camera },
      { id: 'payouts', label: 'Payout Queue', icon: Wallet },
      { id: 'remediation', label: 'Remediation', icon: Shield },
    ],
  },

  {
    id: 'growth',
    label: 'Growth & Quality',
    icon: Trophy,
    items: [
      { id: 'tiers', label: 'Tier Management', icon: Award },
      { id: 'badges', label: 'Badges', icon: Trophy },
      { id: 'goals', label: 'Earnings Goals', icon: Target },
      { id: 'performance-analytics', label: 'Performance', icon: BarChart3 },
    ],
  },
  {
    id: 'coverage',
    label: 'Coverage',
    icon: Map,
    items: [
      { id: 'service-areas', label: 'Service Areas', icon: Map },
      { id: 'geofences', label: 'Geofences', icon: Globe },
      { id: 'waitlist', label: 'Expansion Waitlist', icon: Layers },
    ],
  },
  {
    id: 'system',
    label: 'System Health',
    icon: Settings,
    items: [
      { id: 'environment', label: 'Environment', icon: Zap },
      { id: 'health', label: 'System Health', icon: Settings },
      { id: 'test-users', label: 'Test Users', icon: UserX },
    ],
  },
];



/* ─── Sidebar Group ──────────────────────────────────────── */

function SidebarGroup({
  group,
  activeItem,
  onItemClick,
}: {
  group: NavGroup;
  activeItem: string;
  onItemClick: (item: NavItem) => void;
}) {
  const hasActiveChild = group.items.some((item) => item.id === activeItem);
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const [expanded, setExpanded] = useState(isDesktop ? hasActiveChild : true);

  useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true);
    }
  }, [hasActiveChild]);

  const Icon = group.icon;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/60 hover:text-emerald-400 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
        )}
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{group.label}</span>
      </button>

      {(expanded || !isDesktop) && (
        <div className="space-y-0.5 ml-2">
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }
                `}
              >
                <ItemIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── AdminLayout ────────────────────────────────────────── */

export function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('lifecycle-ops');

  // ── Realtime lifecycle toasts (new quotes, photo review) ──
  useAdminLifecycleToasts();



  // Close sidebar on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      setActiveSection(item.id);
      setSidebarOpen(false);
    },
    []
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login');
  };

  /* ─── Sidebar content (shared between desktop & mobile) ─── */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-500/15 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-emerald-300 truncate">GreenScape Admin</h2>
          <p className="text-[10px] text-gray-500 truncate">Management Console</p>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup
            key={group.id}
            group={group}
            activeItem={activeSection}
            onItemClick={handleNavClick}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-emerald-500/15 p-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Desktop Sidebar (lg+) ─────────────────────────── */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:flex-col bg-gray-950 border-r border-emerald-500/15">
        {sidebarContent}
      </aside>

      {/* ── Mobile Overlay ────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 border-r border-emerald-500/15
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="lg:pl-60 min-h-screen flex flex-col w-full">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-emerald-500/15 lg:hidden">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-emerald-300 truncate">Admin Dashboard</h1>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full overflow-x-hidden">
          {/* Responsive content wrapper: full-width on mobile, capped on ultrawide */}
          <div className="w-full max-w-screen-xl mx-auto">
            {/* Real-time payment notifications — visible across all sections */}
            <PaymentNotificationsFeed
              onNotificationClick={() => setActiveSection('payouts')}
            />

            <AdminRevenueSnapshot />
            <AdminRevenueTrend />


            {activeSection === 'lifecycle-ops' && (
              <LifecycleOperationsPanel
                onNavigateToSection={(sectionId) => setActiveSection(sectionId)}
              />
            )}
            {activeSection === 'performance' && <PerformanceAnalyticsDashboard />}
            {activeSection === 'landscaper-list' && <LandscaperApprovalPanel />}
            {/* DEPRECATED: Job Pricing page removed — Operations handles all pricing */}

            {activeSection === 'jobs' && <AdminJobsPanel />}
            {activeSection === 'photos' && <AdminJobPhotoReview />}
            {activeSection === 'payouts' && <AdminPayoutQueue />}
            {activeSection === 'remediation' && <RemediationQueuePanel />}
            {activeSection === 'tiers' && <TierManagementPanel />}
            {activeSection === 'badges' && <BadgeManagementPanel />}
            {activeSection === 'goals' && <EarningsGoalsAnalytics />}
            {activeSection === 'performance-analytics' && <PerformanceAnalyticsDashboard />}
            {activeSection === 'service-areas' && <AdminServiceAreaManager />}
            {activeSection === 'geofences' && <GeofenceMonitoringDashboard />}
            {activeSection === 'waitlist' && <ExpansionWaitlistManager />}
            {activeSection === 'environment' && <EnvironmentVariablesDashboard />}
            {activeSection === 'health' && <SystemHealthMonitor />}
            {activeSection === 'test-users' && <TestUserManager />}
          </div>
        </main>

      </div>

      {/* ── Toast renderer for lifecycle awareness signals ── */}
      <Toaster />
    </div>
  );
}

export default AdminLayout;
