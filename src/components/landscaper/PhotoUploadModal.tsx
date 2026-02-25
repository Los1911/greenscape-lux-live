import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Camera, Eye, AlertCircle, Check, Loader2, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/SharedUI/Toast"
import { Jobs } from "@/db/contracts"
import { compressImage } from "@/utils/imageCompression"
import CameraCapture from "@/components/mobile/CameraCapture"
import { useMobile } from "@/hooks/use-mobile"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import { JobPhoto, PHOTO_CONFIG, groupPhotosByType } from "@/types/jobPhoto"
import BeforeAfterComparison from "@/components/photos/BeforeAfterComparison"

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  onSuccess: () => void
  onError: (message: string) => void
}

interface PendingPhoto {
  id: string
  file: File
  preview: string
  type: 'before' | 'after'
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
}

function PhotoUploadInner({ 
  isOpen, 
  onClose, 
  jobId, 
  onSuccess, 
  onError 
}: PhotoUploadModalProps) {
  const { showToast } = useToast()
  const { isMobile } = useMobile()
  const { isOnline } = useOfflineSync()
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState<JobPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload')
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Fetch existing photos when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchExistingPhotos()
    }
  }, [isOpen, jobId])

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      pendingPhotos.forEach(p => URL.revokeObjectURL(p.preview))
    }
  }, [])

  const fetchExistingPhotos = async () => {
    setLoadingExisting(true)
    try {
      const { data, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', jobId)
        .order('uploaded_at', { ascending: true })

      if (error) throw error
      setExistingPhotos(data || [])
    } catch (err) {
      console.error('Error fetching existing photos:', err)
    } finally {
      setLoadingExisting(false)
    }
  }

  const existingBeforeCount = existingPhotos.filter(p => p.type === 'before').length
  const existingAfterCount = existingPhotos.filter(p => p.type === 'after').length
  const pendingBeforeCount = pendingPhotos.filter(p => p.type === 'before').length
  const pendingAfterCount = pendingPhotos.filter(p => p.type === 'after').length

  const totalBeforeCount = existingBeforeCount + pendingBeforeCount
  const totalAfterCount = existingAfterCount + pendingAfterCount

  const canAddBefore = totalBeforeCount < PHOTO_CONFIG.MAX_BEFORE_PHOTOS
  const canAddAfter = totalAfterCount < PHOTO_CONFIG.MAX_AFTER_PHOTOS

  const validateFile = (file: File): boolean => {
    if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`File size must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`, 'error')
      return false
    }
    
    if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      showToast('Only JPG, PNG, WebP files are allowed', 'error')
      return false
    }
    
    return true
  }

  const handleFileSelect = async (type: 'before' | 'after', files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const maxCount = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS
    const currentCount = type === 'before' ? totalBeforeCount : totalAfterCount
    const remainingSlots = maxCount - currentCount

    if (remainingSlots <= 0) {
      showToast(`Maximum ${maxCount} ${type} photos allowed`, 'error')
      return
    }

    const filesToProcess = fileArray.slice(0, remainingSlots)

    for (const file of filesToProcess) {
      if (!validateFile(file)) continue

      try {
        const compressedFile = await compressImage(file)
        const preview = URL.createObjectURL(compressedFile)
        
        const newPhoto: PendingPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: compressedFile,
          preview,
          type,
          status: 'pending'
        }

        setPendingPhotos(prev => [...prev, newPhoto])
      } catch (error) {
        showToast('Failed to process image', 'error')
      }
    }
  }

  const handleCameraCapture = (file: File) => {
    if (cameraMode) {
      handleFileSelect(cameraMode, [file])
    }
    setCameraMode(null)
  }

  const removePhoto = (id: string) => {
    setPendingPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const handleUpload = async () => {
    // Validate we have at least one of each type
    if (totalBeforeCount === 0) {
      showToast('Please add at least one before photo', 'error')
      return
    }
    if (totalAfterCount === 0) {
      showToast('Please add at least one after photo', 'error')
      return
    }

    if (pendingPhotos.length === 0) {
      // No new photos to upload, just complete the job
      await completeJob()
      return
    }
    setLoading(true)
    const timestamp = Date.now()

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
        const photo = pendingPhotos[i]
        
        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'uploading' } : p)
        )

        const safeFileName = sanitizeFileName(photo.file.name)
        const contentType = getContentType(photo.file)
        const path = `${jobId}/${timestamp}_${photo.type}_${i}_${safeFileName}`
        
        console.log('[PhotoUploadModal] Uploading:', { path, contentType, jobId })
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, photo.file, { 
            upsert: false, 
            contentType: contentType,
            cacheControl: '3600'
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path)

        // Get authenticated user for uploaded_by field (required by RLS)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser?.id) {
          throw new Error('Not authenticated - cannot save photo metadata')
        }

        // Insert into database with uploaded_by field to satisfy RLS policy
        const { error: insertError } = await supabase
          .from('job_photos')
          .insert({
            job_id: jobId,
            file_url: urlData.publicUrl,
            type: photo.type,
            uploaded_at: new Date().toISOString(),
            sort_order: i,
            uploaded_by: authUser.id  // Required by RLS policy: uploaded_by = auth.uid()
          })

        if (insertError) throw insertError

        setPendingPhotos(prev => 
          prev.map(p => p.id === photo.id ? { ...p, status: 'uploaded' } : p)
        )
      }

      // Complete the job
      await completeJob()
    } catch (error: any) {
      console.error('[PhotoUpload] fail', { jobId, message: error?.message })
      const errorMsg = error?.message || 'Upload failed'
      showToast(errorMsg, 'error')
      onError(errorMsg)
      setLoading(false)
    }
  }

  const completeJob = async () => {
    try {
      const { error: updErr, count } = await Jobs.complete(supabase, jobId)
      if (updErr) {
        console.error('[CompleteJob] fail', { jobId, code: updErr?.code, message: updErr?.message })
        if (updErr.code === 'PGRST301' || count === 0) {
          showToast('Not permitted to complete this job', 'error')
        } else {
          showToast(updErr.message || 'Failed to complete job', 'error')
        }
        return
      }

      showToast('Photos uploaded. Job completed.', 'success')
      onClose()
      onSuccess()
      setPendingPhotos([])
    } catch (error: any) {
      showToast(error?.message || 'Failed to complete job', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderPhotoSlot = (type: 'before' | 'after') => {
    const canAdd = type === 'before' ? canAddBefore : canAddAfter
    const pending = pendingPhotos.filter(p => p.type === type)
    const existing = existingPhotos.filter(p => p.type === type)
    const maxCount = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS
    const totalCount = type === 'before' ? totalBeforeCount : totalAfterCount

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium text-sm ${type === 'before' ? 'text-amber-300' : 'text-green-300'}`}>
            {type === 'before' ? 'Before Photos' : 'After Photos'} *
          </h4>
          <span className="text-xs text-gray-400">
            {totalCount} / {maxCount}
          </span>
        </div>

        {/* Photo Grid */}
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
          {canAdd && (
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
        {isMobile && canAdd && (
          <Button
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
    )
  }

  // Preview mode with comparison
  const allPhotosForPreview: JobPhoto[] = [
    ...existingPhotos,
    ...pendingPhotos.map(p => ({
      id: p.id,
      job_id: jobId,
      file_url: p.preview,
      type: p.type,
      uploaded_at: new Date().toISOString()
    }))
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/95 backdrop-blur border border-green-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2 text-xl">
              <Camera className="w-6 h-6" />
              Upload Job Photos
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'preview')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                disabled={allPhotosForPreview.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6 mt-4">
              {loadingExisting ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                </div>
              ) : (
                <>
                  {renderPhotoSlot('before')}
                  {renderPhotoSlot('after')}
                </>
              )}

              {/* Info Notice */}
              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
                <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Upload multiple before and after photos to document your work. 
                  Photos will be shared with the client and admin for verification.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {allPhotosForPreview.length > 0 ? (
                <BeforeAfterComparison 
                  photos={allPhotosForPreview}
                  showTimestamps={false}
                  title="Preview Comparison"
                  className="border-0 bg-transparent p-0"
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Add photos to see preview</p>
                </div>
              )}

              {/* Confirmation Notice */}
              <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 text-sm font-medium">Confirmation Required</p>
                    <p className="text-xs text-gray-300 mt-1">
                      These photos will be shared with the client and admin for job verification.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={totalBeforeCount === 0 || totalAfterCount === 0 || loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg shadow-green-600/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload & Complete Job
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {cameraMode && (
        <CameraCapture
          isOpen={!!cameraMode}
          onClose={() => setCameraMode(null)}
          onCapture={handleCameraCapture}
          title={`Take ${cameraMode} Photo`}
          includeGPS={true}
        />
      )}
    </>
  )
}

export default function PhotoUploadModal(props: PhotoUploadModalProps) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <Dialog open={props.isOpen} onOpenChange={props.onClose}>
        <DialogContent className="bg-red-900/20 border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">Upload Error</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-red-300 text-sm">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={props.onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
              >
                Close
              </Button>
              <Button
                onClick={() => setError(null)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return <PhotoUploadInner {...props} onError={setError} />
}
