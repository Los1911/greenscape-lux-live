import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { invokeJobExecution } from '@/lib/edgeFunctionClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Check, Loader2, Eye, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/components/SharedUI/Toast';
import { compressImage } from '@/utils/imageCompression';
import { useMobile } from '@/hooks/use-mobile';
import CameraCapture from '@/components/mobile/CameraCapture';
import { JobPhoto, PHOTO_CONFIG, groupPhotosByType } from '@/types/jobPhoto';
import BeforeAfterComparison from '@/components/photos/BeforeAfterComparison';
import { JOB_PHOTOS_COLUMNS, safeString } from '@/lib/databaseSchema';

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE ENFORCEMENT:
//   - Before photos: ONLY when status === 'active' AND startedAt exists
//   - After photos:  ONLY when before photos exist
//   - Complete:      Uses invokeJobExecution('complete') — NOT direct DB update
//   - NO local payout_amount calculation (admin sets this on approval)
// ═══════════════════════════════════════════════════════════════════════════


interface JobCompletionFormProps {
  jobId: number | string;
  status: string;
  startedAt?: string;
  beforeUrl?: string;
  afterUrl?: string;
}

interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  type: 'before' | 'after';
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

// Normalize photo data to handle missing/renamed columns safely
function normalizePhoto(rawPhoto: Record<string, unknown>): JobPhoto {
  return {
    id: safeString(rawPhoto, 'id'),
    job_id: safeString(rawPhoto, 'job_id'),
    // Handle both file_url and photo_url column names
    file_url: safeString(rawPhoto, 'file_url') || safeString(rawPhoto, 'photo_url'),
    // Handle both type and photo_type column names
    type: (safeString(rawPhoto, 'type') || safeString(rawPhoto, 'photo_type')) as 'before' | 'after',
    // Handle both uploaded_at and created_at column names
    uploaded_at: safeString(rawPhoto, 'uploaded_at') || safeString(rawPhoto, 'created_at'),
    sort_order: Number(rawPhoto.sort_order) || 0,
    caption: safeString(rawPhoto, 'caption'),
  };
}

