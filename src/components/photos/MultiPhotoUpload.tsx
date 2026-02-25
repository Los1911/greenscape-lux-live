import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Camera, 
  Image as ImageIcon,
  AlertCircle,
  Check,
  Loader2,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/SharedUI/Toast';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';
import { useMobile } from '@/hooks/use-mobile';
import CameraCapture from '@/components/mobile/CameraCapture';
import { PHOTO_CONFIG, JobPhoto } from '@/types/jobPhoto';
import BeforeAfterComparison from './BeforeAfterComparison';

interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  type: 'before' | 'after';
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface MultiPhotoUploadProps {
  jobId: string;
  existingPhotos?: JobPhoto[];
  onUploadComplete?: (photos: JobPhoto[]) => void;
  onCancel?: () => void;
  maxBeforePhotos?: number;
  maxAfterPhotos?: number;
  requireBothTypes?: boolean;
  showPreview?: boolean;
}

export default function MultiPhotoUpload({
  jobId,
  existingPhotos = [],
  onUploadComplete,
  onCancel,
  maxBeforePhotos = PHOTO_CONFIG.MAX_BEFORE_PHOTOS,
  maxAfterPhotos = PHOTO_CONFIG.MAX_AFTER_PHOTOS,
  requireBothTypes = true,
  showPreview = true
}: MultiPhotoUploadProps) {
  const { showToast } = useToast();
  const { isMobile } = useMobile();
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const existingBeforeCount = existingPhotos.filter(p => p.type === 'before').length;
  const existingAfterCount = existingPhotos.filter(p => p.type === 'after').length;
  const pendingBeforeCount = pendingPhotos.filter(p => p.type === 'before').length;
  const pendingAfterCount = pendingPhotos.filter(p => p.type === 'after').length;

  const canAddBefore = (existingBeforeCount + pendingBeforeCount) < maxBeforePhotos;
  const canAddAfter = (existingAfterCount + pendingAfterCount) < maxAfterPhotos;

  const validateFile = (file: File): string | null => {
    if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`;
    }
    
    if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP files are allowed';
    }
    
    return null;
  };

  const handleFileSelect = useCallback(async (type: 'before' | 'after', files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxCount = type === 'before' ? maxBeforePhotos : maxAfterPhotos;
    const existingCount = type === 'before' ? existingBeforeCount : existingAfterCount;
    const pendingCount = type === 'before' ? pendingBeforeCount : pendingAfterCount;
    const remainingSlots = maxCount - existingCount - pendingCount;

    if (remainingSlots <= 0) {
      showToast(`Maximum ${maxCount} ${type} photos allowed`, 'error');
      return;
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        showToast(error, 'error');
        continue;
      }

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
      } catch (err) {
        showToast('Failed to process image', 'error');
      }
    }
  }, [maxBeforePhotos, maxAfterPhotos, existingBeforeCount, existingAfterCount, pendingBeforeCount, pendingAfterCount, showToast]);

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

  const handleUpload = async () => {
    if (requireBothTypes) {
      const totalBefore = existingBeforeCount + pendingBeforeCount;
      const totalAfter = existingAfterCount + pendingAfterCount;
      
      if (totalBefore === 0) {
        showToast('Please add at least one before photo', 'error');
        return;
      }
      if (totalAfter === 0) {
        showToast('Please add at least one after photo', 'error');
        return;
      }
    }

    if (pendingPhotos.length === 0) {
      showToast('No new photos to upload', 'error');
      return;
    }

    setUploading(true);
    const uploadedPhotos: JobPhoto[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < pendingPhotos.length; i++) {
      const photo = pendingPhotos[i];
      
      setPendingPhotos(prev => 
        prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p)
      );

      try {
        const path = `${jobId}/${timestamp}_${photo.type}_${i}_${photo.file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, photo.file, { upsert: false, contentType: photo.file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);

        const { data: insertData, error: insertError } = await supabase
          .from('job_photos')
          .insert({
            job_id: jobId,
            file_url: urlData.publicUrl,
            type: photo.type,
            uploaded_at: new Date().toISOString(),
            sort_order: i
          })
          .select()
          .single();

        if (insertError) throw insertError;

        uploadedPhotos.push(insertData);

        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'uploaded' } : p)
        );
      } catch (err: any) {
        console.error('Photo upload error:', err);
        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'error', error: err.message } : p)
        );
      }
    }

    setUploading(false);

    const successCount = uploadedPhotos.length;
    const failCount = pendingPhotos.length - successCount;

    if (successCount > 0) {
      showToast(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully`, 'success');
      
      // Clean up successful uploads from pending
      setPendingPhotos(prev => prev.filter(p => p.status !== 'uploaded'));
      
      if (onUploadComplete) {
        onUploadComplete(uploadedPhotos);
      }
    }

    if (failCount > 0) {
      showToast(`${failCount} photo${failCount > 1 ? 's' : ''} failed to upload`, 'error');
    }
  };

  const renderPhotoSlot = (type: 'before' | 'after') => {
    const canAdd = type === 'before' ? canAddBefore : canAddAfter;
    const photos = pendingPhotos.filter(p => p.type === type);
    const maxCount = type === 'before' ? maxBeforePhotos : maxAfterPhotos;
    const existingCount = type === 'before' ? existingBeforeCount : existingAfterCount;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${type === 'before' ? 'text-amber-300' : 'text-emerald-300'}`}>
            {type === 'before' ? 'Before Photos' : 'After Photos'}
          </h4>
          <span className="text-sm text-slate-400">
            {existingCount + photos.length} / {maxCount}
          </span>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Existing Photos */}
          {existingPhotos.filter(p => p.type === type).map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
              <img src={photo.file_url} alt={type} className="w-full h-full object-cover" />
              <Badge className="absolute top-1 right-1 bg-emerald-500/80 text-xs">
                <Check className="w-3 h-3" />
              </Badge>
            </div>
          ))}

          {/* Pending Photos */}
          {photos.map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
              <img src={photo.preview} alt={type} className="w-full h-full object-cover" />
              
              {photo.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {photo.status === 'uploaded' && (
                <Badge className="absolute top-1 right-1 bg-emerald-500/80 text-xs">
                  <Check className="w-3 h-3" />
                </Badge>
              )}
              
              {photo.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              )}
              
              {photo.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-600 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}

          {/* Add Photo Button */}
          {canAdd && (
            <div className={`aspect-square rounded-lg border-2 border-dashed ${
              type === 'before' ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-emerald-500/30 hover:border-emerald-500/50'
            } transition-colors`}>
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-1">
                <Upload className={`w-6 h-6 ${type === 'before' ? 'text-amber-400/70' : 'text-emerald-400/70'}`} />
                <span className="text-xs text-slate-400">Add</span>
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
        {isMobile && canAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraMode(type)}
            className={`w-full ${
              type === 'before' 
                ? 'border-amber-500/30 text-amber-300 hover:bg-amber-900/20' 
                : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/20'
            }`}
          >
            <Camera className="w-4 h-4 mr-2" />
            Take {type} Photo
          </Button>
        )}
      </div>
    );
  };

  // Preview mode
  if (previewMode) {
    const allPhotos: JobPhoto[] = [
      ...existingPhotos,
      ...pendingPhotos.map(p => ({
        id: p.id,
        job_id: jobId,
        file_url: p.preview,
        type: p.type,
        uploaded_at: new Date().toISOString()
      }))
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-emerald-300">Preview Comparison</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(false)}
            className="border-slate-600"
          >
            Back to Edit
          </Button>
        </div>
        
        <BeforeAfterComparison photos={allPhotos} showTimestamps={false} />
        
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">Confirmation Required</p>
              <p className="text-sm text-slate-300 mt-1">
                These photos will be shared with the client and admin for job verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(false)}
            className="flex-1 border-slate-600"
          >
            Edit Photos
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || pendingPhotos.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Upload
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Photo Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderPhotoSlot('before')}
        {renderPhotoSlot('after')}
      </div>

      {/* Info Notice */}
      {requireBothTypes && (
        <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-400">
          <ImageIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Upload at least one before and one after photo to complete the job.
            Photos help verify work quality and build trust with clients.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-700/50">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-slate-600"
          >
            Cancel
          </Button>
        )}
        
        {showPreview && pendingPhotos.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="flex-1 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/20"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={uploading || pendingPhotos.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </>
          )}
        </Button>
      </div>

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
    </div>
  );
}
