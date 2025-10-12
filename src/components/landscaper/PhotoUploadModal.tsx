import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, Camera, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/SharedUI/Toast"
import { Jobs } from "@/db/contracts"
import { compressImage } from "@/utils/imageCompression"
import CameraCapture from "@/components/mobile/CameraCapture"
import { useMobile } from "@/hooks/use-mobile"
import { offlinePhotoStorage } from "@/services/offlinePhotoStorage"
import { useOfflineSync } from "@/hooks/useOfflineSync"

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  onSuccess: () => void
  onError: (message: string) => void
}

function PhotoUploadInner({ 
  isOpen, 
  onClose, 
  jobId, 
  onSuccess, 
  onError 
  const { showToast } = useToast()
  const { isMobile } = useMobile()
  const { isOnline } = useOfflineSync()
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null)

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error')
      return false
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPG, JPEG, PNG files are allowed', 'error')
      return false
    }
    
    return true
  }

  const handleFileSelect = async (type: 'before' | 'after', file: File) => {
    if (!validateFile(file)) return
    
    try {
      const compressedFile = await compressImage(file)
      if (type === 'before') {
        setBeforeFile(compressedFile)
      } else {
        setAfterFile(compressedFile)
      }
    } catch (error) {
      showToast('Failed to process image', 'error')
      onError('Failed to process image')
    }
  }

  const handleUpload = async () => {
    if (!beforeFile || !afterFile) { 
      showToast('Upload both photos', 'error')
      return 
    }
    
    setLoading(true)
    try {
      const ts = Date.now()
      const put = async (file: File, type: 'before'|'after') => {
        const path = `${jobId}/${ts}_${type}_${file.name}`
        const { error: upErr } = await supabase.storage
          .from('job-photos')
          .upload(path, file, { upsert: false, contentType: file.type })
        
        if (upErr) throw upErr
        
        const { data: pub } = supabase.storage.from('job-photos').getPublicUrl(path)
        const { error: insErr } = await supabase.from('job_photos').insert({
          job_id: jobId, 
          file_url: pub.publicUrl, 
          type, 
          uploaded_at: new Date().toISOString()
        })
        
        if (insErr) throw insErr
      }
      
      await put(beforeFile, 'before')
      await put(afterFile, 'after')

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
      setBeforeFile(null)
      setAfterFile(null)
    } catch (error: any) {
      console.error('[PhotoUpload] fail', { jobId, message: error?.message })
      const errorMsg = error?.message || 'Upload failed'
      showToast(errorMsg, 'error')
      onError(errorMsg)
    } finally { 
      setLoading(false) 
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/95 backdrop-blur border border-green-500/30 text-white max-w-md shadow-2xl shadow-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2 text-xl">
              <Camera className="w-6 h-6" />
              Upload Job Photos with Camera & GPS
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-3">
                Before Photo *
              </label>
              <div className="border-2 border-dashed border-green-500/30 rounded-xl p-6 text-center hover:border-green-400/50 transition-colors">
                {beforeFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm truncate">{beforeFile.name}</span>
                    <Button
                      onClick={() => setBeforeFile(null)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isMobile && (
                      <Button
                        onClick={() => setCameraMode('before')}
                        variant="outline"
                        className="w-full border-green-500/50 text-green-300 hover:bg-green-900/20"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    )}
                    <label className="cursor-pointer block">
                      <Upload className="w-10 h-10 text-green-400/70 mx-auto mb-3" />
                      <p className="text-green-300 text-sm font-medium">
                        {isMobile ? 'Or select from gallery' : 'Click to select before photo'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG • Max 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect('before', e.target.files[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-300 mb-3">
                After Photo *
              </label>
              <div className="border-2 border-dashed border-green-500/30 rounded-xl p-6 text-center hover:border-green-400/50 transition-colors">
                {afterFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 text-sm truncate">{afterFile.name}</span>
                    <Button
                      onClick={() => setAfterFile(null)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isMobile && (
                      <Button
                        onClick={() => setCameraMode('after')}
                        variant="outline"
                        className="w-full border-green-500/50 text-green-300 hover:bg-green-900/20"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    )}
                    <label className="cursor-pointer block">
                      <Upload className="w-10 h-10 text-green-400/70 mx-auto mb-3" />
                      <p className="text-green-300 text-sm font-medium">
                        {isMobile ? 'Or select from gallery' : 'Click to select after photo'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG • Max 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect('after', e.target.files[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!beforeFile || !afterFile || loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg shadow-green-600/25 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload & Complete Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {cameraMode && (
        <CameraCapture
          isOpen={!!cameraMode}
          onClose={() => setCameraMode(null)}
          onCapture={(file) => {
            handleFileSelect(cameraMode, file)
            setCameraMode(null)
          }}
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