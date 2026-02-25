import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  RotateCcw,
  Flag,
  X,
  User,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  Loader2,
  ImageIcon,
  ZoomIn,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { JobPhoto } from '@/types/jobPhoto';
import { groupPhotosByType } from '@/types/jobPhoto';

/* ── Types ─────────────────────────────────────────────────────────── */

interface ReviewJob {
  id: string;
  customer_name?: string;

  assigned_to?: string | null;
  landscaper_id?: string | null;

  landscaper_email?: string | null;

  service_name?: string;
  service_type?: string;
  price?: number | null;
  completed_at?: string | null;
  status: string;

  /** Relational photos from job_photos table */
  photos?: JobPhoto[];
}

interface CompletionReviewPanelProps {
  job: ReviewJob;
  onClose: () => void;
  onActionComplete?: (jobId: string, newStatus: string) => void;
}

/* ── Photo Modal ───────────────────────────────────────────────────── */

function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-black/80 border border-gray-600 rounded-full p-1.5 text-gray-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <img src={url} alt="Job photo" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
      </div>
    </div>
  );
}

/* ── Photo Gallery Strip ───────────────────────────────────────────── */

function PhotoGalleryStrip({
  photos,
  label,
  accentColor,
  onPreview,
  warningIfEmpty,
}: {
  photos: JobPhoto[];
  label: string;
  accentColor: string;
  onPreview: (url: string) => void;
  warningIfEmpty?: string;
}) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const visibleCount = 3;

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center bg-black/30 text-gray-500">
          <ImageIcon className="w-8 h-8 mb-1" />
          <span className="text-xs">No {label}</span>
        </div>
        {warningIfEmpty && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {warningIfEmpty}
          </Badge>
        )}
      </div>
    );
  }

  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex + visibleCount < photos.length;
  const visiblePhotos = photos.slice(scrollIndex, scrollIndex + visibleCount);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <Camera className={`w-3.5 h-3.5 text-${accentColor}-400`} />
          {label}
          <Badge
            variant="outline"
            className={`text-${accentColor}-300 border-${accentColor}-500/30 text-[10px] px-1.5 py-0`}
          >
            {photos.length}
          </Badge>
        </span>

        {photos.length > visibleCount && (
          <div className="flex gap-1">
            <button
              onClick={() => setScrollIndex(i => Math.max(0, i - 1))}
              disabled={!canScrollLeft}
              className="p-0.5 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScrollIndex(i => Math.min(photos.length - visibleCount, i + 1))}
              disabled={!canScrollRight}
              className="p-0.5 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(visiblePhotos.length, visibleCount)}, 1fr)` }}
      >
        {visiblePhotos.map(photo => (
          <div
            key={photo.id}
            className={`relative aspect-video rounded-lg overflow-hidden border border-${accentColor}-500/20 cursor-pointer group`}
            onClick={() => onPreview(photo.file_url)}
          >
            <img
              src={photo.file_url}
              alt={`${photo.type} photo`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-gray-300">
              {new Date(photo.uploaded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function CompletionReviewPanel({ job, onClose, onActionComplete }: CompletionReviewPanelProps) {
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [landscaperDisplay, setLandscaperDisplay] = useState<string>('Unassigned');
  const [landscaperLoading, setLandscaperLoading] = useState(false);

  /* ── Derive before/after from relational photos ──────────────────── */

  const photoGroup = useMemo(() => {
    return groupPhotosByType(job.photos || []);
  }, [job.photos]);

  const beforePhotos = photoGroup.before;
  const afterPhotos = photoGroup.after;
  const hasAfterPhoto = afterPhotos.length > 0;
  const photosLoaded = job.photos !== undefined;

  /* ── Resolve landscaper display ──────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (job.landscaper_email) {
        setLandscaperDisplay(job.landscaper_email);
        return;
      }

      const landscaperId = job.landscaper_id || job.assigned_to;
      if (!landscaperId) {
        setLandscaperDisplay('Unassigned');
        return;
      }

      setLandscaperLoading(true);

      try {
        const { data, error: err } = await supabase
          .from('landscapers')
          .select('email, full_name')
          .eq('id', landscaperId)
          .maybeSingle();

        if (cancelled) return;

        if (err) {
          console.warn('[CompletionReviewPanel] landscaper lookup error:', err);
          setLandscaperDisplay(landscaperId);
          return;
        }

        if (!data) {
          setLandscaperDisplay(landscaperId);
          return;
        }

        const email = (data as any).email as string | null;
        const fullName = (data as any).full_name as string | null;

        setLandscaperDisplay(fullName || email || landscaperId);
      } finally {
        if (!cancelled) setLandscaperLoading(false);
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [job.landscaper_email, job.landscaper_id, job.assigned_to]);

  /* ── Action handlers ─────────────────────────────────────────────── */

  const handleApprove = async () => {
    if (!hasAfterPhoto) return;
    setActionLoading('approve');
    setError(null);
    try {
      const { error: err } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          admin_approved_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (err) throw err;

      onActionComplete?.(job.id, 'completed');
      onClose();
    } catch (e: any) {
      console.error('[CompletionReview] Approve failed:', e);
      setError(e.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturnToActive = async () => {
    if (!adminNote.trim()) {
      setError('Admin note is required to return a job to active.');
      return;
    }
    setActionLoading('return');
    setError(null);
    try {
      const { error: err } = await supabase
        .from('jobs')
        .update({
          status: 'active',
          admin_review_notes: adminNote.trim(),
        })
        .eq('id', job.id);

      if (err) throw err;

      onActionComplete?.(job.id, 'active');
      onClose();
    } catch (e: any) {
      console.error('[CompletionReview] Return failed:', e);
      setError(e.message || 'Failed to return to active');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async () => {
    setActionLoading('flag');
    setError(null);
    try {
      const { error: err } = await supabase
        .from('jobs')
        .update({
          status: 'completion_flagged',
          admin_review_notes: adminNote.trim() || null,
        })
        .eq('id', job.id);

      if (err) throw err;

      onActionComplete?.(job.id, 'completion_flagged');
      onClose();
    } catch (e: any) {
      console.error('[CompletionReview] Flag failed:', e);
      setError(e.message || 'Failed to flag');
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = !!actionLoading;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <>
      {previewUrl && <PhotoModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <Card className="bg-black/70 backdrop-blur border border-orange-500/30 rounded-2xl ring-1 ring-orange-500/20 shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-500/20 bg-orange-500/5">
          <h3 className="text-lg font-bold text-orange-300 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Completion Review
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Photos</h4>

            {!photosLoaded ? (
              <div className="flex items-center gap-2 py-6 justify-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading photos...</span>
              </div>
            ) : beforePhotos.length === 0 && afterPhotos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-gray-500">
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm">No photos uploaded for this job</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PhotoGalleryStrip
                  photos={beforePhotos}
                  label="Before Photos"
                  accentColor="amber"
                  onPreview={setPreviewUrl}
                />
                <PhotoGalleryStrip
                  photos={afterPhotos}
                  label="After Photos"
                  accentColor="emerald"
                  onPreview={setPreviewUrl}
                  warningIfEmpty="After photo required before approval"
                />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Review Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm bg-black/30 rounded-lg px-3 py-2 border border-gray-700/50">
                <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-gray-400">Client:</span>
                <span className="text-white truncate">{job.customer_name || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-black/30 rounded-lg px-3 py-2 border border-gray-700/50">
                <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-400">Landscaper:</span>
                <span className="text-white truncate flex items-center gap-2">
                  {landscaperDisplay}
                  {landscaperLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-black/30 rounded-lg px-3 py-2 border border-gray-700/50">
                <Briefcase className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-gray-400">Service:</span>
                <span className="text-white truncate">{job.service_name || job.service_type || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-black/30 rounded-lg px-3 py-2 border border-gray-700/50">
                <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-gray-400">Price:</span>
                <span className="text-emerald-300 font-semibold">{job.price ? `$${job.price}` : 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm bg-black/30 rounded-lg px-3 py-2 border border-gray-700/50 sm:col-span-2">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-gray-400">Completed:</span>
                <span className="text-white">
                  {job.completed_at
                    ? new Date(job.completed_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Admin Note <span className="text-gray-500 font-normal">(required for Return / optional for Flag)</span>
            </label>
            <Textarea
              placeholder="Enter review notes..."
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              className="bg-black/40 border-gray-600 text-white placeholder-gray-500 resize-none focus:border-orange-500/50 focus:ring-orange-500/20"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleApprove}
              disabled={!hasAfterPhoto || !photosLoaded || isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)] hover:shadow-[0_0_25px_-3px_rgba(16,185,129,0.8)] disabled:opacity-40 disabled:shadow-none transition-all"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve Completion
            </Button>

            <Button
              onClick={handleReturnToActive}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/70 font-semibold transition-all"
            >
              {actionLoading === 'return' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Return To Active
            </Button>

            <Button
              onClick={handleFlag}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-400/70 font-semibold transition-all"
            >
              {actionLoading === 'flag' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Flag className="w-4 h-4 mr-2" />
              )}
              Flag For Investigation
            </Button>
          </div>

          {!hasAfterPhoto && photosLoaded && (
            <p className="text-xs text-amber-400/70 text-center">
              Approve is disabled because no after photo has been uploaded to job_photos.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}