import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeJobExecution, invokeEdgeFunction } from '@/lib/edgeFunctionClient';
import { isPayoutEligible, PAYOUT_RELEASABLE_STATUSES } from '@/lib/jobLifecycleContract';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
  Save,
  FileText,
  Tag,
  Layers,
  Mail,
  Eye,
  CreditCard,
  Clock,
} from 'lucide-react';


/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const MINIMUM_PRICE_DOLLARS = 1.00;

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type ActiveFilter =
  | 'quotes_pending'
  | 'needs_landscaper'
  | 'active'
  | 'photo_approval'
  | 'awaiting_payout'
  | 'payouts_completed';

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
  admin_notes: string | null;
  payment_status: string | null;
  payment_amount_cents: number | null;
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
  selected_services: string[] | null;
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
   Filter config
───────────────────────────────────────────────────────────── */

const FILTER_CONFIG: Record<ActiveFilter, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}> = {
  quotes_pending:     { label: 'Quotes Pending',     shortLabel: 'Quotes',   color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   icon: DollarSign },
  needs_landscaper:   { label: 'Needs Landscaper',   shortLabel: 'Assign',   color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/30',    icon: UserPlus },
  active:             { label: 'Active Jobs',        shortLabel: 'Active',   color: 'text-purple-400',  bg: 'bg-purple-500/15',  border: 'border-purple-500/30',  icon: Play },
  photo_approval:     { label: 'Photo Approval',     shortLabel: 'Photos',   color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  icon: Camera },
  awaiting_payout:    { label: 'Awaiting Payout',    shortLabel: 'Payout',   color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: Wallet },
  payouts_completed:  { label: 'Payouts Completed',  shortLabel: 'Paid',     color: 'text-green-400',   bg: 'bg-green-500/15',   border: 'border-green-500/30',   icon: CheckCircle },
};

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{state.jobCustomer}</span>
            <Badge className={`text-[10px] px-2 py-0.5 ${current?.type === 'before' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {current?.type === 'before' ? 'Before' : 'After'}
            </Badge>
            <span className="text-gray-500 text-xs">{state.currentIndex + 1} of {state.photos.length}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="relative w-full flex items-center justify-center" style={{ maxHeight: '75vh' }}>
          {hasPrev && (
            <button onClick={() => onNavigate('prev')} className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <img src={current?.url} alt={current?.caption || `${current?.type} photo`} className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl" />
          {hasNext && (
            <button onClick={() => onNavigate('next')} className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        {current?.caption && <p className="text-gray-300 text-sm mt-3 text-center">{current.caption}</p>}
        {state.photos.length > 1 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 px-1">
            {state.photos.map((photo, idx) => (
              <button key={idx} onClick={() => onJumpTo(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === state.currentIndex ? 'border-orange-400 ring-1 ring-orange-400/50' : 'border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100'}`}>
                <img src={photo.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
  const { toast } = useToast();

  // ── Data state ──────────────────────────────────────────
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [landscaperProfiles, setLandscaperProfiles] = useState<Map<string, LandscaperProfile>>(new Map());
  const [jobPhotosMap, setJobPhotosMap] = useState<Map<string, JobPhoto[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
  const [photoActionLoading, setPhotoActionLoading] = useState<string | null>(null);

  // ── Interactive state ───────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('quotes_pending');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [saving, setSaving] = useState(false);
  const lastInitJobRef = useRef<string | null>(null);

  // ── Lightbox state ──────────────────────────────────────
  const [lightbox, setLightbox] = useState<LightboxState>({
    open: false, photos: [], currentIndex: 0, jobCustomer: '',
  });

  // ── Fetch all data ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: qr, error: qrErr } = await supabase
        .from('quote_requests')
        .select('id, name, email, phone, property_address, services, preferred_date, comments, status, created_at')
        .in('status', ['pending', 'contacted'])
        .order('created_at', { ascending: false });
      if (qrErr) throw qrErr;
      setQuoteRequests((qr || []) as QuoteRequest[]);

      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select(`
          id, service_type, service_name, service_address, status,
          price, admin_price, admin_notes, payment_status, payment_amount_cents,
          customer_name, client_email, selected_services,
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

      const landscaperIds = [...new Set(allJobs.map((j) => j.landscaper_id).filter(Boolean))] as string[];
      if (landscaperIds.length > 0) {
        const { data: lsData } = await supabase
          .from('landscapers')
          .select('id, user_id, first_name, last_name, email, business_name')
          .in('user_id', landscaperIds);
        const profileMap = new Map<string, LandscaperProfile>();
        for (const ls of lsData || []) {
          profileMap.set(ls.user_id, { user_id: ls.user_id, first_name: ls.first_name, last_name: ls.last_name, email: ls.email, business_name: ls.business_name });
        }
        setLandscaperProfiles(profileMap);
      }

      const reviewJobIds = allJobs
        .filter((j) => j.status === 'completed_pending_review' || j.status === 'flagged_review')
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Realtime subscription for jobs table ─────────────────
  // Auto-refreshes when any external process (webhook, other admin,
  // landscaper action) changes a job row.
  useEffect(() => {
    const channel = supabase
      .channel('ops-jobs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('[LifecycleOps] Realtime event:', payload.eventType, payload.new);
          // Re-fetch all data to keep counts and lists in sync.
          // We use a small debounce to avoid rapid-fire re-fetches when
          // multiple columns on the same row are updated in quick succession.
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('[LifecycleOps] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);



  // ── Clear selection when switching filters ───────────────
  useEffect(() => {
    setSelectedJob(null);
    setPriceInput('');
    setNotesInput('');
    lastInitJobRef.current = null;
  }, [activeFilter]);

  // ── Initialize form when selecting a job ────────────────
  useEffect(() => {
    const id = selectedJob?.id || null;
    if (id !== lastInitJobRef.current) {
      lastInitJobRef.current = id;
      if (selectedJob) {
        setPriceInput(selectedJob.price?.toString() || selectedJob.admin_price?.toString() || '');
        setNotesInput(selectedJob.admin_notes || '');
      } else {
        setPriceInput('');
        setNotesInput('');
      }
    }
  }, [selectedJob?.id]);

  /* ── Derived data ──────────────────────────────────────── */
  const pendingQuoteJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'quoted');
  const needsLandscaper = jobs.filter((j) => j.status === 'priced' || j.status === 'available' || j.status === 'scheduled');
  const activeJobs = jobs.filter((j) => j.status === 'assigned' || j.status === 'active');
  const photoApprovalQueue = jobs.filter((j) => j.status === 'completed_pending_review' || j.status === 'flagged_review');
  // "Awaiting Payout" = completed jobs whose payout has NOT been released yet.
  // ALIGNED WITH release-job-payout edge function:
  //   - status must be 'completed'
  //   - payout_status must be in PAYOUT_RELEASABLE_STATUSES ['pending', 'ready', 'ready_for_release']
  //   - payment_status must be 'paid'
  //   - payout_amount must be > 0
  // Show ALL completed jobs with non-terminal payout_status so admin can see what needs attention,
  // but only enable the Release button for fully eligible jobs.
  const readyForPayout = jobs.filter((j) =>
    j.status === 'completed'
    && j.payout_status != null
    && j.payout_status !== 'paid'
    && j.payout_status !== 'released'
  );
  const paidJobs = jobs.filter((j) => j.payout_status === 'paid' || j.payout_status === 'released');



  const filterCounts: Record<ActiveFilter, number> = {
    quotes_pending: quoteRequests.length + pendingQuoteJobs.length,
    needs_landscaper: needsLandscaper.length,
    active: activeJobs.length,
    photo_approval: photoApprovalQueue.length,
    awaiting_payout: readyForPayout.length,
    payouts_completed: paidJobs.length,
  };

  const getFilteredJobs = (): Job[] => {
    switch (activeFilter) {
      case 'quotes_pending': return pendingQuoteJobs;
      case 'needs_landscaper': return needsLandscaper;
      case 'active': return activeJobs;
      case 'photo_approval': return photoApprovalQueue;
      case 'awaiting_payout': return readyForPayout;
      case 'payouts_completed': return paidJobs;
      default: return [];
    }
  };

  // ── Helpers ─────────────────────────────────────────────
  const getLandscaperName = (landscaperId: string | null) => {
    if (!landscaperId) return '—';
    const profile = landscaperProfiles.get(landscaperId);
    if (!profile) return truncate(landscaperId, 12);
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return name || profile.email || truncate(landscaperId, 12);
  };

  const getAllPhotosForJob = (job: Job): { url: string; type: string; caption?: string | null }[] => {
    const photos: { url: string; type: string; caption?: string | null }[] = [];
    const tablePhotos = jobPhotosMap.get(job.id) || [];
    for (const p of tablePhotos) {
      if (p.file_url) photos.push({ url: p.file_url, type: p.type, caption: p.caption });
    }
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
    setLightbox({ open: true, photos, currentIndex: Math.min(startIndex, photos.length - 1), jobCustomer: job.customer_name || job.client_email || 'Unknown' });
  };

  // ── Action handlers ─────────────────────────────────────

  const handleJobSelect = (job: Job) => {
    setSelectedJob((prev) => prev?.id === job.id ? prev : job);
  };

  const handleSavePrice = async () => {
    if (!selectedJob) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0 || price < MINIMUM_PRICE_DOLLARS) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData.user?.id || null;

      const { data: updatedRows, error: jobError } = await supabase
        .from('jobs')
        .update({
          price,
          priced_at: new Date().toISOString(),
          priced_by: adminId,
          admin_notes: notesInput.trim() || null,
          status: 'priced',
        })
        .eq('id', selectedJob.id)
        .select('id, client_email, customer_name, service_name, service_type');

      if (jobError) throw jobError;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Price update was blocked by database security policy.');
      }

      await supabase
        .from('quotes')
        .update({ approved_amount: price, approved_at: new Date().toISOString(), status: 'approved', updated_at: new Date().toISOString() })
        .eq('job_id', selectedJob.id);

      // Send lifecycle email to client
      const pricedJob = updatedRows[0];
      if (pricedJob?.client_email) {
        try {
          await invokeEdgeFunction('unified-email', {
            type: 'admin_alert',
            to: pricedJob.client_email,
            data: {
              subject: 'Your GreenScape Lux quote is ready',
              title: 'Your Quote is Ready',
              message: `Hello ${pricedJob.customer_name || 'Valued Customer'},<br/><br/>Your service quote is ready.<br/><br/><strong>Service:</strong> ${pricedJob.service_name || pricedJob.service_type || 'Landscaping Service'}<br/><strong>Price:</strong> $${price.toFixed(2)}<br/><br/>Log in to confirm and schedule your service.`,
            },
          });
        } catch (emailErr: any) {
          console.error('Lifecycle email failed:', emailErr?.message);
        }
      }


      toast({ title: 'Price saved', description: `Job priced at $${price.toFixed(2)}. Client can now pay.` });
      setSelectedJob(null);
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Error saving price', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };
  // handleReleasePayout — calls release-job-payout edge function.
  // This creates a real Stripe transfer, updates payout_status → 'paid',
  // sets stripe_transfer_id, inserts into payouts ledger, and sends email.
  const handleReleasePayout = async (jobId: string) => {
    if (!user) return;
    setPayoutLoading(jobId);
    try {
      const { data, error: fnError } = await invokeEdgeFunction('release-job-payout', {
        jobId,
        adminUserId: user.id,
      });

      if (fnError) {
        throw new Error(fnError);
      }

      const amount = data?.amount ? `$${Number(data.amount).toFixed(2)}` : '';
      const transferId = data?.transferId ? ` (${data.transferId})` : '';
      toast({
        title: 'Payout released',
        description: `Payout${amount ? ' of ' + amount : ''} released successfully.${transferId}`,
      });
      setSelectedJob(null);
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Payout error', description: err.message, variant: 'destructive' });
    } finally {
      setPayoutLoading(null);
    }
  };

  // handlePhotoApproval — calls job-execution edge function with admin_approve / admin_reject.
  // Approve: sets status → 'completed', calculates payout_amount, sets payout_status.
  // Reject: sets status → 'active' (returns to landscaper), records rejection_reason.
  const handlePhotoApproval = async (jobId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    let rejectionReason: string | undefined;
    if (action === 'reject') {
      const reason = window.prompt('Rejection reason (required):');
      if (!reason || reason.trim().length === 0) return;
      rejectionReason = reason.trim();
    }
    setPhotoActionLoading(`${jobId}-${action}`);
    try {
      const edgeAction = action === 'approve' ? 'admin_approve' : 'admin_reject';
      const { data, error: fnError } = await invokeJobExecution({
        action: edgeAction,
        jobId,
        ...(rejectionReason ? { rejectionReason } : {}),
      });

      if (fnError) {
        throw new Error(fnError);
      }

      toast({
        title: action === 'approve' ? 'Photos approved' : 'Photos rejected',
        description: action === 'approve'
          ? `Job approved. Payout status: ${data?.job?.payout_status || 'set'}.`
          : `Job returned to landscaper for rework.`,
      });
      setSelectedJob(null);
      await fetchData();
    } catch (err: any) {
      toast({ title: `Photo ${action} error`, description: err.message, variant: 'destructive' });
    } finally {
      setPhotoActionLoading(null);
    }
  };




  // ── Loading / Error ─────────────────────────────────────
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
        <Button onClick={fetchData} variant="outline" className="border-emerald-500/30 text-emerald-300">Retry</Button>
      </div>
    );
  }

  const filteredJobs = getFilteredJobs();
  const fc = FILTER_CONFIG[activeFilter];

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4 sm:space-y-5 px-3 sm:px-4 lg:px-6 pb-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="text-sm sm:text-base font-semibold text-gray-200">Operations Control Center</h2>
        <Button variant="outline" size="sm" onClick={fetchData} className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* ── Quick Stats (clickable) ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(FILTER_CONFIG) as ActiveFilter[]).map((key) => {
          const cfg = FILTER_CONFIG[key];
          const count = filterCounts[key];
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`${cfg.bg} border rounded-xl p-3 sm:p-4 text-center h-full flex flex-col justify-center transition-all ${
                isActive
                  ? `${cfg.border} ring-2 ring-offset-1 ring-offset-gray-950 ring-current scale-[1.02]`
                  : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className={`text-xl sm:text-2xl font-bold ${cfg.color}`}>{count}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{cfg.shortLabel}</div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Pill Bar ─────────────────────────────── */}
      <div className="flex w-full items-center gap-2 overflow-x-auto pb-1">
        {(Object.keys(FILTER_CONFIG) as ActiveFilter[]).map((key) => {
          const cfg = FILTER_CONFIG[key];
          const count = filterCounts[key];
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ring-current`
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {cfg.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? cfg.bg : 'bg-gray-700/50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
         MAIN CONTENT: Job List + Action Panel
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── LEFT: Job List ──────────────────────────── */}
        <div className="lg:col-span-3">
          <Card className={`bg-black/40 backdrop-blur border ${activeFilter ? fc.border : 'border-gray-800'} w-full min-w-0`}>
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-gray-800/50">
              <div className={`w-7 h-7 rounded-lg ${fc.bg} flex items-center justify-center flex-shrink-0`}>
                {React.createElement(fc.icon, { className: `w-3.5 h-3.5 ${fc.color}` })}
              </div>
              <h3 className={`text-sm font-semibold ${fc.color} truncate`}>{fc.label}</h3>
              <Badge className={`${fc.bg} ${fc.color} text-xs px-2 py-0.5 flex-shrink-0`}>{filteredJobs.length}</Badge>
            </div>
            <CardContent className="px-3 sm:px-4 py-3">
              {/* Quote requests (only in quotes_pending filter) */}
              {activeFilter === 'quotes_pending' && quoteRequests.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 px-1">Quote Requests</p>
                  <div className="space-y-1.5">
                    {quoteRequests.map((qr) => (
                      <div key={qr.id} className="p-3 rounded-lg border border-amber-500/15 bg-black/30 text-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-white truncate">{qr.name}</span>
                          <Badge className="bg-amber-500/20 text-amber-300 text-[10px] flex-shrink-0">Quote</Badge>
                        </div>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{qr.property_address}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{qr.services?.join(', ') || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {pendingQuoteJobs.length > 0 && (
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-4 mb-2 px-1">Jobs Needing Price</p>
                  )}
                </div>
              )}

              {/* Job list */}
              {filteredJobs.length === 0 && (activeFilter !== 'quotes_pending' || quoteRequests.length === 0) ? (
                <div className="text-center py-10">
                  {React.createElement(fc.icon, { className: `w-10 h-10 ${fc.color} mx-auto mb-2 opacity-40` })}
                  <p className="text-gray-500 text-sm">No jobs in this category</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => handleJobSelect(job)}
                        className={`w-full text-left p-3 rounded-lg border transition-all min-w-0 ${
                          isSelected
                            ? `${fc.bg} ${fc.border} border-l-4`
                            : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-gray-200 truncate text-sm">
                                {job.service_name || job.service_type || 'Unnamed Service'}
                              </span>
                              {/* PART 1: "Pending Payment" label for priced + unpaid jobs */}
                              {job.status === 'priced' && job.payment_status !== 'paid' && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 flex-shrink-0 flex items-center gap-1">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  Pending Payment
                                </Badge>
                              )}
                            </div>

                            <span className="text-xs text-gray-500 block truncate">
                              {job.customer_name || job.client_email || '—'}
                            </span>
                            {job.service_address && (
                              <span className="text-xs text-gray-600 block truncate mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />{truncate(job.service_address, 40)}
                              </span>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {job.price != null && (
                                <span className="text-xs text-emerald-400 font-medium">{formatCurrency(job.price)}</span>
                              )}
                              {job.landscaper_id && (
                                <span className="text-xs text-purple-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />{getLandscaperName(job.landscaper_id)}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-600">{formatDate(job.created_at)}</span>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? fc.color : 'text-gray-600'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Action Panel ────────────────────── */}
        <div className="lg:col-span-2">
          <Card className={`bg-black/40 backdrop-blur border ${selectedJob ? fc.border : 'border-gray-800'} w-full min-w-0 sticky top-4`}>
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-gray-800/50">
              <div className={`w-7 h-7 rounded-lg ${selectedJob ? fc.bg : 'bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                {selectedJob
                  ? React.createElement(fc.icon, { className: `w-3.5 h-3.5 ${fc.color}` })
                  : <Eye className="w-3.5 h-3.5 text-gray-500" />
                }
              </div>
              <h3 className={`text-sm font-semibold truncate ${selectedJob ? fc.color : 'text-gray-500'}`}>
                {selectedJob ? (selectedJob.service_name || selectedJob.service_type || 'Job Details') : 'Select a Job'}
              </h3>
            </div>
            <CardContent className="px-3 sm:px-4 py-4 max-h-[700px] overflow-y-auto">
              {!selectedJob ? (
                <div className="text-center py-12">
                  <Eye className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Click a job from the list</p>
                  <p className="text-gray-600 text-xs mt-1">The action panel will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ── Job Details Card ──────────────── */}
                  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 space-y-2.5">
                    <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 pb-2 border-b border-gray-700/50">
                      <FileText className="w-3.5 h-3.5" /> Job Details
                    </h4>
                    <div className="flex items-start gap-2 text-sm">
                      <Tag className="w-3.5 h-3.5 text-blue-400/70 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-gray-500 text-[10px] block">Service</span>
                        <span className="text-gray-200 text-sm">{selectedJob.service_name || selectedJob.service_type || '—'}</span>
                      </div>
                    </div>
                    {selectedJob.selected_services && selectedJob.selected_services.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Layers className="w-3.5 h-3.5 text-purple-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block mb-1">Selected Services</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedJob.selected_services.map((s, i) => (
                              <Badge key={i} className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedJob.customer_name && (
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-gray-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block">Customer</span>
                          <span className="text-gray-200 text-sm">{selectedJob.customer_name}</span>
                        </div>
                      </div>
                    )}
                    {selectedJob.client_email && (
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="w-3.5 h-3.5 text-cyan-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block">Email</span>
                          <span className="text-gray-200 text-sm break-all">{selectedJob.client_email}</span>
                        </div>
                      </div>
                    )}
                    {selectedJob.service_address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-orange-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block">Address</span>
                          <span className="text-gray-200 text-sm">{selectedJob.service_address}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/70 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-gray-500 text-[10px] block">Created</span>
                        <span className="text-gray-200 text-sm">{formatDate(selectedJob.created_at)}</span>
                      </div>
                    </div>
                    {selectedJob.price != null && (
                      <div className="flex items-start gap-2 text-sm">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block">Current Price</span>
                          <span className="text-emerald-400 text-sm font-medium">{formatCurrency(selectedJob.price)}</span>
                        </div>
                      </div>
                    )}
                    {selectedJob.landscaper_id && (
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-purple-400/70 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] block">Landscaper</span>
                          <span className="text-purple-300 text-sm">{getLandscaperName(selectedJob.landscaper_id)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ═══ PRICING PANEL (quotes_pending) ═══ */}
                  {activeFilter === 'quotes_pending' && (
                    <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/30 space-y-3">
                      <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 pb-2 border-b border-amber-700/30">
                        <DollarSign className="w-4 h-4" />
                        Set Price
                        {selectedJob.price != null && selectedJob.price > 0 && (
                          <span className="text-xs text-gray-500 font-normal ml-auto">Current: {formatCurrency(selectedJob.price)}</span>
                        )}
                      </h4>
                      <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Price ($)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={priceInput}
                            onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setPriceInput(e.target.value); }}
                            placeholder="0.00"
                            className="bg-gray-800/50 border-gray-700 pl-9 text-lg font-medium"
                            autoComplete="off"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 italic">Starting price. Final may adjust after landscaper review.</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Admin Notes (optional)</label>
                        <Textarea
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="Notes about pricing decision..."
                          className="bg-gray-800/50 border-gray-700 min-h-[70px] text-sm resize-none"
                        />
                      </div>
                      {Number(priceInput) > 0 && Number(priceInput) < MINIMUM_PRICE_DOLLARS && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-xs text-red-300">Minimum price is ${MINIMUM_PRICE_DOLLARS.toFixed(2)}</span>
                        </div>
                      )}
                      <Button
                        onClick={handleSavePrice}
                        disabled={saving || !priceInput || Number(priceInput) <= 0 || Number(priceInput) < MINIMUM_PRICE_DOLLARS}
                        className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-base font-medium"
                      >
                        {saving ? <RefreshCw className="mr-2 w-4 h-4 animate-spin" /> : <Save className="mr-2 w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Price'}
                      </Button>
                    </div>
                  )}

                  {/* ═══ ASSIGNMENT PANEL (needs_landscaper) ═══ */}
                  {activeFilter === 'needs_landscaper' && (() => {
                    const isPendingPayment = selectedJob.status === 'priced' && selectedJob.payment_status !== 'paid';
                    return (
                    <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-700/30 space-y-3">
                      <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2 pb-2 border-b border-cyan-700/30">
                        <UserPlus className="w-4 h-4" />
                        Assign Landscaper
                      </h4>

                      {/* PART 1: Pending Payment blocker — shown when priced + unpaid */}
                      {isPendingPayment && (
                        <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-300">Pending Payment</p>
                            <p className="text-xs text-amber-200/70 mt-0.5">
                              Client has not yet paid for this job. Assignment is blocked until payment is confirmed.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Assignment dropdown — only useful when payment is confirmed */}
                      {!isPendingPayment && (
                        <>
                          <p className="text-xs text-gray-500">Select an approved landscaper to assign this job.</p>
                          <div onClick={(e) => e.stopPropagation()}>
                            <LandscaperAssignmentDropdown
                              jobId={selectedJob.id}
                              jobStatus={selectedJob.status}
                              paymentStatus={selectedJob.payment_status}
                              currentLandscaperId={selectedJob.landscaper_id}
                              onAssigned={() => { setSelectedJob(null); fetchData(); }}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled: {formatDate(selectedJob.scheduled_date || selectedJob.preferred_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <DollarSign className="w-3 h-3" />
                        <span>Price: {formatCurrency(selectedJob.admin_price || selectedJob.price)}</span>
                      </div>
                    </div>
                    );
                  })()}


                  {/* ═══ ACTIVE JOB TRACKING (active) ═══ */}
                  {activeFilter === 'active' && (
                    <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30 space-y-3">
                      <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2 pb-2 border-b border-purple-700/30">
                        <Play className="w-4 h-4" />
                        Job Tracking
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={`text-xs ${selectedJob.status === 'active' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-purple-500/20 text-purple-300'}`}>
                          {selectedJob.status === 'active' ? 'In Progress' : 'Assigned'}
                        </Badge>
                      </div>
                      {selectedJob.landscaper_id && (
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <User className="w-4 h-4" />
                          <span>{getLandscaperName(selectedJob.landscaper_id)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled: {formatDate(selectedJob.scheduled_date || selectedJob.preferred_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <DollarSign className="w-3 h-3" />
                        <span>Price: {formatCurrency(selectedJob.admin_price || selectedJob.price)}</span>
                      </div>
                    </div>
                  )}

                  {/* ═══ PHOTO APPROVAL (photo_approval) ═══ */}
                  {activeFilter === 'photo_approval' && (() => {
                    const photos = getAllPhotosForJob(selectedJob);
                    return (
                      <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-700/30 space-y-3">
                        <h4 className="text-sm font-semibold text-orange-400 flex items-center gap-2 pb-2 border-b border-orange-700/30">
                          <Camera className="w-4 h-4" />
                          Photo Review
                        </h4>
                        {selectedJob.landscaper_id && (
                          <div className="flex items-center gap-2 text-sm text-purple-300">
                            <User className="w-4 h-4" />
                            <span>{getLandscaperName(selectedJob.landscaper_id)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Completed: {formatDate(selectedJob.completed_at)}</span>
                        </div>

                        {/* Photo thumbnails */}
                        {photos.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {photos.map((photo, idx) => (
                              <button
                                key={idx}
                                onClick={() => openLightbox(selectedJob, idx)}
                                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-orange-500/20 hover:border-orange-400 transition-all group"
                              >
                                <img src={photo.url} alt={`${photo.type} photo`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-medium text-center py-0.5 ${photo.type === 'before' ? 'bg-blue-600/80 text-blue-100' : 'bg-emerald-600/80 text-emerald-100'}`}>
                                  {photo.type === 'before' ? 'Before' : 'After'}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs py-2">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>No photos uploaded</span>
                          </div>
                        )}

                        {/* Approve / Reject buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handlePhotoApproval(selectedJob.id, 'approve')}
                            disabled={photoActionLoading === `${selectedJob.id}-approve`}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm h-9"
                          >
                            {photoActionLoading === `${selectedJob.id}-approve`
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePhotoApproval(selectedJob.id, 'reject')}
                            disabled={photoActionLoading === `${selectedJob.id}-reject`}
                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm h-9"
                          >
                            {photoActionLoading === `${selectedJob.id}-reject`
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ═══ PAYOUT RELEASE (awaiting_payout) ═══ */}
                  {activeFilter === 'awaiting_payout' && (() => {
                    // Run the canonical eligibility check from lifecycle contract
                    const eligibility = isPayoutEligible({
                      status: selectedJob.status,
                      payment_status: selectedJob.payment_status,
                      payout_status: selectedJob.payout_status,
                      payout_amount: selectedJob.payout_amount,
                    });
                    const payoutStatusReleasable = (PAYOUT_RELEASABLE_STATUSES as readonly string[]).includes(selectedJob.payout_status || '');
                    const paymentConfirmed = selectedJob.payment_status === 'paid';
                    const hasPayoutAmount = (selectedJob.payout_amount ?? 0) > 0;

                    return (
                      <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 space-y-3">
                        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 pb-2 border-b border-emerald-700/30">
                          <Wallet className="w-4 h-4" />
                          Payout Status
                        </h4>
                        {selectedJob.landscaper_id && (
                          <div className="flex items-center gap-2 text-sm text-purple-300">
                            <User className="w-4 h-4" />
                            <span>{getLandscaperName(selectedJob.landscaper_id)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-emerald-400 text-lg font-bold">
                          <DollarSign className="w-5 h-5" />
                          <span>{formatCurrency(selectedJob.payout_amount)}</span>
                        </div>

                        {/* Eligibility checklist — shows each condition */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 text-xs">
                            {selectedJob.status === 'completed'
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            <span className={selectedJob.status === 'completed' ? 'text-gray-300' : 'text-red-300'}>
                              Job completed {selectedJob.status !== 'completed' && `(current: ${selectedJob.status})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {paymentConfirmed
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            <span className={paymentConfirmed ? 'text-gray-300' : 'text-red-300'}>
                              Client payment confirmed {!paymentConfirmed && `(current: ${selectedJob.payment_status || 'none'})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {payoutStatusReleasable
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            <span className={payoutStatusReleasable ? 'text-gray-300' : 'text-red-300'}>
                              Payout status releasable {!payoutStatusReleasable && `(current: ${selectedJob.payout_status || 'none'})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {hasPayoutAmount
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            <span className={hasPayoutAmount ? 'text-gray-300' : 'text-red-300'}>
                              Payout amount set {!hasPayoutAmount && '($0)'}
                            </span>
                          </div>
                        </div>

                        {/* Blocking reason banner */}
                        {!eligibility.eligible && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-red-300">{eligibility.reason}</span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleReleasePayout(selectedJob.id)}
                          disabled={payoutLoading === selectedJob.id || !eligibility.eligible}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {payoutLoading === selectedJob.id
                            ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            : <DollarSign className="w-4 h-4 mr-2" />}
                          {payoutLoading === selectedJob.id
                            ? 'Processing...'
                            : eligibility.eligible
                              ? 'Release Payout'
                              : 'Not Eligible'}
                        </Button>
                      </div>
                    );
                  })()}


                  {/* ═══ PAYOUT COMPLETED (payouts_completed) ═══ */}
                  {activeFilter === 'payouts_completed' && (
                    <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/30 space-y-3">
                      <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2 pb-2 border-b border-green-700/30">
                        <CheckCircle className="w-4 h-4" />
                        Payout Completed
                      </h4>
                      {selectedJob.landscaper_id && (
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <User className="w-4 h-4" />
                          <span>{getLandscaperName(selectedJob.landscaper_id)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-green-400 text-lg font-bold">
                        <DollarSign className="w-5 h-5" />
                        <span>{formatCurrency(selectedJob.payout_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Released: {formatDate(selectedJob.payout_released_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Photo Lightbox Modal ─────────────────────────── */}
      <PhotoLightbox
        state={lightbox}
        onClose={() => setLightbox((p) => ({ ...p, open: false }))}
        onNavigate={(dir) => setLightbox((p) => ({ ...p, currentIndex: dir === 'next' ? Math.min(p.currentIndex + 1, p.photos.length - 1) : Math.max(p.currentIndex - 1, 0) }))}
        onJumpTo={(idx) => setLightbox((p) => ({ ...p, currentIndex: Math.max(0, Math.min(idx, p.photos.length - 1)) }))}
      />
    </div>
  );
}

export default LifecycleOperationsPanel;
