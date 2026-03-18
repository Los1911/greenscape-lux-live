import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandscaperAssignmentDropdown } from '@/components/admin/LandscaperAssignmentDropdown';
import {
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Wallet,
  UserPlus,
  Play,
  Camera,
  XCircle,
  Image as ImageIcon,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string;
  services: string[];
  preferred_date: string | null;
  comments: string | null;
  status: string;
  created_at: string;
}

interface Job {
  id: string;
  service_type: string | null;
  service_name: string | null;
  service_address: string | null;
  status: string | null;
  price: number | null;
  admin_price: number | null;
  customer_name: string | null;
  client_email: string | null;
  landscaper_id: string | null;
  scheduled_date: string | null;
  preferred_date: string | null;
  completed_at: string | null;
  payout_status: string | null;
  payout_amount: number | null;
  payout_released_at: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  created_at: string;
}

interface JobPhoto {
  id: string;
  job_id: string;
  file_url: string;
  type: 'before' | 'after';
  caption: string | null;
  uploaded_at: string | null;
  sort_order: number | null;
}

interface LandscaperProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  business_name: string | null;
}

interface LightboxState {
  open: boolean;
  photos: { url: string; type: string; caption?: string | null }[];
  currentIndex: number;
  jobCustomer: string;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

const formatCurrency = (v: number | null | undefined) => {
  if (v == null) return '—';
  return `$${v.toFixed(2)}`;
};

const truncate = (s: string | null | undefined, max = 30) => {
  if (!s) return '—';
  return s.length > max ? s.slice(0, max) + '…' : s;
};

/* ─────────────────────────────────────────────────────────────
   Section Wrapper (collapsible card)
───────────────────────────────────────────────────────────── */

function LifecycleSection({
  title,
  icon: Icon,
  count,
  color,
  bgColor,
  borderColor,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={`bg-black/40 backdrop-blur border ${borderColor} w-full min-w-0`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <h3 className={`text-sm sm:text-base font-semibold ${color} truncate`}>{title}</h3>
          <Badge className={`${bgColor} ${color} text-xs px-2 py-0.5 flex-shrink-0`}>
            {count}
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <CardContent className="px-3 sm:px-5 pb-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Empty State
───────────────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-8">
      <Icon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Photo Lightbox Modal
───────────────────────────────────────────────────────────── */

function PhotoLightbox({
  state,
  onClose,
  onNavigate,
  onJumpTo,
}: {
  state: LightboxState;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onJumpTo: (index: number) => void;
}) {
  if (!state.open || state.photos.length === 0) return null;

  const current = state.photos[state.currentIndex];
  const hasPrev = state.currentIndex > 0;
  const hasNext = state.currentIndex < state.photos.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{state.jobCustomer}</span>
            <Badge className={`text-[10px] px-2 py-0.5 ${
              current?.type === 'before'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {current?.type === 'before' ? 'Before' : 'After'}
            </Badge>
            <span className="text-gray-500 text-xs">
              {state.currentIndex + 1} of {state.photos.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Image */}
        <div className="relative w-full flex items-center justify-center" style={{ maxHeight: '75vh' }}>
          {hasPrev && (
            <button
              onClick={() => onNavigate('prev')}
              className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          <img
            src={current?.url}
            alt={current?.caption || `${current?.type} photo`}
            className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).alt = 'Failed to load image';
              (e.target as HTMLImageElement).className = 'hidden';
            }}
          />

          {hasNext && (
            <button
              onClick={() => onNavigate('next')}
              className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Caption */}
        {current?.caption && (
          <p className="text-gray-300 text-sm mt-3 text-center">{current.caption}</p>
        )}

        {/* Thumbnail strip */}
        {state.photos.length > 1 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 px-1">
            {state.photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => onJumpTo(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === state.currentIndex
                    ? 'border-orange-400 ring-1 ring-orange-400/50'
                    : 'border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */

export function LifecycleOperationsPanel({
  onNavigateToSection,
}: {
  onNavigateToSection?: (sectionId: string) => void;
}) {
  const { user } = useAuth();

  // ── Data state ──────────────────────────────────────────
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [landscaperProfiles, setLandscaperProfiles] = useState<Map<string, LandscaperProfile>>(new Map());
  const [jobPhotosMap, setJobPhotosMap] = useState<Map<string, JobPhoto[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
  const [photoActionLoading, setPhotoActionLoading] = useState<string | null>(null);

  // ── Lightbox state ──────────────────────────────────────
  const [lightbox, setLightbox] = useState<LightboxState>({
    open: false,
    photos: [],
    currentIndex: 0,
    jobCustomer: '',
  });

  // ── Fetch all data ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Quote requests (pending only)
      const { data: qr, error: qrErr } = await supabase
        .from('quote_requests')
        .select('id, name, email, phone, property_address, services, preferred_date, comments, status, created_at')
        .in('status', ['pending', 'contacted'])
        .order('created_at', { ascending: false });

      if (qrErr) throw qrErr;
      setQuoteRequests((qr || []) as QuoteRequest[]);

      // 2. Jobs (all non-cancelled) — now includes photo URL columns
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select(`
          id, service_type, service_name, service_address, status,
          price, admin_price, customer_name, client_email,
          landscaper_id, scheduled_date, preferred_date,
          completed_at, payout_status, payout_amount,
          payout_released_at, before_photo_url, after_photo_url,
          created_at
        `)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (jobsErr) throw jobsErr;
      const allJobs = (jobsData || []) as Job[];
      setJobs(allJobs);

      // 3. Fetch landscaper profiles for jobs that have landscaper_id
      const landscaperIds = [...new Set(allJobs.map((j) => j.landscaper_id).filter(Boolean))] as string[];
      if (landscaperIds.length > 0) {
        const { data: lsData } = await supabase
          .from('landscapers')
          .select('id, user_id, first_name, last_name, email, business_name')
          .in('user_id', landscaperIds);

        const profileMap = new Map<string, LandscaperProfile>();
        for (const ls of lsData || []) {
          profileMap.set(ls.user_id, {
            user_id: ls.user_id,
            first_name: ls.first_name,
            last_name: ls.last_name,
            email: ls.email,
            business_name: ls.business_name,
          });
        }
        setLandscaperProfiles(profileMap);
      }

      // 4. Fetch job_photos for completed_pending_review jobs
      const reviewJobIds = allJobs
        .filter((j) => j.status === 'completed_pending_review')
        .map((j) => j.id);

      if (reviewJobIds.length > 0) {
        const { data: photosData } = await supabase
          .from('job_photos')
          .select('id, job_id, file_url, type, caption, uploaded_at, sort_order')
          .in('job_id', reviewJobIds)
          .order('sort_order', { ascending: true });

        const photoMap = new Map<string, JobPhoto[]>();
        for (const photo of (photosData || []) as JobPhoto[]) {
          const existing = photoMap.get(photo.job_id) || [];
          existing.push(photo);
          photoMap.set(photo.job_id, existing);
        }
        setJobPhotosMap(photoMap);
      } else {
        setJobPhotosMap(new Map());
      }
    } catch (err: any) {
      console.error('[LifecycleOps] Fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived data ────────────────────────────────────────
  const needsLandscaper = jobs.filter(
    (j) => j.status === 'scheduled' && !j.landscaper_id
  );
  const activeJobs = jobs.filter(
    (j) => j.status === 'scheduled' && !!j.landscaper_id
  );
  const photoApprovalQueue = jobs.filter(
    (j) => j.status === 'completed_pending_review'
  );
  const readyForPayout = jobs.filter(
    (j) => j.status === 'completed' && j.payout_status === 'ready_for_release'
  );
  const paidJobs = jobs.filter((j) => j.payout_status === 'paid');

  // ── Photo helpers ───────────────────────────────────────
  const getAllPhotosForJob = (job: Job): { url: string; type: string; caption?: string | null }[] => {
    const photos: { url: string; type: string; caption?: string | null }[] = [];

    // First: photos from job_photos table (multi-photo support)
    const tablePhotos = jobPhotosMap.get(job.id) || [];
    for (const p of tablePhotos) {
      if (p.file_url) {
        photos.push({ url: p.file_url, type: p.type, caption: p.caption });
      }
    }

    // Second: inline photo URLs from jobs table (fallback / legacy)
    if (job.before_photo_url && !photos.some((p) => p.url === job.before_photo_url)) {
      photos.push({ url: job.before_photo_url, type: 'before', caption: null });
    }
    if (job.after_photo_url && !photos.some((p) => p.url === job.after_photo_url)) {
      photos.push({ url: job.after_photo_url, type: 'after', caption: null });
    }

    return photos;
  };

  const openLightbox = (job: Job, startIndex = 0) => {
    const photos = getAllPhotosForJob(job);
    if (photos.length === 0) return;
    setLightbox({
      open: true,
      photos,
      currentIndex: Math.min(startIndex, photos.length - 1),
      jobCustomer: job.customer_name || job.client_email || 'Unknown',
    });
  };

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex:
        direction === 'next'
          ? Math.min(prev.currentIndex + 1, prev.photos.length - 1)
          : Math.max(prev.currentIndex - 1, 0),
    }));
  };

  const handleLightboxJumpTo = (index: number) => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.photos.length - 1)),
    }));
  };


  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, open: false }));
  };

  // ── Landscaper name helper ──────────────────────────────
  const getLandscaperName = (landscaperId: string | null) => {
    if (!landscaperId) return '—';
    const profile = landscaperProfiles.get(landscaperId);
    if (!profile) return truncate(landscaperId, 12);
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return name || profile.email || truncate(landscaperId, 12);
  };

  // ── Payout release handler ──────────────────────────────
  const handleReleasePayout = async (jobId: string) => {
    if (!user) return;
    setPayoutLoading(jobId);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('release-job-payout', {
        body: { jobId, adminUserId: user.id },
      });
      if (fnErr) throw fnErr;
      if (data && !data.success) throw new Error(data.error || 'Payout release failed');
      console.log(`[LifecycleOps] Payout released for job ${jobId}`);
      await fetchData();
    } catch (err: any) {
      console.error('[LifecycleOps] Payout error:', err);
      alert(err.message || 'Failed to release payout');
    } finally {
      setPayoutLoading(null);
    }
  };

  // ── Photo approval handler ──────────────────────────────
  const handlePhotoApproval = async (jobId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    setPhotoActionLoading(`${jobId}-${action}`);
    try {
      const newStatus = action === 'approve' ? 'completed' : 'scheduled';
      const updatePayload: Record<string, unknown> = { status: newStatus };

      if (action === 'approve') {
        updatePayload.payout_status = 'ready_for_release';
      }

      const { error: updateErr } = await supabase
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId);

      if (updateErr) throw updateErr;
      console.log(`[LifecycleOps] Photo ${action}d for job ${jobId} → status: ${newStatus}`);
      await fetchData();
    } catch (err: any) {
      console.error(`[LifecycleOps] Photo ${action} error:`, err);
      alert(err.message || `Failed to ${action} photos`);
    } finally {
      setPhotoActionLoading(null);
    }
  };

  // ── Loading / Error states ──────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading operations…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-emerald-500/30 text-emerald-300">
          Retry
        </Button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4 sm:space-y-5 px-3 sm:px-4 lg:px-6 pb-8">
      {/* ── Summary Bar ─────────────────────────────────── */}
      {/* ── Summary Bar (hidden on mobile — stat cards provide navigation) */}
      <div className="hidden md:flex items-center justify-between gap-3 pt-2">
        <h2 className="text-sm sm:text-base font-semibold text-gray-200">
          Operations Control Center
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ── Quick Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Quotes Pending', count: quoteRequests.length, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          { label: 'Needs Landscaper', count: needsLandscaper.length, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
          { label: 'Active Jobs', count: activeJobs.length, color: 'text-purple-400', bg: 'bg-purple-500/15' },
          { label: 'Photo Approval', count: photoApprovalQueue.length, color: 'text-orange-400', bg: 'bg-orange-500/15' },
          { label: 'Awaiting Payout', count: readyForPayout.length, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Payouts Completed', count: paidJobs.length, color: 'text-green-400', bg: 'bg-green-500/15' },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border border-gray-800 rounded-xl p-3 sm:p-4 text-center h-full flex flex-col justify-center`}
          >
            <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Lifecycle Status Pill Bar ──────────────────────────────────────
           HIDDEN on mobile (<768px) via `hidden md:flex`.
           Visible on tablet/desktop only. Stat cards above already serve
           as the mobile-friendly lifecycle summary.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-full items-center gap-2 overflow-x-auto">
        {[
          { label: 'Quotes Pending', count: quoteRequests.length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25' },
          { label: 'Needs Landscaper', count: needsLandscaper.length, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25' },
          { label: 'Active', count: activeJobs.length, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
          { label: 'Pending Review', count: photoApprovalQueue.length, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
          { label: 'Ready for Payout', count: readyForPayout.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
          { label: 'Completed', count: paidJobs.length, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25' },
        ].map((item) => (
          <span
            key={item.label}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${item.bg} ${item.border} ${item.color}`}
          >
            {item.label}
            <span className={`${item.bg} px-1.5 py-0.5 rounded-md text-[10px] font-bold`}>
              {item.count}
            </span>
          </span>
        ))}
      </div>




      {/* ═══════════════════════════════════════════════════
         SECTION 1 — Quote Pricing Queue
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Quote Pricing Queue"
        icon={DollarSign}
        count={quoteRequests.length}
        color="text-amber-400"
        bgColor="bg-amber-500/15"
        borderColor="border-amber-500/20"
      >
        {quoteRequests.length === 0 ? (
          <EmptyState icon={DollarSign} message="No pending quotes — all caught up" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {quoteRequests.map((qr) => (
                <div
                  key={qr.id}
                  className="p-3 rounded-lg border border-amber-500/15 bg-black/30 hover:bg-amber-500/5 transition-colors cursor-pointer"
                  onClick={() => onNavigateToSection?.('pricing')}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-white text-sm truncate">{qr.name}</span>
                    <Badge className="bg-amber-500/20 text-amber-300 text-[10px] flex-shrink-0">Pending</Badge>
                  </div>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {qr.property_address}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {qr.services?.join(', ') || '—'}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{formatDate(qr.preferred_date)}</span>
                    <span>{formatDate(qr.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-amber-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-amber-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Address</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Preferred Date</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Notes</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteRequests.map((qr) => (
                      <tr
                        key={qr.id}
                        className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <div className="min-w-0">
                            <span className="text-white text-sm font-medium block truncate">{qr.name}</span>
                            <span className="text-gray-500 text-xs block truncate">{qr.email}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm max-w-[200px] truncate">
                          {truncate(qr.property_address, 35)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm max-w-[180px] truncate">
                          {qr.services?.join(', ') || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 text-sm">
                          {formatDate(qr.preferred_date)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 text-xs max-w-[160px] truncate">
                          {qr.comments || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => onNavigateToSection?.('pricing')}
                            className="bg-amber-600 hover:bg-amber-700 text-xs h-7 px-3"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Price
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ═══════════════════════════════════════════════════
         SECTION 2 — Needs Landscaper
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Needs Landscaper"
        icon={UserPlus}
        count={needsLandscaper.length}
        color="text-cyan-400"
        bgColor="bg-cyan-500/15"
        borderColor="border-cyan-500/20"
      >
        {needsLandscaper.length === 0 ? (
          <EmptyState icon={UserPlus} message="All scheduled jobs have landscapers assigned" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {needsLandscaper.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border border-cyan-500/15 bg-black/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-white text-sm truncate">
                      {job.customer_name || job.client_email || 'Unknown'}
                    </span>
                    <span className="text-emerald-400 text-xs font-medium flex-shrink-0">
                      {formatCurrency(job.admin_price || job.price)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {job.service_address || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {job.service_name || job.service_type || '—'}
                  </p>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(job.scheduled_date || job.preferred_date)}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-cyan-500/15" onClick={(e) => e.stopPropagation()}>
                    <LandscaperAssignmentDropdown
                      jobId={job.id}
                      jobStatus={job.status}
                      currentLandscaperId={job.landscaper_id}
                      onAssigned={fetchData}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-cyan-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-cyan-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Address</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Scheduled</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Price</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400" style={{ minWidth: '220px' }}>
                        Assign Landscaper
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {needsLandscaper.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <span className="text-white text-sm font-medium block truncate max-w-[160px]">
                            {job.customer_name || job.client_email || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm max-w-[200px] truncate">
                          {truncate(job.service_address, 35)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm truncate max-w-[160px]">
                          {job.service_name || job.service_type || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 text-sm">
                          {formatDate(job.scheduled_date || job.preferred_date)}
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400 text-sm font-medium">
                          {formatCurrency(job.admin_price || job.price)}
                        </td>
                        <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <LandscaperAssignmentDropdown
                            jobId={job.id}
                            jobStatus={job.status}
                            currentLandscaperId={job.landscaper_id}
                            onAssigned={fetchData}
                            compact
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ═══════════════════════════════════════════════════
         SECTION 3 — Active Jobs
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Active Jobs"
        icon={Play}
        count={activeJobs.length}
        color="text-purple-400"
        bgColor="bg-purple-500/15"
        borderColor="border-purple-500/20"
      >
        {activeJobs.length === 0 ? (
          <EmptyState icon={Play} message="No active jobs at this time" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border border-purple-500/15 bg-black/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-white text-sm truncate">
                      {job.customer_name || job.client_email || 'Unknown'}
                    </span>
                    <Badge className="bg-purple-500/20 text-purple-300 text-[10px] flex-shrink-0">Active</Badge>
                  </div>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {job.service_address || '—'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-purple-300 mt-1">
                    <User className="w-3 h-3" />
                    {getLandscaperName(job.landscaper_id)}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(job.scheduled_date || job.preferred_date)}
                    </span>
                    <span>{job.service_name || job.service_type || '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-purple-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-purple-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Address</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Landscaper</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Scheduled</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <span className="text-white text-sm font-medium block truncate max-w-[160px]">
                            {job.customer_name || job.client_email || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm max-w-[200px] truncate">
                          {truncate(job.service_address, 35)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-purple-300 text-sm block truncate max-w-[160px]">
                            {getLandscaperName(job.landscaper_id)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 text-sm">
                          {formatDate(job.scheduled_date || job.preferred_date)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm truncate max-w-[160px]">
                          {job.service_name || job.service_type || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ═══════════════════════════════════════════════════
         SECTION 4 — Photo Approval (with photo thumbnails)
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Photo Approval"
        icon={Camera}
        count={photoApprovalQueue.length}
        color="text-orange-400"
        bgColor="bg-orange-500/15"
        borderColor="border-orange-500/20"
        defaultOpen={false}
      >
        {photoApprovalQueue.length === 0 ? (
          <EmptyState icon={Camera} message="No jobs pending photo review" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {photoApprovalQueue.map((job) => {
                const photos = getAllPhotosForJob(job);
                return (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg border border-orange-500/15 bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-medium text-white text-sm truncate">
                        {job.customer_name || job.client_email || 'Unknown'}
                      </span>
                      <Badge className="bg-orange-500/20 text-orange-300 text-[10px] flex-shrink-0">Review</Badge>
                    </div>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {job.service_address || '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {job.service_name || job.service_type || '—'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-purple-300 mt-1">
                      <User className="w-3 h-3" />
                      {getLandscaperName(job.landscaper_id)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      Completed: {formatDate(job.completed_at)}
                    </div>

                    {/* Photo thumbnails — mobile */}
                    <div className="mt-2.5 pt-2 border-t border-orange-500/10">
                      {photos.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {photos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => openLightbox(job, idx)}
                              className="relative flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden border border-orange-500/20 hover:border-orange-400 transition-all group"
                            >
                              <img
                                src={photo.url}
                                alt={`${photo.type} photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-medium text-center py-0.5 ${
                                photo.type === 'before' ? 'bg-blue-600/80 text-blue-100' : 'bg-emerald-600/80 text-emerald-100'
                              }`}>
                                {photo.type === 'before' ? 'Before' : 'After'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs py-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>No photos uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons — mobile */}
                    <div className="mt-2.5 pt-2 border-t border-orange-500/15 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePhotoApproval(job.id, 'approve')}
                        disabled={photoActionLoading === `${job.id}-approve`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                      >
                        {photoActionLoading === `${job.id}-approve` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhotoApproval(job.id, 'reject')}
                        disabled={photoActionLoading === `${job.id}-reject`}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8"
                      >
                        {photoActionLoading === `${job.id}-reject` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-orange-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-orange-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Address</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Landscaper</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Photos</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Completed At</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {photoApprovalQueue.map((job) => {
                      const photos = getAllPhotosForJob(job);
                      return (
                        <tr
                          key={job.id}
                          className="border-b border-orange-500/10 hover:bg-orange-500/5 transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <span className="text-white text-sm font-medium block truncate max-w-[140px]">
                              {job.customer_name || job.client_email || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 text-sm max-w-[160px] truncate">
                            {truncate(job.service_address, 28)}
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 text-sm truncate max-w-[120px]">
                            {job.service_name || job.service_type || '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-purple-300 text-sm block truncate max-w-[120px]">
                              {getLandscaperName(job.landscaper_id)}
                            </span>
                          </td>
                          {/* Photos column */}
                          <td className="py-2.5 px-4">
                            {photos.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                {photos.slice(0, 4).map((photo, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => openLightbox(job, idx)}
                                    className="relative flex-shrink-0 w-[52px] h-[52px] rounded-md overflow-hidden border border-orange-500/20 hover:border-orange-400 hover:ring-1 hover:ring-orange-400/40 transition-all group cursor-pointer"
                                    title={`${photo.type} photo — click to enlarge`}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`${photo.type} photo`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('.fallback-icon')) {
                                          const fallback = document.createElement('div');
                                          fallback.className = 'fallback-icon w-full h-full flex items-center justify-center bg-gray-800';
                                          fallback.innerHTML = '<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <ZoomIn className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className={`absolute bottom-0 left-0 right-0 text-[8px] font-semibold text-center leading-tight py-px ${
                                      photo.type === 'before' ? 'bg-blue-600/80 text-blue-100' : 'bg-emerald-600/80 text-emerald-100'
                                    }`}>
                                      {photo.type === 'before' ? 'Before' : 'After'}
                                    </span>
                                  </button>
                                ))}
                                {photos.length > 4 && (
                                  <button
                                    onClick={() => openLightbox(job, 4)}
                                    className="flex-shrink-0 w-[52px] h-[52px] rounded-md border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 transition-colors flex items-center justify-center cursor-pointer"
                                  >
                                    <span className="text-orange-300 text-xs font-bold">+{photos.length - 4}</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>No photos uploaded</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-gray-400 text-sm">
                            {formatDate(job.completed_at)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePhotoApproval(job.id, 'approve')}
                                disabled={photoActionLoading === `${job.id}-approve`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-3"
                              >
                                {photoActionLoading === `${job.id}-approve` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePhotoApproval(job.id, 'reject')}
                                disabled={photoActionLoading === `${job.id}-reject`}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7 px-3"
                              >
                                {photoActionLoading === `${job.id}-reject` ? (
                                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ═══════════════════════════════════════════════════
         SECTION 5 — Ready for Payout
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Completed — Awaiting Payout"
        icon={Wallet}
        count={readyForPayout.length}
        color="text-emerald-400"
        bgColor="bg-emerald-500/15"
        borderColor="border-emerald-500/20"
      >
        {readyForPayout.length === 0 ? (
          <EmptyState icon={Wallet} message="No jobs awaiting payout release" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {readyForPayout.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border border-emerald-500/15 bg-black/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-white text-sm truncate">
                      {job.customer_name || job.client_email || 'Unknown'}
                    </span>
                    <span className="text-emerald-400 text-sm font-bold flex-shrink-0">
                      {formatCurrency(job.payout_amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-purple-300 mt-1">
                    <User className="w-3 h-3" />
                    {getLandscaperName(job.landscaper_id)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {job.service_name || job.service_type || '—'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-emerald-500/15">
                    <Button
                      size="sm"
                      onClick={() => handleReleasePayout(job.id)}
                      disabled={payoutLoading === job.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                    >
                      {payoutLoading === job.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Release Payout
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-emerald-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-emerald-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Landscaper</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Payout Amount</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyForPayout.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <span className="text-white text-sm font-medium block truncate max-w-[160px]">
                            {job.customer_name || job.client_email || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-purple-300 text-sm block truncate max-w-[160px]">
                            {getLandscaperName(job.landscaper_id)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm truncate max-w-[160px]">
                          {job.service_name || job.service_type || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400 text-sm font-bold">
                          {formatCurrency(job.payout_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayout(job.id)}
                            disabled={payoutLoading === job.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-3"
                          >
                            {payoutLoading === job.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <DollarSign className="w-3 h-3 mr-1" />
                            )}
                            Release
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ═══════════════════════════════════════════════════
         SECTION 6 — Paid Jobs
      ═══════════════════════════════════════════════════ */}
      <LifecycleSection
        title="Payouts Completed"
        icon={CheckCircle}
        count={paidJobs.length}
        color="text-green-400"
        bgColor="bg-green-500/15"
        borderColor="border-green-500/20"
        defaultOpen={false}
      >
        {paidJobs.length === 0 ? (
          <EmptyState icon={CheckCircle} message="No completed payouts yet" />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {paidJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border border-green-500/15 bg-black/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-white text-sm truncate">
                      {job.customer_name || job.client_email || 'Unknown'}
                    </span>
                    <span className="text-green-400 text-sm font-bold flex-shrink-0">
                      {formatCurrency(job.payout_amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-purple-300 mt-1">
                    <User className="w-3 h-3" />
                    {getLandscaperName(job.landscaper_id)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {job.service_name || job.service_type || '—'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    Paid: {formatDate(job.payout_released_at)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-visible rounded-xl border border-green-500/15">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/60 border-b border-green-500/15">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Landscaper</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Service</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Payout Amount</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-400">Released</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <span className="text-white text-sm font-medium block truncate max-w-[160px]">
                            {job.customer_name || job.client_email || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-purple-300 text-sm block truncate max-w-[160px]">
                            {getLandscaperName(job.landscaper_id)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-300 text-sm truncate max-w-[160px]">
                          {job.service_name || job.service_type || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-green-400 text-sm font-bold">
                          {formatCurrency(job.payout_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 text-sm">
                          {formatDate(job.payout_released_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </LifecycleSection>

      {/* ── Photo Lightbox Modal ─────────────────────────── */}
      <PhotoLightbox
        state={lightbox}
        onClose={closeLightbox}
        onNavigate={handleLightboxNavigate}
        onJumpTo={handleLightboxJumpTo}
      />

    </div>
  );
}

export default LifecycleOperationsPanel;