const JobCompletionForm: React.FC<JobCompletionFormProps> = ({
  jobId,
  status,
  startedAt,
  beforeUrl,
  afterUrl
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isMobile } = useMobile();
  const isCompleted = status === 'Completed' || status === 'completed';
  
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<JobPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // LIFECYCLE GATES
  // ═══════════════════════════════════════════════════════════════════════
  const isActive = status === 'active';
  const hasStartedAt = !!startedAt;
  // Before photos: require active + started_at
  const canUploadBeforePhotos = isActive && hasStartedAt;
  // After photos: require before photos exist (checked dynamically below)

  // Fetch existing photos
  useEffect(() => {
    if (jobId) {
      fetchExistingPhotos();
    }
  }, [jobId]);

  const fetchExistingPhotos = async () => {
    setLoadingExisting(true);
    try {
      // Use explicit column selection instead of select('*')
      const { data, error } = await supabase
        .from('job_photos')
        .select(JOB_PHOTOS_COLUMNS.select)
        .eq('job_id', String(jobId))
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.warn('[JobCompletionForm] Error fetching photos:', error.message);
        // Don't throw - gracefully handle missing table/columns
        setExistingPhotos([]);
        return;
      }
      
      // Normalize photos to handle missing columns safely
      const photos: JobPhoto[] = (data || []).map(p => normalizePhoto(p as Record<string, unknown>));
      
      // Also handle legacy single photo URLs
      if (beforeUrl && !photos.some(p => p.file_url === beforeUrl)) {
        photos.push({
          id: 'legacy-before',
          job_id: String(jobId),
          file_url: beforeUrl,
          type: 'before',
          uploaded_at: new Date().toISOString()
        });
      }
      
      if (afterUrl && !photos.some(p => p.file_url === afterUrl)) {
        photos.push({
          id: 'legacy-after',
          job_id: String(jobId),
          file_url: afterUrl,
          type: 'after',
          uploaded_at: new Date().toISOString()
        });
      }
      
      setExistingPhotos(photos);
    } catch (err) {
      console.error('[JobCompletionForm] Error fetching photos:', err);
      // Gracefully handle - don't crash
      setExistingPhotos([]);
    } finally {
      setLoadingExisting(false);
    }
  };


  const existingBeforeCount = existingPhotos.filter(p => p.type === 'before').length;
  const existingAfterCount = existingPhotos.filter(p => p.type === 'after').length;
  const pendingBeforeCount = pendingPhotos.filter(p => p.type === 'before').length;
  const pendingAfterCount = pendingPhotos.filter(p => p.type === 'after').length;

  const totalBeforeCount = existingBeforeCount + pendingBeforeCount;
  const totalAfterCount = existingAfterCount + pendingAfterCount;

  const canAddBefore = totalBeforeCount < PHOTO_CONFIG.MAX_BEFORE_PHOTOS;
  const canAddAfter = totalAfterCount < PHOTO_CONFIG.MAX_AFTER_PHOTOS;

  // LIFECYCLE GATE: After photos require at least 1 before photo
  const canUploadAfterPhotos = canUploadBeforePhotos && totalBeforeCount > 0;

  const validateFile = (file: File): boolean => {
    if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`File size must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`, 'error');
      return false;
    }
    
    if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      showToast('Only JPG, PNG, WebP files are allowed', 'error');
      return false;
    }
    
    return true;
  };

  const handleFileSelect = async (type: 'before' | 'after', files: FileList | File[]) => {
    // ── LIFECYCLE GATE: Block uploads if prerequisites not met ──
    if (type === 'before' && !canUploadBeforePhotos) {
      showToast('Start the job before uploading photos', 'error');
      return;
    }
    if (type === 'after' && !canUploadAfterPhotos) {
      if (!canUploadBeforePhotos) {
        showToast('Start the job before uploading photos', 'error');
      } else {
        showToast('Upload before photos first', 'error');
      }
      return;
    }

    const fileArray = Array.from(files);
    const maxCount = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS;
    const currentCount = type === 'before' ? totalBeforeCount : totalAfterCount;
    const remainingSlots = maxCount - currentCount;

    if (remainingSlots <= 0) {
      showToast(`Maximum ${maxCount} ${type} photos allowed`, 'error');
      return;
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!validateFile(file)) continue;

      try {
        const compressedFile = await compressImage(file);
        const preview = URL.createObjectURL(compressedFile);
        
        const newPhoto: PendingPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: compressedFile,
          preview,
          type,
          status: 'pending'
        };

        setPendingPhotos(prev => [...prev, newPhoto]);
      } catch (error) {
        showToast('Failed to process image', 'error');
      }
    }
  };

  const handleCameraCapture = (file: File) => {
    if (cameraMode) {
      handleFileSelect(cameraMode, [file]);
    }
    setCameraMode(null);
  };

  const removePhoto = (id: string) => {
    setPendingPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── LIFECYCLE GATE: Must be active to submit ──
    if (!isActive) {
      showToast('Job must be active to submit completion', 'error');
      return;
    }

    if (totalBeforeCount === 0) {
      showToast('Please add at least one before photo', 'error');
      return;
    }
    if (totalAfterCount === 0) {
      showToast('Please add at least one after photo', 'error');
      return;
    }

    if (pendingPhotos.length === 0) {
      // No new photos to upload, go straight to completion via edge function
      await completeJobViaEdgeFunction();
      return;
    }

    setUploading(true);
    const timestamp = Date.now();

    // Helper to sanitize filename for Supabase Storage
    const sanitizeFileName = (name: string): string => {
      const lastDot = name.lastIndexOf('.');
      const ext = lastDot > 0 ? name.slice(lastDot).toLowerCase() : '.jpg';
      const baseName = lastDot > 0 ? name.slice(0, lastDot) : name;
      const sanitized = baseName
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 50);
      return `${sanitized || 'photo'}${ext}`;
    };

    // Helper to get content type
    const getContentType = (file: File): string => {
      if (file.type && file.type.startsWith('image/')) return file.type;
      const ext = file.name.toLowerCase().split('.').pop();
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'webp': 'image/webp', 'gif': 'image/gif', 'heic': 'image/heic'
      };
      return mimeTypes[ext || ''] || 'image/jpeg';
    };

    try {
      for (let i = 0; i < pendingPhotos.length; i++) {
        const photo = pendingPhotos[i];
        
        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p)
        );

        const safeFileName = sanitizeFileName(photo.file.name);
        const contentType = getContentType(photo.file);
        const path = `${jobId}/${timestamp}_${photo.type}_${i}_${safeFileName}`;
        
        console.log('[JobCompletionForm] Uploading:', { path, contentType, jobId });
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, photo.file, { 
            upsert: false, 
            contentType: contentType,
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);

        // Get authenticated user for uploaded_by field (required by RLS)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.id) {
          throw new Error('Not authenticated - cannot save photo metadata');
        }

        // Insert into database with uploaded_by field to satisfy RLS policy
        // NOTE: This does NOT update job status — only the edge function does that
        const { error: insertError } = await supabase
          .from('job_photos')
          .insert({
            job_id: String(jobId),
            file_url: urlData.publicUrl,
            type: photo.type,
            uploaded_at: new Date().toISOString(),
            sort_order: i,
            uploaded_by: authUser.id  // Required by RLS policy: uploaded_by = auth.uid()
          });

        if (insertError) throw insertError;

        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'uploaded' } : p)
        );
      }

      // Photos uploaded — now complete via edge function
      await completeJobViaEdgeFunction();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
      setUploading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LIFECYCLE-ENFORCED COMPLETION
  // Uses invokeJobExecution('complete') — the edge function validates:
  //   - status === 'active'
  //   - started_at exists
  //   - before photos exist in DB
  //   - after photos exist in DB
  // Then sets status → 'completed_pending_review' (NOT 'completed')
  // Does NOT set payout_amount (admin does that on approval)
  // ═══════════════════════════════════════════════════════════════════════
  const completeJobViaEdgeFunction = async () => {
    try {
      console.log('[JobCompletionForm] Completing job via edge function:', { jobId });

      const { data, error: fnErr } = await invokeJobExecution({
        action: 'complete',
        jobId: String(jobId),
      });

      if (fnErr) {
        // Parse specific photo-related errors for better UX
        if (fnErr.includes('before photo')) {
          showToast('At least 1 before photo is required', 'error');
        } else if (fnErr.includes('after photo')) {
          showToast('At least 1 after photo is required', 'error');
        } else if (fnErr.includes('must be "active"')) {
          showToast('Job must be active to complete. Start the job first.', 'error');
        } else if (fnErr.includes('start time')) {
          showToast('Job must be started before completion.', 'error');
        } else {
          showToast(fnErr, 'error');
        }
        return;
      }

      showToast('Job submitted for review!', 'success');
      navigate('/job-complete');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete job', 'error');
    } finally {
      setUploading(false);
    }
  };


  const renderPhotoSlot = (type: 'before' | 'after') => {
    const canAdd = type === 'before' ? canAddBefore : canAddAfter;
    const pending = pendingPhotos.filter(p => p.type === type);
    const existing = existingPhotos.filter(p => p.type === type);
    const maxCount = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS;
    const totalCount = type === 'before' ? totalBeforeCount : totalAfterCount;

    // ── LIFECYCLE GATE: Check if this photo type is uploadable ──
    const isUploadable = type === 'before' ? canUploadBeforePhotos : canUploadAfterPhotos;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${type === 'before' ? 'text-amber-400' : 'text-green-400'}`}>
            {type === 'before' ? 'Before Photos' : 'After Photos'} *
          </h4>
          <span className="text-xs text-gray-400">
            {totalCount} / {maxCount}
          </span>
        </div>

        {/* ── LIFECYCLE LOCK: Show blocked state if prerequisites not met ── */}
        {!isUploadable && !isCompleted && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
            <Lock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <p className="font-medium text-gray-300">
                {!isActive || !hasStartedAt
                  ? 'Start the job first'
                  : type === 'after'
                  ? 'Upload before photos first'
                  : 'Job must be active'}
              </p>
              <p className="mt-1 text-gray-500">
                {!isActive || !hasStartedAt
                  ? 'Photos can only be uploaded after the job has been started.'
                  : 'Upload at least 1 before photo before adding after photos.'}
              </p>
            </div>
          </div>
        )}

        {/* Only render upload UI when lifecycle gate is passed */}
        {(isUploadable || isCompleted) && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {/* Existing Photos */}
              {existing.map(photo => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <img src={photo.file_url} alt={type} className="w-full h-full object-cover" />
                  <Badge className="absolute top-1 right-1 bg-green-500/80 text-xs px-1">
                    <Check className="w-3 h-3" />
                  </Badge>
                </div>
              ))}

              {/* Pending Photos */}
              {pending.map(photo => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <img src={photo.preview} alt={type} className="w-full h-full object-cover" />
                  
                  {photo.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  
                  {photo.status === 'uploaded' && (
                    <Badge className="absolute top-1 right-1 bg-green-500/80 text-xs px-1">
                      <Check className="w-3 h-3" />
                    </Badge>
                  )}
                  
                  {photo.status === 'pending' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add Photo Button — only when uploadable */}
              {canAdd && !isCompleted && isUploadable && (
                <div className={`aspect-square rounded-lg border-2 border-dashed ${
                  type === 'before' ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-green-500/30 hover:border-green-500/50'
                } transition-colors`}>
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-1">
                    <Upload className={`w-5 h-5 ${type === 'before' ? 'text-amber-400/70' : 'text-green-400/70'}`} />
                    <span className="text-xs text-gray-400">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileSelect(type, e.target.files)}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Camera Button (Mobile) — only when uploadable */}
            {isMobile && canAdd && !isCompleted && isUploadable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCameraMode(type)}
                className={`w-full ${
                  type === 'before' 
                    ? 'border-amber-500/30 text-amber-300 hover:bg-amber-900/20' 
                    : 'border-green-500/30 text-green-300 hover:bg-green-900/20'
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take {type} Photo
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // Preview mode with comparison
  if (showPreview) {
    const allPhotos: JobPhoto[] = [
      ...existingPhotos,
      ...pendingPhotos.map(p => ({
        id: p.id,
        job_id: String(jobId),
        file_url: p.preview,
        type: p.type,
        uploaded_at: new Date().toISOString()
      }))
    ];

    return (
      <Card className="bg-gray-900 border border-green-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Preview Comparison</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(false)}
            className="border-gray-600"
          >
            Back to Edit
          </Button>
        </div>
        
        <BeforeAfterComparison photos={allPhotos} showTimestamps={false} />
        
        <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">Confirmation Required</p>
              <p className="text-sm text-gray-300 mt-1">
                These photos will be shared with the client and admin for job verification.
                The job will be submitted for admin review (not marked as complete until approved).
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            className="flex-1 border-gray-600"
          >
            Edit Photos
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || totalBeforeCount === 0 || totalAfterCount === 0}
            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // Completed view with comparison
  if (isCompleted && existingPhotos.length > 0) {
    return (
      <Card className="bg-gray-900 border border-green-500/30 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          Job Completed
        </h3>
        <BeforeAfterComparison 
          photos={existingPhotos} 
          showTimestamps={true}
          title="Work Documentation"
        />
      </Card>
    );
  }

  // ── NOT ACTIVE: Show lifecycle status message ──
  if (!isActive && !isCompleted && status !== 'completed_pending_review') {
    return (
      <Card className="bg-gray-900 border border-gray-700/50 p-6">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Job Not Active</h3>
            <p className="text-sm text-gray-500 mt-1">
              Start the job to begin uploading photos and working towards completion.
              Current status: <span className="text-gray-400 font-medium">{status}</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ── PENDING REVIEW: Show waiting state ──
  if (status === 'completed_pending_review') {
    return (
      <Card className="bg-gray-900 border border-amber-500/30 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-300">Awaiting Admin Review</h3>
            <p className="text-sm text-gray-400 mt-1">
              Your work has been submitted. An admin will review and approve shortly.
            </p>
          </div>
        </div>
        {existingPhotos.length > 0 && (
          <div className="mt-4">
            <BeforeAfterComparison 
              photos={existingPhotos} 
              showTimestamps={true}
              title="Submitted Photos"
            />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border border-green-500/30 p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Camera className="w-5 h-5 text-green-400" />
        Complete Job
      </h3>

      {loadingExisting ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderPhotoSlot('before')}
          {renderPhotoSlot('after')}

          {/* Preview Button */}
          {(pendingPhotos.length > 0 || existingPhotos.length > 0) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="w-full border-green-500/30 text-green-300 hover:bg-green-900/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Comparison
            </Button>
          )}

          <Button
            type="submit"
            disabled={uploading || totalBeforeCount === 0 || totalAfterCount === 0}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </div>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit Photos & Complete
              </>
            )}
          </Button>
        </form>
      )}

      {/* Camera Capture Modal */}
      {cameraMode && (
        <CameraCapture
          isOpen={!!cameraMode}
          onClose={() => setCameraMode(null)}
          onCapture={handleCameraCapture}
          title={`Take ${cameraMode} Photo`}
          includeGPS={true}
        />
      )}
    </Card>
  );
};

export default JobCompletionForm;
