import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Check, Loader2, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/SharedUI/Toast';
import { compressImage } from '@/utils/imageCompression';
import { useMobile } from '@/hooks/use-mobile';
import CameraCapture from '@/components/mobile/CameraCapture';
import { JobPhoto, PHOTO_CONFIG, groupPhotosByType } from '@/types/jobPhoto';
import BeforeAfterComparison from '@/components/photos/BeforeAfterComparison';
import { JOB_PHOTOS_COLUMNS, safeString } from '@/lib/databaseSchema';

interface JobCompletionFormProps {
  jobId: number | string;
  status: string;
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

    if (totalBeforeCount === 0) {
      showToast('Please add at least one before photo', 'error');
      return;
    }
    if (totalAfterCount === 0) {
      showToast('Please add at least one after photo', 'error');
      return;
    }

    if (pendingPhotos.length === 0) {
      // No new photos, just mark complete
      await completeJob();
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

      await completeJob();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
      setUploading(false);
    }
  };

  const completeJob = async () => {
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (updateError) throw updateError;

      showToast('Job completed successfully!', 'success');
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

          {/* Add Photo Button */}
          {canAdd && !isCompleted && (
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

        {/* Camera Button (Mobile) */}
        {isMobile && canAdd && !isCompleted && (
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
                Confirm & Complete
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
