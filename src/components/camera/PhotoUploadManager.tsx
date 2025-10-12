import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  MapPin, 
  Clock, 
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/SharedUI/Toast'
import EnhancedCameraCapture from './EnhancedCameraCapture'
import { AdvancedImageProcessor } from '@/utils/advancedImageProcessing'
import { extractMetadata, formatGPSForDisplay } from '@/utils/imageMetadata'

interface PhotoItem {
  id: string
  file: File
  preview: string
  metadata?: any
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error'
  uploadProgress: number
  publicUrl?: string
}

interface PhotoUploadManagerProps {
  jobId: string
  onUploadComplete?: (photos: PhotoItem[]) => void
  maxPhotos?: number
  allowedTypes?: string[]
}

export default function PhotoUploadManager({
  jobId,
  onUploadComplete,
  maxPhotos = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: PhotoUploadManagerProps) {
  const { showToast } = useToast()
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const addPhoto = useCallback((file: File) => {
    if (photos.length >= maxPhotos) {
      showToast(`Maximum ${maxPhotos} photos allowed`, 'error')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Please use JPEG, PNG, or WebP', 'error')
      return
    }

    const photoItem: PhotoItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      metadata: extractMetadata(file),
      uploadStatus: 'pending',
      uploadProgress: 0
    }

    setPhotos(prev => [...prev, photoItem])
  }, [photos.length, maxPhotos, allowedTypes, showToast])

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter(p => p.id !== photoId)
    })
  }, [])

  const uploadPhoto = useCallback(async (photo: PhotoItem): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Update status to uploading
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, uploadStatus: 'uploading', uploadProgress: 0 }
            : p
        ))

        // Process image for optimization
        const processedFile = await AdvancedImageProcessor.processImage(photo.file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: 'jpeg',
          watermark: {
            text: 'GreenScape Lux',
            position: 'bottom-right',
            opacity: 0.3,
            fontSize: 14
          }
        })

        // Upload to Supabase Storage
        const timestamp = Date.now()
        const fileName = `${jobId}/${timestamp}_${processedFile.name}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('job-photos')
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName)

        // Save to database
        const { error: dbError } = await supabase
          .from('job_photos')
          .insert({
            job_id: jobId,
            photo_url: publicUrlData.publicUrl,
            photo_type: 'job_progress',
            metadata: photo.metadata || {},
            file_size: processedFile.size,
            created_at: new Date().toISOString()
          })

        if (dbError) throw dbError

        // Update status to success
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { 
                ...p, 
                uploadStatus: 'success', 
                uploadProgress: 100,
                publicUrl: publicUrlData.publicUrl
              }
            : p
        ))

        resolve()
      } catch (error: any) {
        console.error('Upload failed:', error)
        
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, uploadStatus: 'error', uploadProgress: 0 }
            : p
        ))

        reject(error)
      }
    })
  }, [jobId])

  const uploadAllPhotos = useCallback(async () => {
    const pendingPhotos = photos.filter(p => p.uploadStatus === 'pending')
    if (pendingPhotos.length === 0) return

    setUploading(true)
    
    try {
      await Promise.all(pendingPhotos.map(photo => uploadPhoto(photo)))
      showToast(`Successfully uploaded ${pendingPhotos.length} photos`, 'success')
      onUploadComplete?.(photos)
    } catch (error) {
      showToast('Some photos failed to upload', 'error')
    } finally {
      setUploading(false)
    }
  }, [photos, uploadPhoto, onUploadComplete, showToast])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    files.forEach(addPhoto)
    event.target.value = '' // Reset input
  }, [addPhoto])

  const getStatusIcon = (status: PhotoItem['uploadStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const pendingCount = photos.filter(p => p.uploadStatus === 'pending').length
  const successCount = photos.filter(p => p.uploadStatus === 'success').length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <h3 className="text-lg sm:text-xl font-semibold text-green-300">
            Job Photos ({photos.length}/{maxPhotos})
          </h3>
        </div>
        {successCount > 0 && (
          <Badge variant="outline" className="text-green-400 border-green-400">
            {successCount} uploaded
          </Badge>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={() => setCameraOpen(true)}
          className="flex-1 bg-green-500/20 text-green-200 border border-green-500/50 hover:bg-green-500/30"
          disabled={photos.length >= maxPhotos}
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
        
        <label className="flex-1">
          <Button
            asChild
            variant="outline"
            className="w-full border-green-500/50 text-green-300 hover:bg-green-500/20"
            disabled={photos.length >= maxPhotos}
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </span>
          </Button>
          <input
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload All Button */}
      {pendingCount > 0 && (
        <Button
          onClick={uploadAllPhotos}
          disabled={uploading}
          className="w-full bg-green-500 text-white hover:bg-green-600"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload All ({pendingCount})
            </>
          )}
        </Button>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-black/40 border border-green-500/25 rounded-lg overflow-hidden">
                <img
                  src={photo.preview}
                  alt="Job photo"
                  className="w-full h-full object-cover"
                />
                
                {/* Status overlay */}
                <div className="absolute top-2 left-2">
                  {getStatusIcon(photo.uploadStatus)}
                </div>
                
                {/* Progress bar for uploading */}
                {photo.uploadStatus === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <Progress value={photo.uploadProgress} className="h-1" />
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePhoto(photo.id)}
                    className="p-1 bg-red-600/80 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Metadata */}
              {photo.metadata?.gps && (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-200/70">
                  <MapPin className="w-3 h-3" />
                  <span>{formatGPSForDisplay(photo.metadata.gps).accuracy}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-green-300/50">
          <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm sm:text-base">No photos yet. Take or upload photos to document job progress.</p>
        </div>
      )}

      <EnhancedCameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={addPhoto}
        title="Capture Job Photo"
        includeGPS={true}
      />
    </div>
  )
}